import { ScoreDistributionResponse, UserStats, DashboardMetrics } from './types';

class ApiService {
  private static readonly API_URL = 'https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true';

  static async fetchScoreDistribution(): Promise<ScoreDistributionResponse> {
    console.log('🔄 Starting API call to:', this.API_URL);
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Location:', window.location.href);
    
    try {
      console.log('📡 Making fetch request...');
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      console.log('📊 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Data parsed successfully:', {
        hasScoreDistribution: !!data.scoreDistribution,
        itemCount: data.scoreDistribution?.length || 0
      });
      
      return data;
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : {
        message: String(error),
        name: 'UnknownError',
        stack: undefined
      };
      
      console.error('❌ API Error Details:', {
        ...errorDetails,
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        isMobile: /iPhone|iPad|iPod|Android/.test(navigator.userAgent)
      });
      
      // Show user-friendly message on mobile
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert(`📱 Network issue detected on Safari mobile. Using offline data. Error: ${errorDetails.message}`);
      }
      
      console.warn('🔄 Using fallback data due to API error');
      return this.getFallbackData();
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
    
    // Calculate total users and average score
    let totalUsers = 0;
    let totalScore = 0;
    
    distribution.forEach(item => {
      totalUsers += item.userCount;
      totalScore += item.score * item.userCount;
    });
    
    const averageScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0;
    
    // Top 10 scores
    const topScores = distribution
      .filter(item => item.userCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    // Score distributions by ranges
    const scoreRanges = [
      { range: '90-100', count: 0, percentage: 0 },
      { range: '80-89', count: 0, percentage: 0 },
      { range: '70-79', count: 0, percentage: 0 },
      { range: '60-69', count: 0, percentage: 0 },
      { range: '50-59', count: 0, percentage: 0 },
      { range: '0-49', count: 0, percentage: 0 }
    ];
    
    distribution.forEach(item => {
      const score = item.score;
      if (score >= 90) scoreRanges[0].count += item.userCount;
      else if (score >= 80) scoreRanges[1].count += item.userCount;
      else if (score >= 70) scoreRanges[2].count += item.userCount;
      else if (score >= 60) scoreRanges[3].count += item.userCount;
      else if (score >= 50) scoreRanges[4].count += item.userCount;
      else scoreRanges[5].count += item.userCount;
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

export default ApiService;
