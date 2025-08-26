// =====================================================
// POSITION CALCULATOR SERVICE
// Calcola la posizione accurata di un utente nella leaderboard
// Usa la stessa logica del PositionFinder
// =====================================================

export interface AccurateRanking {
  position: number;
  totalPages: number;
  isExact: boolean;
  totalPoints: number;
  username: string;
  usersWithSameScore?: number;
  usersAbove: number;
  totalUsers: number;
  percentageAbove: number;
}

export class PositionCalculatorService {
  
  /**
   * Calcola la posizione accurata di un utente cercando nella leaderboard
   * Usa la stessa logica del PositionFinder per garantire coerenza
   */
  static async calculateAccuratePosition(
    username: string, 
    userPoints: number,
    onProgress?: (progress: number, searchedUsers: number) => void
  ): Promise<AccurateRanking | null> {
    
    try {
      console.log(`🔍 Calculating accurate position for ${username} with ${userPoints} points...`);
      
      const targetUsername = username.toLowerCase();
      const limit = 100;
      let position = 0;
      let found = false;
      let page = 1;
      let totalSearched = 0;

      while (!found && page <= 500) { // Safety limit: max 500 pages (50k users)
        try {
          if (onProgress) {
            const progress = Math.min(95, (page - 1) * 2); // Max 95% during search
            onProgress(progress, totalSearched);
          }

          const response = await fetch(
            `/api/universal-proxy?api=isru-leaderboard-pages&page=${page}&limit=${limit}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (!data.results || data.results.length === 0) {
            console.log(`📄 Page ${page}: No more results, user not found`);
            break;
          }

          console.log(`📄 Page ${page}: Searching ${data.results.length} users...`);
          totalSearched += data.results.length;

          // Cerca l'utente in questa pagina
          for (let i = 0; i < data.results.length; i++) {
            const user = data.results[i];
            
            if (user.username.toLowerCase() === targetUsername) {
              position = (page - 1) * limit + i + 1;
              found = true;
              
              // Count ALL users with the same score across the entire leaderboard
              console.log(`🔍 Counting all users with ${user.totalPoints} points...`);
              const usersWithSameScore = await this.countUsersWithSameScore(user.totalPoints);
              
              const result: AccurateRanking = {
                position,
                totalPages: page,
                isExact: true,
                totalPoints: user.totalPoints,
                username: user.username,
                usersWithSameScore,
                usersAbove: position - 1,
                totalUsers: totalSearched + (data.results.length * (page - 1)), // Estimate
                percentageAbove: Math.round(((position - 1) / (totalSearched + (data.results.length * (page - 1)))) * 100)
              };
              
              console.log(`🎯 Found ${targetUsername} at position ${position}! Total users with same score: ${usersWithSameScore}`);
              
              if (onProgress) {
                onProgress(100, totalSearched);
              }
              
              return result;
            }
          }

          page++;
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (pageError) {
          console.warn(`⚠️ Error fetching page ${page}:`, pageError);
          break;
        }
      }

      // User not found
      console.log(`❌ User ${username} not found in leaderboard after searching ${totalSearched} users`);
      
      if (onProgress) {
        onProgress(100, totalSearched);
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error calculating accurate position:', error);
      throw error;
    }
  }

  /**
   * Conta tutti gli utenti con lo stesso punteggio nella leaderboard
   * Stessa logica del PositionFinder
   */
  private static async countUsersWithSameScore(targetPoints: number): Promise<number> {
    try {
      console.log(`🔍 Searching for all users with ${targetPoints} points...`);
      const limit = 100;
      let totalCount = 0;
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages && currentPage <= 50) { // Safety limit: max 50 pages (100k users)
        try {
          const response = await fetch(
            `/api/universal-proxy?api=isru-leaderboard-pages&page=${currentPage}&limit=${limit}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            }
          );
          
          if (!response.ok) {
            console.warn(`⚠️ Failed to fetch page ${currentPage} for score counting`);
            break;
          }
          
          const data = await response.json();
          
          if (!data.results || data.results.length === 0) {
            hasMorePages = false;
            break;
          }
          
          // Count users with same score on this page
          let pageCount = 0;
          for (const user of data.results) {
            if (user.totalPoints === targetPoints) {
              pageCount++;
            }
          }
          
          totalCount += pageCount;
          console.log(`📄 Page ${currentPage}: found ${pageCount} users with ${targetPoints} points (total so far: ${totalCount})`);
          
          // If no users with target score on this page, we might be done
          // (assuming leaderboard is sorted by score descending)
          if (pageCount === 0) {
            // Check if we've gone past the target score
            const maxScoreOnPage = Math.max(...data.results.map((u: any) => u.totalPoints));
            
            if (maxScoreOnPage < targetPoints) {
              // We've gone past the target score, stop searching
              console.log(`🛑 Reached scores below target (${maxScoreOnPage} < ${targetPoints}), stopping search`);
              hasMorePages = false;
              break;
            }
          }
          
          currentPage++;
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (pageError) {
          console.warn(`⚠️ Error fetching page ${currentPage}:`, pageError);
          break;
        }
      }
      
      console.log(`✅ Total users with ${targetPoints} points: ${totalCount}`);
      return totalCount;
      
    } catch (error) {
      console.error('❌ Error counting users with same score:', error);
      return 1; // Fallback: at least the user we found
    }
  }

  /**
   * Calcola una stima veloce della posizione basata sui dati di distribuzione
   * Fallback se il calcolo accurato fallisce
   */
  static calculateEstimatedPosition(userPoints: number, scoreDistribution: any): AccurateRanking | null {
    if (!scoreDistribution || !scoreDistribution.distribution) {
      return null;
    }

    let usersAbove = 0;
    let totalUsers = 0;

    for (const bucket of scoreDistribution.distribution) {
      totalUsers += bucket.count;
      if (bucket.minScore > userPoints) {
        usersAbove += bucket.count;
      }
    }

    const position = usersAbove + 1;
    const percentageAbove = totalUsers > 0 ? Math.round((usersAbove / totalUsers) * 100) : 0;

    return {
      position,
      totalPages: 1,
      isExact: false, // Estimated
      totalPoints: userPoints,
      username: '',
      usersAbove,
      totalUsers,
      percentageAbove
    };
  }
}
