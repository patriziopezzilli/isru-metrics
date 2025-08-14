import { ScoreDistributionResponse, UserStats, DashboardMetrics } from './types';

class ApiService {
  private static readonly API_URL = 'https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true';
  private static readonly PROXY_URLS = [
    'https://api.allorigins.win/get?url=' + encodeURIComponent('https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true'),
    'https://cors-anywhere.herokuapp.com/https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true',
    'https://thingproxy.freeboard.io/fetch/https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true'
  ];

  static async fetchScoreDistribution(): Promise<ScoreDistributionResponse> {
    console.log('🔄 Starting API call to:', this.API_URL);
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Location:', window.location.href);
    
    // Try direct API first
    try {
      console.log('📡 Making direct fetch request...');
      const response = await this.makeRequest(this.API_URL);
      
      console.log('📊 Direct Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Direct Data parsed successfully:', {
          hasScoreDistribution: !!data.scoreDistribution,
          itemCount: data.scoreDistribution?.length || 0
        });
        return data;
      } else if (response.status === 403) {
        console.warn('🚫 403 Forbidden - Server blocking requests. Trying proxy...');
        throw new Error(`403 Forbidden: Access denied by server`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('⚠️ Direct API failed, trying proxy...', error);
    }

    // Try proxy APIs as fallback
    for (let i = 0; i < this.PROXY_URLS.length; i++) {
      const proxyUrl = this.PROXY_URLS[i];
      try {
        console.log(`🔄 Trying proxy ${i + 1}:`, proxyUrl);
        const response = await this.makeRequest(proxyUrl);
        
        if (response.ok) {
          const proxyData = await response.json();
          console.log('🔍 Proxy response structure:', proxyData);
          
          // Handle different proxy response formats
          if (proxyUrl.includes('allorigins.win')) {
            console.log('📦 AllOrigins response:', {
              hasStatus: !!proxyData.status,
              hasContents: !!proxyData.contents,
              statusCode: proxyData.status?.http_code,
              contentsType: typeof proxyData.contents
            });
            
            if (proxyData.contents) {
              try {
                // Try to parse contents as JSON
                const data = typeof proxyData.contents === 'string' 
                  ? JSON.parse(proxyData.contents) 
                  : proxyData.contents;
                  
                console.log('✅ AllOrigins Data parsed successfully:', {
                  hasScoreDistribution: !!data.scoreDistribution,
                  itemCount: data.scoreDistribution?.length || 0
                });
                return data;
              } catch (parseError) {
                console.error('❌ Failed to parse AllOrigins contents:', parseError);
                console.log('📄 Raw contents:', proxyData.contents);
              }
            }
          } else if (proxyUrl.includes('cors-anywhere') || proxyUrl.includes('thingproxy')) {
            // Direct JSON response from these proxies
            if (proxyData.scoreDistribution) {
              console.log('✅ Direct Proxy Data parsed successfully:', {
                hasScoreDistribution: !!proxyData.scoreDistribution,
                itemCount: proxyData.scoreDistribution?.length || 0
              });
              return proxyData;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Proxy ${i + 1} failed:`, error);
      }
    }

    // If both fail, use fallback data
    const isMobile = /iPhone|iPad|iPod|Android/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    console.error('❌ All API attempts failed. Using fallback data.');
    
    if (isMobile) {
      alert('📡 ISRU API temporarily unavailable (403 error). Showing sample data. Please try again later or check with ISRU support.');
    }
    
    console.warn('🔄 Using fallback data due to API errors');
    return this.getFallbackData();
  }

  private static async makeRequest(url: string): Promise<Response> {
    // Use simple headers to avoid CORS preflight
    return await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
  }

  static calculateUserStats(username: string, scoreDistribution: ScoreDistributionResponse): UserStats | null {
    const distribution = scoreDistribution.scoreDistribution;
    
    // Find user in distribution
    let userScore = 0;
    let userPosition = 0;
    let totalUsers = 0;
    
    for (let i = 0; i < distribution.length; i++) {
      const item = distribution[i];
      if (item.users) {
        const user = item.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
          userScore = item.score;
          userPosition = totalUsers + 1; // Current position
          break;
        }
        totalUsers += item.users.length;
      } else if (item.hasUsers) {
        totalUsers += item.userCount;
      }
    }

    if (userScore === 0) return null; // User not found

    // Calculate how many users are ahead
    let usersAhead = 0;
    for (const item of distribution) {
      if (item.score > userScore) {
        usersAhead += item.userCount;
      }
    }

    // Calculate win probability based on stock of 1500
    const stockEstimate = 1500;
    const winProbability = Math.max(0, Math.min(100, 
      ((stockEstimate - usersAhead) / stockEstimate) * 100
    ));

    return {
      username,
      position: userPosition,
      rank: userPosition,
      usersAhead,
      winProbability: Math.round(winProbability * 100) / 100,
      score: userScore
    };
  }

  static calculateDashboardMetrics(scoreDistribution: ScoreDistributionResponse): DashboardMetrics {
    const distribution = scoreDistribution.scoreDistribution;
    
    // Use totalUsers from API response if available, fallback to calculation
    const totalUsers = scoreDistribution.totalUsers || distribution.reduce((sum, item) => sum + item.userCount, 0);
    
    // Calculate average score using percentage-weighted approach
    let weightedScore = 0;
    
    distribution.forEach(item => {
      if (item.percentage > 0) {
        // Use percentage to estimate user count for this score
        const estimatedUsers = Math.round((item.percentage / 100) * totalUsers);
        weightedScore += item.score * estimatedUsers;
      } else if (item.userCount > 0) {
        // Fallback to userCount if percentage is 0 but userCount exists
        weightedScore += item.score * item.userCount;
      }
    });
    
    const averageScore = totalUsers > 0 ? Math.round(weightedScore / totalUsers) : 0;
    
    // Top 10 scores - prioritize items with users, either by userCount or hasUsers flag
    const topScores = distribution
      .filter(item => item.userCount > 0 || item.hasUsers)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    // Get min and max scores from the data for dynamic ranges
    const minScore = scoreDistribution.minScore || Math.min(...distribution.map(item => item.score));
    const maxScore = scoreDistribution.maxScore || Math.max(...distribution.map(item => item.score));
    
    // Create dynamic score ranges based on actual data
    const rangeSize = Math.ceil((maxScore - minScore) / 6); // 6 ranges
    const scoreRanges: { range: string; count: number; percentage: number }[] = [];
    
    for (let i = 0; i < 6; i++) {
      const rangeStart = maxScore - (i + 1) * rangeSize;
      const rangeEnd = maxScore - i * rangeSize;
      const actualStart = Math.max(rangeStart, minScore);
      const actualEnd = i === 0 ? maxScore : rangeEnd - 1;
      
      scoreRanges.push({
        range: `${actualStart}-${actualEnd}`,
        count: 0,
        percentage: 0
      });
    }
    
    // Fill ranges with data
    distribution.forEach(item => {
      const score = item.score;
      const userCount = item.userCount > 0 ? item.userCount : Math.round((item.percentage / 100) * totalUsers);
      
      // Find which range this score belongs to
      for (let i = 0; i < scoreRanges.length; i++) {
        const rangeStart = maxScore - (i + 1) * rangeSize;
        const rangeEnd = maxScore - i * rangeSize;
        const actualStart = Math.max(rangeStart, minScore);
        
        if ((i === scoreRanges.length - 1 && score >= actualStart) || 
            (score >= actualStart && score < rangeEnd)) {
          scoreRanges[i].count += userCount;
          break;
        }
      }
    });
    
    // Calculate percentages
    scoreRanges.forEach(range => {
      range.percentage = totalUsers > 0 ? Math.round((range.count / totalUsers) * 100) : 0;
    });
    
    return {
      totalUsers,
      averageScore,
      topScores,
      scoreRanges
    };
  }

  private static getFallbackData(): ScoreDistributionResponse {
    return {
      scoreDistribution: [
        {
          score: 100,
          userCount: 45,
          percentage: 2.1,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true,
          users: [
            { 
              id: 1, 
              username: 'testuser', 
              firstName: 'Test', 
              lastName: 'User',
              profilePhotoData: { image: '' }
            }
          ]
        },
        {
          score: 99,
          userCount: 78,
          percentage: 3.6,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 98,
          userCount: 123,
          percentage: 5.7,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 97,
          userCount: 156,
          percentage: 7.2,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 96,
          userCount: 189,
          percentage: 8.8,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 95,
          userCount: 234,
          percentage: 10.9,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 94,
          userCount: 287,
          percentage: 13.3,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 93,
          userCount: 345,
          percentage: 16.0,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 92,
          userCount: 298,
          percentage: 13.8,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        },
        {
          score: 91,
          userCount: 245,
          percentage: 11.4,
          isUserScore: false,
          countsHidden: false,
          hasUsers: true
        }
      ]
    };
  }
}

// Export static functions for easier import
export const fetchScoreDistribution = ApiService.fetchScoreDistribution.bind(ApiService);
export const calculateUserStats = ApiService.calculateUserStats.bind(ApiService);
export const calculateDashboardMetrics = ApiService.calculateDashboardMetrics.bind(ApiService);

// SneakerDB API helper with proxy support
export const fetchSneakerDBProfile = async (username: string): Promise<any> => {
  const directUrl = `https://tools.sneakerdb.net/api/isrucamp-user-profile/${username}`;
  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
    `https://cors-anywhere.herokuapp.com/${directUrl}`,
    `https://thingproxy.freeboard.io/fetch/${directUrl}`
  ];

  console.log('👤 Starting SneakerDB API call for:', username);

  // Try direct API first
  try {
    console.log('📡 Making direct SneakerDB request...');
    const response = await fetch(directUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SneakerDB Direct Data parsed successfully');
      return data;
    }
  } catch (error) {
    console.warn('⚠️ Direct SneakerDB API failed, trying proxies...', error);
  }

  // Try proxy APIs as fallback
  for (let i = 0; i < proxyUrls.length; i++) {
    const proxyUrl = proxyUrls[i];
    try {
      console.log(`🔄 Trying SneakerDB proxy ${i + 1}:`, proxyUrl);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });

      if (response.ok) {
        const proxyData = await response.json();
        console.log('🔍 SneakerDB Proxy response structure:', proxyData);

        // Handle different proxy response formats
        if (proxyUrl.includes('allorigins.win')) {
          console.log('📦 SneakerDB AllOrigins response:', {
            hasContents: !!proxyData.contents,
            contentsType: typeof proxyData.contents
          });

          if (proxyData.contents) {
            try {
              const data = typeof proxyData.contents === 'string' 
                ? JSON.parse(proxyData.contents) 
                : proxyData.contents;
                
              console.log('✅ SneakerDB AllOrigins Data parsed successfully');
              return data;
            } catch (parseError) {
              console.error('❌ Failed to parse SneakerDB AllOrigins contents:', parseError);
            }
          }
        } else if (proxyUrl.includes('cors-anywhere') || proxyUrl.includes('thingproxy')) {
          // Direct JSON response from these proxies
          if (proxyData && typeof proxyData === 'object') {
            console.log('✅ SneakerDB Direct Proxy Data parsed successfully');
            return proxyData;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ SneakerDB Proxy ${i + 1} failed:`, error);
    }
  }

  throw new Error('All SneakerDB API attempts failed');
};

// Test function to check API availability
export const testApiConnectivity = async (): Promise<{direct: boolean, proxy: boolean, error?: string}> => {
  const result = {direct: false, proxy: false, error: ''};
  
  // Test direct API
  try {
    const response = await fetch('https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true', {
      method: 'HEAD',
      mode: 'cors'
    });
    result.direct = response.ok;
  } catch (error) {
    result.error += `Direct API failed: ${error instanceof Error ? error.message : String(error)}. `;
  }
  
  // Test proxy API
  try {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true');
    const response = await fetch(proxyUrl, {
      method: 'HEAD',
      mode: 'cors'
    });
    result.proxy = response.ok;
  } catch (error) {
    result.error += `Proxy API failed: ${error instanceof Error ? error.message : String(error)}. `;
  }
  
  return result;
};

// New search function for users
export const searchUsers = (query: string, scoreDistribution: ScoreDistributionResponse): any[] => {
  if (!query.trim()) return [];
  
  const searchQuery = query.toLowerCase();
  const results: any[] = [];
  
  scoreDistribution.scoreDistribution.forEach((item, scoreIndex) => {
    if (item.users) {
      item.users.forEach((user, userIndex) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const username = user.username.toLowerCase();
        
        if (username.includes(searchQuery) || fullName.includes(searchQuery)) {
          results.push({
            ...user,
            score: item.score,
            position: scoreIndex * 10 + userIndex + 1 // Rough position estimation
          });
        }
      });
    }
  });
  
  return results.slice(0, 10); // Limit to 10 results
};

// Function to calculate user ranking position and percentage
export const calculateUserRanking = (userScore: number, scoreDistribution: ScoreDistributionResponse) => {
  const distribution = scoreDistribution.scoreDistribution;
  const totalUsers = scoreDistribution.totalUsers || 0;
  
  if (totalUsers === 0) return { position: 0, percentage: 0, usersAbove: 0 };
  
  let usersAbove = 0;
  
  // Count users with higher scores
  distribution.forEach(item => {
    if (item.score > userScore) {
      // Use percentage to estimate user count for this score
      const estimatedUsers = item.userCount > 0 ? item.userCount : Math.round((item.percentage / 100) * totalUsers);
      usersAbove += estimatedUsers;
    }
  });
  
  const position = usersAbove + 1;
  const percentageAbove = Math.round((usersAbove / totalUsers) * 100);
  const percentageBelow = 100 - percentageAbove;
  
  return {
    position,
    percentageAbove,
    percentageBelow,
    usersAbove,
    totalUsers
  };
};

export default ApiService;
