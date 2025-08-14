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
