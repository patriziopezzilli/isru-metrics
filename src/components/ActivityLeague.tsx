import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Tooltip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  Mouse as ClickIcon,
  Visibility as ViewIcon
} from '@material-ui/icons';
import { activityTracker } from '../services/activityTracker';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2),
    maxWidth: 1200,
    margin: '0 auto'
  },
  header: {
    marginBottom: theme.spacing(3),
    textAlign: 'center'
  },
  title: {
    fontWeight: 'bold',
    color: '#8b7355',
    marginBottom: theme.spacing(1)
  },
  subtitle: {
    color: '#666',
    fontSize: '0.9rem'
  },
  controls: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  leaderboardCard: {
    marginBottom: theme.spacing(2)
  },
  listItem: {
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(1),
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  positionAvatar: {
    fontWeight: 'bold',
    fontSize: '1.1rem'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  },
  activityLevel: {
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  statsGrid: {
    marginBottom: theme.spacing(3)
  },
  statCard: {
    textAlign: 'center',
    padding: theme.spacing(2)
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#8b7355'
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: theme.spacing(0.5)
  },
  userCard: {
    marginBottom: theme.spacing(2),
    border: '2px solid #8b7355',
    backgroundColor: '#fafafa'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200
  },
  errorContainer: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: '#666'
  }
}));

interface ActivityLeagueProps {
  currentUsername?: string;
}

interface ActivityUser {
  position: number;
  username: string;
  activity_score: number;
  sessions: number;
  total_events: number;
  avg_session_minutes: number;
  high_engagement_sessions: number;
  last_activity: string;
  activity_level: {
    level: string;
    icon: string;
    color: string;
  };
  engagement_badge: {
    badge: string;
    icon: string;
    color: string;
  } | null;
}

interface ActivityLeagueData {
  leaderboard: ActivityUser[];
  stats: {
    total_users: number;
    period_days: number;
    date_from: string;
    date_to: string;
  };
  user_data?: {
    username: string;
    position: number | null;
    stats: any;
    activity_level: any;
    engagement_badge: any;
  } | null;
}

