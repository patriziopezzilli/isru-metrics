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
  IconButton
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
import { FriendsLeague } from './FriendsLeague';

interface DashboardProps {
  scoreDistribution: ScoreDistributionResponse;
}

const Dashboard = ({ scoreDistribution }: DashboardProps) => {
  const [topScoresExpanded, setTopScoresExpanded] = useState(false);
  const [distributionExpanded, setDistributionExpanded] = useState(false);
  
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(scoreDistribution);
  }, [scoreDistribution]);

  return (
    <Box>
      {/* Friends League */}
      <FriendsLeague />

      {/* Statistics */}
      <Card 
        elevation={0} 
        style={{ 
          marginBottom: 32, 
          background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
          border: '1px solid #e6ddd4',
        }}
      >
        <CardContent style={{ padding: 32 }}>
          <Box display="flex" alignItems="center" style={{ marginBottom: 24 }}>
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
                        <Typography variant="h5" style={{ color: '#8b7355', fontWeight: 'bold' }}>
              Statistics
            </Typography>
          </Box>
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
                  Total Users
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
        </CardContent>
      </Card>

      {/* Top 10 Scores */}
      <Card 
        elevation={0} 
        style={{ 
          marginBottom: 32,
          background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
          border: '1px solid #e6ddd4',
        }}
      >
        <CardContent style={{ padding: '24px 32px 16px 32px' }}>
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
              <Typography variant="h5" component="h2" style={{ fontWeight: 600, color: '#3c3530' }}>
                Top 10 Scores
              </Typography>
              <Chip 
                label={`${metrics.topScores.length} entries`} 
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
              {metrics.topScores.map((item, index) => (
                <React.Fragment key={item.score}>
                  <ListItem 
                    style={{ 
                      padding: '16px 0',
                      borderRadius: 12,
                      marginBottom: index < metrics.topScores.length - 1 ? 8 : 0,
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
                        <Typography variant="h6" style={{ fontWeight: 600, color: '#3c3530' }}>
                          Score {item.score}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary" style={{ fontWeight: 500 }}>
                          {item.users ? `${item.users.length} user${item.users.length === 1 ? '' : 's'}` : 'No users'}
                        </Typography>
                      }
                    />
                    <Box textAlign="right">
                      <Typography variant="body2" style={{ color: '#8b7355', fontWeight: 600 }}>
                        {item.percentage}%
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < metrics.topScores.length - 1 && <Divider style={{ margin: '0 16px' }} />}
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
          background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
          border: '1px solid #e6ddd4',
        }}
      >
        <CardContent style={{ padding: '24px 32px 16px 32px' }}>
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
              <Typography variant="h5" component="h2" style={{ fontWeight: 600, color: '#3c3530' }}>
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
