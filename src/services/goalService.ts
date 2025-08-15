import { UserGoal, GoalProgress, GoalPrediction, UserStats } from '../types';

class GoalService {
  private static readonly GOALS_STORAGE_KEY = 'isru-goals';
  private static readonly PROGRESS_HISTORY_KEY = 'isru-progress-history';

  // Create a new goal
  static createGoal(userId: string, targetPosition: number, targetDate?: Date): UserGoal {
    const goal: UserGoal = {
      id: this.generateId(),
      userId,
      targetPosition,
      createdAt: new Date(),
      targetDate,
      isActive: true
    };

    const existingGoals = this.getGoals(userId);
    // Deactivate previous goals
    existingGoals.forEach(g => g.isActive = false);
    
    const updatedGoals = [...existingGoals, goal];
    this.saveGoals(userId, updatedGoals);
    
    console.log('🎯 Goal created:', goal);
    return goal;
  }

  // Get user goals
  static getGoals(userId: string): UserGoal[] {
    try {
      const stored = localStorage.getItem(`${this.GOALS_STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored).map((g: any) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
        achievedAt: g.achievedAt ? new Date(g.achievedAt) : undefined
      })) : [];
    } catch (error) {
      console.error('Error loading goals:', error);
      return [];
    }
  }

  // Get active goal
  static getActiveGoal(userId: string): UserGoal | null {
    const goals = this.getGoals(userId);
    return goals.find(g => g.isActive) || null;
  }

  // Calculate goal progress
  static calculateProgress(goal: UserGoal, currentStats: UserStats): GoalProgress {
    const positionsToGo = Math.max(0, currentStats.position - goal.targetPosition);
    const progressPercentage = Math.min(100, Math.max(0, 
      ((goal.targetPosition - currentStats.position) / goal.targetPosition) * 100
    ));

    const history = this.getProgressHistory(goal.userId);
    const recentHistory = history.slice(-7); // Last 7 entries
    
    let dailyProgressNeeded = 0;
    let estimatedDaysToAchieve;
    let isOnTrack = false;

    if (goal.targetDate && positionsToGo > 0) {
      const daysRemaining = Math.max(1, Math.ceil(
        (goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ));
      dailyProgressNeeded = positionsToGo / daysRemaining;
    }

    if (recentHistory.length >= 2) {
      const avgDailyProgress = this.calculateAverageProgress(recentHistory);
      if (avgDailyProgress > 0) {
        estimatedDaysToAchieve = Math.ceil(positionsToGo / avgDailyProgress);
        isOnTrack = avgDailyProgress >= dailyProgressNeeded;
      }
    }

    return {
      currentPosition: currentStats.position,
      targetPosition: goal.targetPosition,
      positionsToGo,
      progressPercentage,
      estimatedDaysToAchieve,
      dailyProgressNeeded,
      isOnTrack
    };
  }

  // Generate predictions
  static generatePrediction(goal: UserGoal, currentStats: UserStats): GoalPrediction {
    const history = this.getProgressHistory(goal.userId);
    const progress = this.calculateProgress(goal, currentStats);
    
    let likelihood: 'high' | 'medium' | 'low' = 'medium';
    let confidence = 50;
    const factors: string[] = [];

    // Analyze historical data
    if (history.length >= 7) {
      const recentProgress = this.calculateAverageProgress(history.slice(-7));
      const trend = this.calculateTrend(history.slice(-14));
      
      if (recentProgress > progress.dailyProgressNeeded * 1.2) {
        likelihood = 'high';
        confidence = Math.min(95, confidence + 30);
        factors.push('Excellent recent progress');
      } else if (recentProgress < progress.dailyProgressNeeded * 0.5) {
        likelihood = 'low';
        confidence = Math.max(10, confidence - 30);
        factors.push('Below required pace');
      }

      if (trend > 0) {
        confidence += 15;
        factors.push('Improving trend');
      } else if (trend < 0) {
        confidence -= 15;
        factors.push('Declining trend');
      }
    }

    // Factor in goal difficulty
    const positionImprovement = progress.positionsToGo / currentStats.position;
    if (positionImprovement > 0.5) {
      likelihood = 'low';
      confidence -= 20;
      factors.push('Ambitious target');
    } else if (positionImprovement < 0.1) {
      confidence += 10;
      factors.push('Achievable target');
    }

    // Calculate estimated achievement date
    const estimatedAchievementDate = new Date();
    if (progress.estimatedDaysToAchieve) {
      estimatedAchievementDate.setDate(estimatedAchievementDate.getDate() + progress.estimatedDaysToAchieve);
    } else {
      estimatedAchievementDate.setDate(estimatedAchievementDate.getDate() + 30); // Default fallback
    }

    return {
      likelihood,
      estimatedAchievementDate,
      requiredDailyImprovement: progress.dailyProgressNeeded,
      confidence: Math.max(5, Math.min(95, confidence)),
      factors
    };
  }

  // Save progress entry
  static saveProgressEntry(userId: string, position: number, score: number): void {
    const history = this.getProgressHistory(userId);
    const today = new Date().toDateString();
    
    // Remove today's entry if exists and add new one
    const filteredHistory = history.filter(entry => 
      new Date(entry.date).toDateString() !== today
    );
    
    filteredHistory.push({
      date: new Date(),
      position,
      score
    });

    // Keep last 30 days only
    const recent = filteredHistory.slice(-30);
    
    try {
      localStorage.setItem(`${this.PROGRESS_HISTORY_KEY}_${userId}`, JSON.stringify(recent));
    } catch (error) {
      console.error('Error saving progress history:', error);
    }
  }

  // Check if goal is achieved
  static checkGoalAchieved(goal: UserGoal, currentStats: UserStats): boolean {
    if (goal.isActive && currentStats.position <= goal.targetPosition) {
      // Mark goal as achieved
      goal.achievedAt = new Date();
      goal.isActive = false;
      
      const goals = this.getGoals(goal.userId);
      const updatedGoals = goals.map(g => g.id === goal.id ? goal : g);
      this.saveGoals(goal.userId, updatedGoals);
      
      console.log('🎉 Goal achieved!', goal);
      return true;
    }
    return false;
  }

  // Private helper methods
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static saveGoals(userId: string, goals: UserGoal[]): void {
    try {
      localStorage.setItem(`${this.GOALS_STORAGE_KEY}_${userId}`, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }

  private static getProgressHistory(userId: string): Array<{date: Date, position: number, score: number}> {
    try {
      const stored = localStorage.getItem(`${this.PROGRESS_HISTORY_KEY}_${userId}`);
      return stored ? JSON.parse(stored).map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      })) : [];
    } catch (error) {
      console.error('Error loading progress history:', error);
      return [];
    }
  }

  private static calculateAverageProgress(history: Array<{date: Date, position: number, score: number}>): number {
    if (history.length < 2) return 0;
    
    const sortedHistory = history.sort((a, b) => a.date.getTime() - b.date.getTime());
    const first = sortedHistory[0];
    const last = sortedHistory[sortedHistory.length - 1];
    
    const positionImprovement = first.position - last.position; // Positive = improvement
    const daysDiff = Math.max(1, (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24));
    
    return positionImprovement / daysDiff;
  }

  private static calculateTrend(history: Array<{date: Date, position: number, score: number}>): number {
    if (history.length < 3) return 0;
    
    const sortedHistory = history.sort((a, b) => a.date.getTime() - b.date.getTime());
    const halfPoint = Math.floor(sortedHistory.length / 2);
    
    const firstHalfAvg = sortedHistory.slice(0, halfPoint)
      .reduce((sum, entry) => sum + entry.position, 0) / halfPoint;
    
    const secondHalfAvg = sortedHistory.slice(halfPoint)
      .reduce((sum, entry) => sum + entry.position, 0) / (sortedHistory.length - halfPoint);
    
    return firstHalfAvg - secondHalfAvg; // Positive = improving (lower position is better)
  }
}

export default GoalService;
