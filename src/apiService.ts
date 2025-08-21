import { ScoreDistributionResponse, UserStats, DashboardMetrics } from './types';
import OfflineService from './services/offlineService';

// Cache system for user-related API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly CACHE_DURATION = 20000; // 20 secondi in millisecondi

  static set<T>(key: string, data: T, customDuration?: number): void {
    const now = Date.now();
    const duration = customDuration || this.CACHE_DURATION;
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + duration
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

class ApiService {
  private static readonly API_URL = 'https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true';
  
  // Proxy proprietario come prima opzione
  private static readonly PROXY_URLS = [
    // 🏆 Proxy universale proprietario - Massima velocità e affidabilità
    '/api/universal-proxy?api=isru-leaderboard',
    // Backup specifico
    '/api/isru-proxy',
    // Backup proxy esterni (solo se necessario)
    'https://api.allorigins.win/get?url=' + encodeURIComponent('https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true'),
    'https://proxy.cors.sh/https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true',
    'https://api.codetabs.com/v1/proxy?quest=https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true',
    'https://thingproxy.freeboard.io/fetch/https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true',
    'https://cors-anywhere.herokuapp.com/https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true'
  ];

  // Test function to check direct API call without proxy
  static async testDirectApiCall(): Promise<void> {
    console.log('🧪 Testing direct API call without proxy...');
    console.log('🎯 Target URL:', this.API_URL);
    
    try {
      // Test 1: Basic fetch
      console.log('📞 Test 1: Basic fetch call');
      const response1 = await fetch(this.API_URL);
      console.log('✅ Test 1 Response:', {
        status: response1.status,
        statusText: response1.statusText,
        headers: Object.fromEntries(response1.headers.entries()),
        ok: response1.ok
      });
      
      if (response1.ok) {
        const data1 = await response1.json();
        console.log('✅ Test 1 Data received:', !!data1.scoreDistribution);
        return;
      }
    } catch (error) {
      console.log('❌ Test 1 Error:', error);
    }
    
    try {
      // Test 2: With CORS headers
      console.log('📞 Test 2: With custom headers');
      const response2 = await fetch(this.API_URL, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'I.S.R.U-League-App/1.0',
          'Referer': 'https://isrucamp.com',
        }
      });
      console.log('✅ Test 2 Response:', {
        status: response2.status,
        statusText: response2.statusText,
        ok: response2.ok
      });
      
      if (response2.ok) {
        const data2 = await response2.json();
        console.log('✅ Test 2 Data received:', !!data2.scoreDistribution);
        return;
      }
    } catch (error) {
      console.log('❌ Test 2 Error:', error);
    }
    
    try {
      // Test 3: no-cors mode (will return opaque response)
      console.log('📞 Test 3: no-cors mode');
      const response3 = await fetch(this.API_URL, {
        method: 'GET',
        mode: 'no-cors',
      });
      console.log('✅ Test 3 Response:', {
        status: response3.status,
        statusText: response3.statusText,
        type: response3.type,
        ok: response3.ok
      });
    } catch (error) {
      console.log('❌ Test 3 Error:', error);
    }
    
    console.log('🏁 Direct API test completed. Check console for results.');
  }

  static async fetchScoreDistribution(): Promise<ScoreDistributionResponse> {
    console.log('🔄 Starting API call with proxy-first strategy');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Location:', window.location.href);
    
    // Check if we should use offline data
    const offlineData = OfflineService.loadOfflineData();
    if (OfflineService.shouldUseOfflineData() && offlineData && !OfflineService.isDataExpired(offlineData.lastUpdate)) {
      console.log('📱 Using offline data due to poor connection');
      return offlineData.scoreDistribution;
    }
    
    // Use proxy APIs directly to avoid CORS issues
    for (let i = 0; i < this.PROXY_URLS.length; i++) {
      const proxyUrl = this.PROXY_URLS[i];
      try {
        console.log(`🔄 Trying proxy ${i + 1}:`, proxyUrl);
        const response = await this.makeRequest(proxyUrl);
        
        if (response.ok) {
          const proxyData = await response.json();
          console.log('🔍 Proxy response structure:', proxyData);
          
          // Handle different proxy response formats
          if (proxyUrl.includes('/api/universal-proxy')) {
            // 🏆 Proxy universale proprietario - Risposta diretta e pulita
            if (proxyData.scoreDistribution) {
              console.log('✅ Universal Proxy Data parsed successfully:', {
                hasScoreDistribution: !!proxyData.scoreDistribution,
                itemCount: proxyData.scoreDistribution?.length || 0,
                proxyVersion: proxyData._proxy?.version || 'unknown',
                apiType: proxyData._proxy?.api || 'unknown'
              });
              
              // Save to offline storage
              OfflineService.saveOfflineData(proxyData);
              
              return proxyData;
            }
          } else if (proxyUrl.includes('/api/isru-proxy')) {
            // 🏆 Proxy proprietario - Risposta diretta e pulita
            if (proxyData.scoreDistribution) {
              console.log('✅ Proprietary Proxy Data parsed successfully:', {
                hasScoreDistribution: !!proxyData.scoreDistribution,
                itemCount: proxyData.scoreDistribution?.length || 0,
                proxyVersion: proxyData._proxy?.version || 'unknown'
              });
              
              // Save to offline storage
              OfflineService.saveOfflineData(proxyData);
              
              return proxyData;
            }
          } else if (proxyUrl.includes('allorigins.win')) {
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
                
                // Save to offline storage
                OfflineService.saveOfflineData(data);
                
                return data;
              } catch (parseError) {
                console.error('❌ Failed to parse AllOrigins contents:', parseError);
                console.log('📄 Raw contents:', proxyData.contents);
              }
            }
          } else if (proxyUrl.includes('cors-anywhere') || proxyUrl.includes('thingproxy') || proxyUrl.includes('cors.sh') || proxyUrl.includes('codetabs')) {
            // Direct JSON response from these proxies
            if (proxyData.scoreDistribution) {
              console.log('✅ Direct Proxy Data parsed successfully:', {
                hasScoreDistribution: !!proxyData.scoreDistribution,
                itemCount: proxyData.scoreDistribution?.length || 0
              });
              
              // Save to offline storage
              OfflineService.saveOfflineData(proxyData);
              
              return proxyData;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Proxy ${i + 1} failed:`, error);
      }
    }

    // If all proxies fail, try offline data as fallback
    if (offlineData) {
      console.log('📱 All proxies failed, using offline data as fallback');
      return offlineData.scoreDistribution;
    }

    // If both fail, use fallback data
    const isMobile = /iPhone|iPad|iPod|Android/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    console.error('❌ All API attempts failed. Using fallback data.');
    
    if (isMobile) {
      alert('📡 I.S.R.U API temporarily unavailable (403 error). Showing sample data. Please try again later or check with I.S.R.U support.');
    }
    
    console.warn('🔄 Using fallback data due to API errors');
    const fallbackData = this.getFallbackData();
    
    // Save fallback data to offline storage
    OfflineService.saveOfflineData(fallbackData);
    
    return fallbackData;
  }

  private static async makeRequest(url: string): Promise<Response> {
    // Timeout ottimizzato per proxy più veloci
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondi invece di default

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
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
export const testDirectApiCall = ApiService.testDirectApiCall.bind(ApiService);

// Auto-cleanup expired cache entries every 30 seconds
setInterval(() => {
  CacheService.cleanExpired();
}, 30000);

// SneakerDB API helper with proxy support and caching
export const fetchSneakerDBProfile = async (username: string): Promise<any> => {
  const cacheKey = `sneakerdb_profile_${username.toLowerCase()}`;
  
  // Check cache first
  const cachedData = CacheService.get(cacheKey);
  if (cachedData) {
    console.log(`📦 Using cached SneakerDB profile for: ${username}`);
    return cachedData;
  }

  const directUrl = `https://tools.sneakerdb.net/api/isrucamp-user-profile/${username}`;
  const proxyUrls = [
    // 🏆 Proxy universale proprietario - Massima velocità e affidabilità
    `/api/universal-proxy?api=sneakerdb-profile&username=${encodeURIComponent(username)}`,
    // Backup specifico
    `/api/sneakerdb-proxy?username=${encodeURIComponent(username)}`,
    // Backup proxy esterni (solo se necessario)
    `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
    `https://proxy.cors.sh/${directUrl}`,
    `https://api.codetabs.com/v1/proxy?quest=${directUrl}`,
    `https://thingproxy.freeboard.io/fetch/${directUrl}`,
    `https://cors-anywhere.herokuapp.com/${directUrl}`
  ];

  console.log('👤 Starting SneakerDB API call for:', username);

  // Use proxy APIs directly to avoid CORS issues
  for (let i = 0; i < proxyUrls.length; i++) {
    const proxyUrl = proxyUrls[i];
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      console.log(`🔄 Trying SneakerDB proxy ${i + 1}:`, proxyUrl);
      
      // Timeout ottimizzato per SneakerDB
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 6000); // 6 secondi per profili
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const proxyData = await response.json();
        console.log('🔍 SneakerDB Proxy response structure:', proxyData);

        // Handle different proxy response formats
        if (proxyUrl.includes('/api/universal-proxy')) {
          // 🏆 Proxy universale proprietario - Risposta diretta e pulita
          console.log('✅ SneakerDB Universal Proxy Data received:', {
            hasData: !!proxyData,
            proxyVersion: proxyData._proxy?.version || 'unknown',
            apiType: proxyData._proxy?.api || 'unknown'
          });
          
          // Cache the successful response
          CacheService.set(cacheKey, proxyData);
          return proxyData;
        } else if (proxyUrl.includes('/api/sneakerdb-proxy')) {
          // 🏆 Proxy proprietario - Risposta diretta e pulita
          console.log('✅ SneakerDB Proprietary Proxy Data received:', {
            hasData: !!proxyData,
            proxyVersion: proxyData._proxy?.version || 'unknown'
          });
          
          // Cache the successful response
          CacheService.set(cacheKey, proxyData);
          return proxyData;
        } else if (proxyUrl.includes('allorigins.win')) {
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
              // Cache the successful response
              CacheService.set(cacheKey, data);
              return data;
            } catch (parseError) {
              console.error('❌ Failed to parse SneakerDB AllOrigins contents:', parseError);
            }
          }
        } else if (proxyUrl.includes('cors-anywhere') || proxyUrl.includes('thingproxy') || proxyUrl.includes('cors.sh') || proxyUrl.includes('codetabs')) {
          // Direct JSON response from these proxies
          if (proxyData && typeof proxyData === 'object') {
            console.log('✅ SneakerDB Direct Proxy Data parsed successfully');
            // Cache the successful response
            CacheService.set(cacheKey, proxyData);
            return proxyData;
          }
        }
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
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

// New search function for users with caching
export const searchUsers = (query: string, scoreDistribution: ScoreDistributionResponse): any[] => {
  if (!query.trim()) return [];
  
  // Use query and timestamp as cache key for search results
  const cacheKey = `user_search_${query.toLowerCase().trim()}`;
  const cachedResults = CacheService.get<any[]>(cacheKey);
  
  if (cachedResults) {
    console.log(`📦 Using cached search results for: ${query}`);
    return cachedResults;
  }
  
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
  
  const limitedResults = results.slice(0, 10); // Limit to 10 results
  
  // Cache the search results for 15 seconds (shorter cache for searches)
  CacheService.set(cacheKey, limitedResults, 15000);
  
  return limitedResults;
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
