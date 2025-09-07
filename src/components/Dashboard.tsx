import React, { useMemo, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  IconButton,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import {
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  BarChart as BarChartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@material-ui/icons';
import { ScoreDistributionResponse } from '../types';
import { calculateDashboardMetrics } from '../apiService';
import FriendsLeague from './FriendsLeague';
import { CurrentUserActivities } from './CurrentUserActivities';
import UserShoeCarousel from './UserShoeCarousel';
import FinalLeaderboard from './FinalLeaderboard';

interface DashboardProps {
  scoreDistribution: ScoreDistributionResponse;
  currentUsername?: string;
}

export const Dashboard = ({ scoreDistribution, currentUsername }: DashboardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [topScoresExpanded, setTopScoresExpanded] = useState(false);
  const [distributionExpanded, setDistributionExpanded] = useState(false);
  const [statisticsExpanded, setStatisticsExpanded] = useState(false);

  // Responsive padding
  const cardPadding = isMobile ? '16px' : '24px 32px 16px 32px';

  // Responsive margin bottom to match FriendsLeague
  const cardMarginBottom = isMobile ? 16 : 32;

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(scoreDistribution);
  }, [scoreDistribution]);

  // Extract top 10 users from leaderboard (not just score buckets)
  const topUsers: { username: string; score: number; profilePhoto?: string }[] = useMemo(() => {
    const allUsers: { username: string; score: number; profilePhoto?: string }[] = [];
    scoreDistribution.scoreDistribution.forEach(item => {
      if (item.users && item.users.length > 0) {
        item.users.forEach(user => {
          allUsers.push({
            username: user.username,
            score: item.score,
            profilePhoto: user.profilePhotoData?.image || undefined
          });
        });
      }
    });
    // Sort by score descending, then username
    allUsers.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
    return allUsers.slice(0, 10);
  }, [scoreDistribution]);

  console.log('🏠 Dashboard rendered with currentUsername:', currentUsername);

  return (
    <Box>
      {/* Final Summer Camp Leaderboard - subito sotto l'header */}
      <FinalLeaderboard currentUsername={currentUsername} />

      {/* Current User Activities */}
      {currentUsername && (
        <CurrentUserActivities username={currentUsername} cardMarginBottom={cardMarginBottom} />
      )}

      {/* Friends League */}
      <FriendsLeague />
    </Box>
  );
};
export default Dashboard;

