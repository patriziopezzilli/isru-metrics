// Tipi per l'API ISRU
export interface UserProfile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePhotoData: {
    image: string;
  };
}

// Tipi per il profilo utente da SneakerDB
export interface SneakerDBUserProfile {
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl: string;
    profilePhotoData: {
      id: number;
      image: string;
      idCardImageUrl: string | null;
      caption: string;
      isPublic: boolean;
      createdAt: string;
      updatedAt: string;
    };
    totalPoints: number;
    dateJoined: string;
    idNumber: string;
    profileExcellenceRank: string | null;
    profileExcellenceCategories: string[];
    excellenceAwardsCount: number;
  };
  activities: Array<{
    activityId: number;
    activityTitle: string;
    activityBadgeImage: string;
    activityWeek: number;
    activitySubheadWhenNew: string;
    activitySubheadWhenViewed: string;
    activitySubheadWhenNotCompletedToday: string;
    activitySubheadWhenCompletedToday: string;
    activitySubheadWhenLapsed: string;
    isParticipating: boolean;
    releaseDate: string;
    participationId: number;
    dateStarted: string;
    level: number;
    hasSubmittedToday: boolean;
    hasSubmittedYesterday: boolean;
  }>;
  completedModules: Array<{
    id: string;
    name: string;
    badgeText: string;
    badgeIcon: string;
  }>;
}

export interface ScoreDistributionItem {
  score: number;
  userCount: number;
  percentage: number;
  isUserScore: boolean;
  countsHidden: boolean;
  hasUsers?: boolean;
  users?: UserProfile[];
}

export interface ScoreDistributionResponse {
  scoreDistribution: ScoreDistributionItem[];
  totalUsers?: number;
  minScore?: number;
  maxScore?: number;
}

export interface UserStats {
  username: string;
  position: number;
  rank: number;
  usersAhead: number;
  winProbability: number;
  score: number;
}

export interface DashboardMetrics {
  totalUsers: number;
  averageScore: number;
  topScores: ScoreDistributionItem[];
  scoreRanges: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

// Goal Tracker Types
export interface UserGoal {
  id: string;
  userId: string;
  targetPosition: number;
  targetScore?: number;
  createdAt: Date;
  targetDate?: Date;
  isActive: boolean;
  achievedAt?: Date;
}

export interface GoalProgress {
  currentPosition: number;
  targetPosition: number;
  positionsToGo: number;
  progressPercentage: number;
  estimatedDaysToAchieve?: number;
  dailyProgressNeeded: number;
  isOnTrack: boolean;
}

export interface GoalPrediction {
  likelihood: 'high' | 'medium' | 'low';
  estimatedAchievementDate: Date;
  requiredDailyImprovement: number;
  confidence: number; // 0-100
  factors: string[];
}

// Offline Mode Types
export interface OfflineData {
  lastUpdate: Date;
  scoreDistribution: ScoreDistributionResponse;
  userStats?: UserStats;
  userProfile?: SneakerDBUserProfile;
  goals: UserGoal[];
  cacheVersion: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface UserData {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  score: number;
  position: number;
  profilePhotoData: {
    image: string;
  };
}

export interface SearchedUser {
  username: string;
  loading: boolean;
  profile?: SneakerDBUserProfile;
  ranking?: {
    position: number;
    percentageAbove: number;
    percentageBelow: number;
    usersAbove: number;
    totalUsers: number;
  };
  error?: string;
}

export interface UserRanking {
  position: number;
  percentageAbove: number;
  percentageBelow: number;
  usersAbove: number;
  totalUsers: number;
}

export interface SearchedUser {
  id: string;
  username: string;
  loading: boolean;
  error?: string;
  profile?: SneakerDBUserProfile;
  ranking?: UserRanking;
}

// Mars Yard 3.0 Countdown Types
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
}

// Online Users Tracker Types
export interface OnlineUserStats {
  currentOnline: number;
  peakToday: number;
  totalVisitsToday: number;
  lastUpdated: Date;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  username?: string;
  joinedAt: Date;
  lastActivity: Date;
  userAgent: string;
  location?: string;
}
