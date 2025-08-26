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
  Tooltip,
  useTheme,
  useMediaQuery,
  Container,
  Fade,
  Zoom
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  Mouse as ClickIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  Whatshot as FireIcon,
  Speed as SpeedIcon,
  People as PeopleIcon
} from '@material-ui/icons';
import { activityTracker } from '../services/activityTracker';

const useStyles = makeStyles((theme) => ({
  // Container principale mobile-first
  container: {
    padding: theme.spacing(1),
    maxWidth: '100vw',
    margin: 0,
    width: '100%',
    boxSizing: 'border-box',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(2),
      maxWidth: 1200,
      margin: '0 auto'
    }
  },

  // Header moderno e mobile-friendly
  header: {
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    background: 'linear-gradient(135deg, #8b7355 0%, #a0916c 100%)',
    borderRadius: 16,
    padding: theme.spacing(2),
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.up('sm')]: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(3)
    }
  },

  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.3
  },

  title: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    marginBottom: theme.spacing(0.5),
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.up('sm')]: {
      fontSize: '2rem',
      marginBottom: theme.spacing(1)
    }
  },

  subtitle: {
    fontSize: '0.85rem',
    opacity: 0.9,
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.up('sm')]: {
      fontSize: '1rem'
    }
  },

  // Sezione filtri centrata
  controls: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    background: '#f8f6f1',
    borderRadius: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.up('sm')]: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2)
    }
  },

  filterControl: {
    minWidth: '100%',
    maxWidth: 300,
    [theme.breakpoints.up('sm')]: {
      minWidth: 250
    }
  },

  // Pulsante refresh nell'header
  headerRefreshButton: {
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.3)',
      transform: 'scale(1.05)'
    },
    transition: 'all 0.2s ease'
  },

  // Stats cards mobile-first
  statsGrid: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      marginBottom: theme.spacing(3)
    }
  },

  statCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f6f1 100%)',
    borderRadius: 12,
    padding: theme.spacing(1.5),
    textAlign: 'center',
    border: '1px solid #e6ddd4',
    height: '100%',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(2)
    }
  },

  statsIcon: {
    fontSize: '2rem',
    marginBottom: theme.spacing(0.5),
    color: '#8b7355',
    [theme.breakpoints.up('sm')]: {
      fontSize: '2.5rem',
      marginBottom: theme.spacing(1)
    }
  },

  statValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#8b7355',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1.5rem'
    }
  },

  statLabel: {
    fontSize: '0.7rem',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing(0.5),
    [theme.breakpoints.up('sm')]: {
      fontSize: '0.8rem'
    }
  },

  // Leaderboard mobile-optimized
  leaderboardCard: {
    marginBottom: theme.spacing(2),
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    background: 'white'
  },

  leaderboardHeader: {
    background: 'linear-gradient(135deg, #6b7d5a 0%, #8b9a7a 100%)',
    color: 'white',
    padding: theme.spacing(1.5),
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(2)
    }
  },

  // List items mobile-first
  listItem: {
    padding: theme.spacing(1),
    borderBottom: '1px solid #f0f0f0',
    background: 'white',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#fafafa'
    },
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(1.5)
    }
  },

  // Avatar mobile-optimized
  positionAvatar: {
    width: 36,
    height: 36,
    fontWeight: 'bold',
    fontSize: '0.9rem',
    [theme.breakpoints.up('sm')]: {
      width: 48,
      height: 48,
      fontSize: '1.1rem'
    }
  },

  // User info mobile layout
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    flex: 1,
    minWidth: 0,
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(1)
    }
  },

  username: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1rem'
    }
  },

  activityLevel: {
    fontWeight: 'bold',
    fontSize: '0.8rem',
    [theme.breakpoints.up('sm')]: {
      fontSize: '0.9rem'
    }
  },

  // Stats chips mobile-optimized
  statsChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5)
  },

  statsChip: {
    fontSize: '0.65rem',
    height: 20,
    '& .MuiChip-label': {
      padding: '0 6px'
    },
    [theme.breakpoints.up('sm')]: {
      fontSize: '0.7rem',
      height: 24,
      '& .MuiChip-label': {
        padding: '0 8px'
      }
    }
  },

  userCard: {
    marginBottom: theme.spacing(2),
    border: '2px solid #8b7355',
    backgroundColor: '#fafafa',
    borderRadius: 12
  },

  // Loading e empty states
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    flexDirection: 'column',
    gap: theme.spacing(2)
  },

  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: '#666',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(4)
    }
  },

  // Buttons mobile-friendly
  refreshButton: {
    borderRadius: 20,
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(0.5, 2),
    fontSize: '0.8rem',
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(1, 3),
      fontSize: '0.9rem'
    }
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      {/* Header moderno con background */}
      <Fade in timeout={800}>
        <Box className={classes.header}>
          <Box className={classes.headerBackground} />

          {/* Refresh button in top right */}
          <Button
            onClick={loadActivityLeague}
            className={classes.headerRefreshButton}
            style={{
              position: 'absolute',
              top: isMobile ? 12 : 16,
              right: isMobile ? 12 : 16,
              minWidth: 'auto',
              padding: isMobile ? 6 : 8,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              zIndex: 2
            }}
          >
            <RefreshIcon style={{ fontSize: isMobile ? 18 : 20 }} />
          </Button>

          <Typography variant={isMobile ? "h5" : "h4"} className={classes.title}>
            🏆 Activity League
          </Typography>
          <Typography className={classes.subtitle}>
            Most active users in the I.S.R.U League community
          </Typography>
        </Box>
      </Fade>

      {/* Controls centrati - solo filtro periodo */}
      <Fade in timeout={1000}>
        <Box className={classes.controls}>
          <FormControl
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            className={classes.filterControl}
            style={{
              margin: '0 auto',
              display: 'block'
            }}
          >
            <InputLabel>📅 Time Period</InputLabel>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as number)}
              label="📅 Time Period"
            >
              <MenuItem value={1}>⚡ Last 24 hours</MenuItem>
              <MenuItem value={3}>🔥 Last 3 days</MenuItem>
              <MenuItem value={7}>📊 Last week</MenuItem>
              <MenuItem value={14}>📈 Last 2 weeks</MenuItem>
              <MenuItem value={30}>🗓️ Last month</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Fade>

      {/* Stats Overview con icone */}
      <Zoom in timeout={1200}>
        <Grid container spacing={isMobile ? 1 : 2} className={classes.statsGrid}>
          <Grid item xs={6} sm={3}>
            <Card className={classes.statCard}>
              <CardContent style={{ padding: isMobile ? 12 : 16 }}>
                <PeopleIcon className={classes.statsIcon} />
                <Typography className={classes.statValue}>
                  {data.stats.total_users.toLocaleString()}
                </Typography>
                <Typography className={classes.statLabel}>
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card className={classes.statCard}>
              <CardContent style={{ padding: isMobile ? 12 : 16 }}>
                <TimeIcon className={classes.statsIcon} />
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
              <CardContent style={{ padding: isMobile ? 12 : 16 }}>
                <TrophyIcon className={classes.statsIcon} />
                <Typography className={classes.statValue}>
                  {data.leaderboard.length > 0 ? data.leaderboard[0].activity_score.toLocaleString() : 0}
                </Typography>
                <Typography className={classes.statLabel}>
                  Top Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card className={classes.statCard}>
              <CardContent style={{ padding: isMobile ? 12 : 16 }}>
                <StarIcon className={classes.statsIcon} />
                <Typography className={classes.statValue}>
                  {data.user_data?.position ? `#${data.user_data.position}` : '-'}
                </Typography>
                <Typography className={classes.statLabel}>
                  Your Rank
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Zoom>

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

      {/* Leaderboard con header */}
      <Fade in timeout={1400}>
        <Paper className={classes.leaderboardCard}>
          <Box className={classes.leaderboardHeader}>
            <Typography variant="h6" style={{ fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.25rem' }}>
              🏆 Top Active Users
            </Typography>
          </Box>

          <List style={{ padding: 0 }}>
            {data.leaderboard.map((user, index) => (
              <Zoom in timeout={1600 + (index * 100)} key={user.username}>
                <ListItem
                  className={classes.listItem}
                  style={{
                    backgroundColor: user.username.toLowerCase() === currentUsername?.toLowerCase()
                      ? '#fff3e0' : 'white',
                    borderLeft: user.username.toLowerCase() === currentUsername?.toLowerCase()
                      ? '4px solid #ff9800' : 'none'
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
                        <Typography
                          className={classes.username}
                          style={{
                            color: user.username.toLowerCase() === currentUsername?.toLowerCase() ? '#e65100' : '#333'
                          }}
                        >
                          {user.position <= 3 && (
                            <span style={{ marginRight: 8 }}>
                              {user.position === 1 ? '🥇' : user.position === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                          {user.username}
                          {user.username.toLowerCase() === currentUsername?.toLowerCase() && ' (You)'}
                        </Typography>

                        <Box className={classes.statsChips}>
                          <Chip
                            label={`${user.activity_level.icon} ${user.activity_level.level}`}
                            size="small"
                            className={classes.statsChip}
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
                              className={classes.statsChip}
                              style={{
                                backgroundColor: user.engagement_badge.color + '20',
                                color: user.engagement_badge.color
                              }}
                            />
                          )}
                          <Chip
                            label={`🎯 ${user.activity_score.toLocaleString()}`}
                            size="small"
                            className={classes.statsChip}
                            style={{
                              backgroundColor: '#8b7355',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      !isMobile ? (
                        <Box style={{ marginTop: 4 }}>
                          <Typography variant="body2" style={{ fontSize: '0.75rem', color: '#666' }}>
                            📱 {user.sessions} sessions • 🖱️ {user.total_events.toLocaleString()} events • ⏱️ {user.avg_session_minutes}min avg
                          </Typography>
                          <Typography variant="caption" color="textSecondary" style={{ fontSize: '0.7rem' }}>
                            Last active {formatLastActivity(user.last_activity)}
                          </Typography>
                        </Box>
                      ) : null
                    }
                  />
                </ListItem>
              </Zoom>
            ))}
          </List>
        </Paper>
      </Fade>

      {data.leaderboard.length === 0 && (
        <Fade in timeout={1600}>
          <Box className={classes.emptyState}>
            <Typography variant="h6" style={{ marginBottom: 16 }}>
              📊 No activity data available
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
              No users found for the selected {period === 1 ? '24 hour' : `${period} day`} period.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Try selecting a longer time period or check back later when users are more active! 🚀
            </Typography>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default ActivityLeague;
