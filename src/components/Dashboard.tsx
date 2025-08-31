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
  ListItemIcon,
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

interface DashboardProps {
  scoreDistribution: ScoreDistributionResponse;
  currentUsername?: string;
}

const Dashboard = ({ scoreDistribution, currentUsername }: DashboardProps) => {
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

  return (
    <Box>
      {/* Mars Yard Countdown (presumibilmente già presente sopra) */}
      {/* User Shoe Carousel rimosso su richiesta */}
      {/* Current User Activities */}
      {currentUsername && (
        <CurrentUserActivities username={currentUsername} cardMarginBottom={cardMarginBottom} />
      )}

      {/* Friends League */}
      <FriendsLeague />

      {/* Statistics */}
      <Card 
        elevation={0} 
        style={{ 
          background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
          border: '1px solid #e6ddd4',
          marginBottom: cardMarginBottom // Add spacing below Statistics
        }}
      >
        <CardContent style={{ padding: cardPadding }}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            style={{ marginBottom: statisticsExpanded ? 24 : 8, cursor: 'pointer' }}
            onClick={() => setStatisticsExpanded(!statisticsExpanded)}
          >
            <Box display="flex" alignItems="center">
              <Box 
                style={{ 
                  backgroundColor: '#8b7355', 
                  borderRadius: 12, 
                  padding: 8, 
                  marginRight: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AssessmentIcon style={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" component="h2" style={{ fontWeight: 600, color: '#3c3530', fontSize: '1.25rem' }}>
                Statistics
              </Typography>
              <Chip 
                label="3 metrics" 
                size="small" 
                style={{ 
                  marginLeft: 12,
                  backgroundColor: 'rgba(139, 115, 85, 0.1)', 
                  color: '#8b7355',
                  fontSize: '0.7rem'
                }}
              />
            </Box>
            <IconButton 
              style={{ color: '#8b7355' }}
              size="small"
            >
              {statisticsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={statisticsExpanded} timeout={300}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box 
                  textAlign="center" 
                  style={{ 
                    padding: 24, 
                    backgroundColor: '#f5f1eb',
                    borderRadius: 16,
                    border: '1px solid #e6ddd4',
                  }}
                >
                  <Typography variant="h3" style={{ fontWeight: 700, color: '#8b7355', marginBottom: 8 }}>
                    {metrics.totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" style={{ fontWeight: 500 }}>
                    Total active users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box 
                  textAlign="center" 
                  style={{ 
                    padding: 24, 
                    backgroundColor: '#f5f1eb',
                    borderRadius: 16,
                    border: '1px solid #e6ddd4',
                  }}
                >
                  <Typography variant="h3" style={{ fontWeight: 700, color: '#a0916c', marginBottom: 8 }}>
                    {Math.round(metrics.averageScore)}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" style={{ fontWeight: 500 }}>
                    Average Score
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box 
                  textAlign="center" 
                  style={{ 
                    padding: 24, 
                    backgroundColor: '#f5f1eb',
                    borderRadius: 16,
                    border: '1px solid #e6ddd4',
                  }}
                >
                  <Typography variant="h3" style={{ fontWeight: 700, color: '#6b7d5a', marginBottom: 8 }}>
                    {metrics.topScores[0]?.score || 0}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" style={{ fontWeight: 500 }}>
                    Maximum Score
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>


      {/* Top 10 Scores (actual users) */}
      <Card 
        elevation={0} 
        style={{ 
          marginBottom: cardMarginBottom,
          background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
          border: '1px solid #e6ddd4',
        }}
      >
        <CardContent style={{ padding: cardPadding }}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            style={{ marginBottom: topScoresExpanded ? 24 : 8, cursor: 'pointer' }}
            onClick={() => setTopScoresExpanded(!topScoresExpanded)}
          >
            <Box display="flex" alignItems="center">
              <Box 
                style={{ 
                  backgroundColor: '#b8965a', 
                  borderRadius: 12, 
                  padding: 8, 
                  marginRight: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrophyIcon style={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" component="h2" style={{ fontWeight: 600, color: '#3c3530', fontSize: '1.25rem' }}>
                Top 10 Scores
              </Typography>
              <Chip 
                label={`${topUsers.length} users`} 
                size="small" 
                style={{ 
                  marginLeft: 12,
                  backgroundColor: 'rgba(184, 150, 90, 0.1)', 
                  color: '#b8965a',
                  fontSize: '0.7rem'
                }}
              />
            </Box>
            <IconButton 
              style={{ color: '#8b7355' }}
              size="small"
            >
              {topScoresExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={topScoresExpanded} timeout={300}>
            <List style={{ padding: 0 }}>
              {topUsers.map((user, index) => (
                <React.Fragment key={user.username + user.score}>
                  <ListItem 
                    style={{ 
                      padding: '16px 0',
                      borderRadius: 12,
                      marginBottom: index < topUsers.length - 1 ? 8 : 0,
                    }}
                  >
                    <ListItemIcon>
                      <Chip 
                        label={`#${index + 1}`} 
                        style={{
                          backgroundColor: index < 3 ? '#8b7355' : '#d4c4a8',
                          color: index < 3 ? 'white' : '#3c3530',
                          fontWeight: 600,
                          borderRadius: 8,
                        }}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          {user.profilePhoto && (
                            <img src={user.profilePhoto} alt={user.username} style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 12 }} />
                          )}
                          <Typography variant="h6" style={{ fontWeight: 600, color: '#3c3530' }}>
                            @{user.username}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary" style={{ fontWeight: 500 }}>
                          Score: {user.score}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < topUsers.length - 1 && <Divider style={{ margin: '0 16px' }} />}
                </React.Fragment>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card 
        elevation={0}
        style={{
          marginBottom: cardMarginBottom,
          background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
          border: '1px solid #e6ddd4',
        }}
      >
        <CardContent style={{ padding: cardPadding }}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            style={{ marginBottom: distributionExpanded ? 24 : 8, cursor: 'pointer' }}
            onClick={() => setDistributionExpanded(!distributionExpanded)}
          >
            <Box display="flex" alignItems="center">
              <Box 
                style={{ 
                  backgroundColor: '#8b7355', 
                  borderRadius: 12, 
                  padding: 8, 
                  marginRight: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChartIcon style={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" component="h2" style={{ fontWeight: 600, color: '#3c3530', fontSize: '1.25rem' }}>
                Score Distribution
              </Typography>
              <Chip 
                label={`${metrics.scoreRanges.length} ranges`} 
                size="small" 
                style={{ 
                  marginLeft: 12,
                  backgroundColor: 'rgba(139, 115, 85, 0.1)', 
                  color: '#8b7355',
                  fontSize: '0.7rem'
                }}
              />
            </Box>
            <IconButton 
              style={{ color: '#8b7355' }}
              size="small"
            >
              {distributionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={distributionExpanded} timeout={300}>
            <Grid container spacing={3}>
              {metrics.scoreRanges.map((range) => (
                <Grid item xs={12} sm={6} md={4} key={range.range}>
                  <Card 
                    elevation={0}
                    style={{ 
                      padding: 20,
                      background: 'linear-gradient(135deg, #f5f1eb 0%, #fefdfb 100%)',
                      border: '1px solid #e6ddd4',
                      borderRadius: 16,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" style={{ marginBottom: 12 }}>
                      <Typography variant="h6" style={{ color: '#8b7355', fontWeight: 600 }}>
                        {range.range}
                      </Typography>
                      <Chip 
                        label={`${range.percentage}%`} 
                        size="small" 
                        style={{
                          backgroundColor: '#a0916c',
                          color: 'white',
                          fontWeight: 600,
                          borderRadius: 8,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom style={{ fontWeight: 500, marginBottom: 16 }}>
                      {range.count.toLocaleString()} users
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={range.percentage} 
                      style={{ 
                        height: 8, 
                        borderRadius: 8,
                        backgroundColor: '#e6ddd4',
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