const ActivityLeague: React.FC<ActivityLeagueProps> = ({ currentUsername }) => {
  const classes = useStyles();
  const [data, setData] = useState<ActivityLeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(7);

  const loadActivityLeague = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🏆 Loading activity league...');
      
      // Track feature usage
      activityTracker.trackFeatureUse('activity_league_view', {
        period_days: period,
        has_username: !!currentUsername
      });

      const params = new URLSearchParams({
        limit: '50',
        period: period.toString()
      });

      if (currentUsername) {
        params.append('username', currentUsername);
      }

      const response = await fetch(`/api/activity-league?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        console.log('✅ Activity league loaded:', result.data.stats);
      } else {
        throw new Error(result.message || 'Failed to load activity league');
      }

    } catch (err) {
      console.error('❌ Error loading activity league:', err);
      setError('Unable to load activity league data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivityLeague();
  }, [period, currentUsername]);

  const getPositionColor = (position: number): string => {
    if (position === 1) return '#ffd700'; // Gold
    if (position === 2) return '#c0c0c0'; // Silver
    if (position === 3) return '#cd7f32'; // Bronze
    return '#8b7355'; // Default
  };

  const getPositionIcon = (position: number): string => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const formatLastActivity = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box className={classes.loadingContainer}>
        <CircularProgress style={{ color: '#8b7355' }} />
        <Typography variant="h6" style={{ marginLeft: 16, color: '#8b7355' }}>
          Loading Activity League...
        </Typography>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box className={classes.errorContainer}>
        <Typography variant="h6" color="error">
          {error || 'No data available'}
        </Typography>
        <Button
          onClick={loadActivityLeague}
          startIcon={<RefreshIcon />}
          style={{ marginTop: 16, color: '#8b7355' }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      {/* Header */}
      <Box className={classes.header}>
        <Typography variant="h4" className={classes.title}>
          🏆 Activity League
        </Typography>
        <Typography className={classes.subtitle}>
          Most active users in the I.S.R.U League community
        </Typography>
      </Box>

      {/* Controls */}
      <Box className={classes.controls}>
        <FormControl variant="outlined" size="small">
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as number)}
            label="Time Period"
          >
            <MenuItem value={1}>Last 24 hours</MenuItem>
            <MenuItem value={3}>Last 3 days</MenuItem>
            <MenuItem value={7}>Last week</MenuItem>
            <MenuItem value={14}>Last 2 weeks</MenuItem>
            <MenuItem value={30}>Last month</MenuItem>
          </Select>
        </FormControl>

        <Button
          onClick={loadActivityLeague}
          startIcon={<RefreshIcon />}
          variant="outlined"
          style={{ color: '#8b7355', borderColor: '#8b7355' }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} className={classes.statsGrid}>
        <Grid item xs={6} sm={3}>
          <Card className={classes.statCard}>
            <CardContent>
              <Typography className={classes.statValue}>
                {data.stats.total_users}
              </Typography>
              <Typography className={classes.statLabel}>
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card className={classes.statCard}>
            <CardContent>
              <Typography className={classes.statValue}>
                {data.stats.period_days}
              </Typography>
              <Typography className={classes.statLabel}>
                Days Period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card className={classes.statCard}>
            <CardContent>
              <Typography className={classes.statValue}>
                {data.leaderboard.length > 0 ? data.leaderboard[0].activity_score : 0}
              </Typography>
              <Typography className={classes.statLabel}>
                Top Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card className={classes.statCard}>
            <CardContent>
              <Typography className={classes.statValue}>
                {data.user_data?.position || '-'}
              </Typography>
              <Typography className={classes.statLabel}>
                Your Rank
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User's Position (if available) */}
      {data.user_data && data.user_data.position && (
        <Card className={classes.userCard}>
          <CardContent>
            <Typography variant="h6" style={{ color: '#8b7355', marginBottom: 8 }}>
              Your Activity Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Position</Typography>
                <Typography variant="h6">#{data.user_data.position}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Score</Typography>
                <Typography variant="h6">{data.user_data.stats?.total_activity_score || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Sessions</Typography>
                <Typography variant="h6">{data.user_data.stats?.total_sessions || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="textSecondary">Level</Typography>
                <Typography variant="h6">
                  {data.user_data.activity_level?.icon} {data.user_data.activity_level?.level}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Paper className={classes.leaderboardCard}>
        <List>
          {data.leaderboard.map((user) => (
            <ListItem
              key={user.username}
              className={classes.listItem}
              style={{
                backgroundColor: user.username.toLowerCase() === currentUsername?.toLowerCase() 
                  ? '#fff3e0' : 'transparent'
              }}
            >
              <ListItemAvatar>
                <Avatar
                  className={classes.positionAvatar}
                  style={{ backgroundColor: getPositionColor(user.position) }}
                >
                  {getPositionIcon(user.position)}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box className={classes.userInfo}>
                    <Typography variant="h6" style={{ fontWeight: 'bold' }}>
                      {user.username}
                    </Typography>
                    <Chip
                      label={`${user.activity_level.icon} ${user.activity_level.level}`}
                      size="small"
                      style={{ 
                        backgroundColor: user.activity_level.color + '20',
                        color: user.activity_level.color,
                        fontWeight: 'bold'
                      }}
                    />
                    {user.engagement_badge && (
                      <Chip
                        label={`${user.engagement_badge.icon} ${user.engagement_badge.badge}`}
                        size="small"
                        style={{ 
                          backgroundColor: user.engagement_badge.color + '20',
                          color: user.engagement_badge.color
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" style={{ fontWeight: 'bold', color: '#8b7355' }}>
                      🎯 {user.activity_score} points • 📱 {user.sessions} sessions • 🖱️ {user.total_events} events
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ⏱️ {user.avg_session_minutes}min avg • Last active {formatLastActivity(user.last_activity)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {data.leaderboard.length === 0 && (
        <Box className={classes.errorContainer}>
          <Typography variant="h6">
            No activity data available for the selected period
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try selecting a longer time period or check back later
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ActivityLeague;
