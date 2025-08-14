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
  hasUsers: boolean;
  users?: UserProfile[];
}

export interface ScoreDistributionResponse {
  scoreDistribution: ScoreDistributionItem[];
  userScore?: number | null;
  totalUsers?: number;
  minScore?: number;
  maxScore?: number;
  countsHidden?: boolean;
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
