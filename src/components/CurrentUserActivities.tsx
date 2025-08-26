import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
  CircularProgress,
  makeStyles,
  Collapse,
  IconButton
} from '@material-ui/core';
import { 
  CheckCircle as CheckIcon, 
  Schedule as PendingIcon, 
  Person as PersonIcon, 
  Whatshot as StreakIcon,
  ExpandMore as ExpandMoreIcon
} from '@material-ui/icons';
import { SneakerDBUserProfile, ActivityStreakResponse } from '../types';
import { fetchSneakerDBProfile, fetchActivityStreak } from '../apiService';

// Helper function to calculate streak progress
const getStreakProgress = (currentStreak: number) => {
  const levels = [7, 30, 90, 360];
  
  // Find the next level
  let nextLevel = levels.find(level => currentStreak < level);
  let previousLevel = 0;
  
  // If currentStreak is >= 360, they're at max level
  if (!nextLevel) {
    return {
      progress: 100,
      nextLevel: 360,
      remaining: 0,
      isMaxLevel: true
    };
  }
  
  // Find the previous level
  for (let i = 0; i < levels.length; i++) {
    if (levels[i] === nextLevel) {
      previousLevel = i > 0 ? levels[i - 1] : 0;
      break;
    }
  }
  
  const progress = ((currentStreak - previousLevel) / (nextLevel - previousLevel)) * 100;
  const remaining = nextLevel - currentStreak;
  
  return {
    progress: Math.max(0, Math.min(100, progress)),
    nextLevel,
    remaining,
    isMaxLevel: false
  };
};

const useStyles = makeStyles((theme) => ({
  card: {
    background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
    border: '1px solid #e6ddd4',
    borderRadius: '16px',
    marginBottom: '32px',
    [theme.breakpoints.down('sm')]: {
      borderRadius: '12px',
      marginBottom: '16px',
    },
  },
  header: {
    padding: '24px 32px 16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      padding: '16px',
    },
  },
  expandIcon: {
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandIconOpen: {
    transform: 'rotate(180deg)',
  },
  streakSection: {
    borderTop: '1px solid #e6ddd4',
    margin: '16px 0 0 0',
  },
  streakHeader: {
    padding: '12px 0',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(139, 115, 85, 0.05)',
    },
  },
}));

interface CurrentUserActivitiesProps {
  username: string;
  cardMarginBottom?: number;
}

export const CurrentUserActivities: React.FC<CurrentUserActivitiesProps> = ({ username, cardMarginBottom }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [profileData, setProfileData] = useState<SneakerDBUserProfile | null>(null);
  const [streakData, setStreakData] = useState<Map<number, ActivityStreakResponse>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingStreaks, setLoadingStreaks] = useState(false);
  const [streakExpanded, setStreakExpanded] = useState(false); // Stato per il collapsing della sezione streak

  // Function to load streak data for activities
  const loadStreakData = async (activities: any[], username: string) => {
    setLoadingStreaks(true);
    const newStreakData = new Map<number, ActivityStreakResponse>();
    
    try {
      // Load streak data for each activity (limit to first 10 for consistency with User Profile)
      const streakPromises = activities.slice(0, 10).map(async (activity) => {
        try {
          const streak = await fetchActivityStreak(username.toLowerCase(), activity.activityId);
          
          if (streak) {
            // Handle different possible response structures
            let processedStreak = streak;
            
            // Check if the response is wrapped in a proxy container
            if (streak.contents && typeof streak.contents === 'string') {
              try {
                processedStreak = JSON.parse(streak.contents);
              } catch (e) {
                console.warn('Could not parse streak contents as JSON');
              }
            } else if (streak.contents && typeof streak.contents === 'object') {
              processedStreak = streak.contents;
            }
            
            // Check if we have the expected structure
            if (processedStreak && typeof processedStreak === 'object') {
              // Handle the correct API structure: {participation: {currentStreak: 38}, submissions: [...]}
              if (processedStreak.participation && typeof processedStreak.participation.currentStreak === 'number') {
                newStreakData.set(activity.activityId, processedStreak);
              } else {
                console.warn('Unexpected streak data structure:', processedStreak);
                // Set default streak 0 if data structure is invalid
                const defaultStreak: ActivityStreakResponse = {
                  participation: {
                    id: 0,
                    user: 0,
                    userName: username,
                    activity: activity.activityId,
                    activityTitle: activity.activityTitle || 'Unknown',
                    activityInitialSignupPoints: 0,
                    badgeImage: '',
                    setupProof: null,
                    setupCaption: '',
                    dateStarted: new Date().toISOString().split('T')[0],
                    level: 1,
                    currentStreak: 0,
                    hasSubmittedToday: false
                  },
                  submissions: []
                };
                newStreakData.set(activity.activityId, defaultStreak);
              }
            } else {
              // Set default streak 0 if data structure is invalid
              const defaultStreak: ActivityStreakResponse = {
                participation: {
                  id: 0,
                  user: 0,
                  userName: username,
                  activity: activity.activityId,
                  activityTitle: activity.activityTitle || 'Unknown',
                  activityInitialSignupPoints: 0,
                  badgeImage: '',
                  setupProof: null,
                  setupCaption: '',
                  dateStarted: new Date().toISOString().split('T')[0],
                  level: 1,
                  currentStreak: 0,
                  hasSubmittedToday: false
                },
                submissions: []
              };
              newStreakData.set(activity.activityId, defaultStreak);
            }
          } else {
            // Set default streak 0 if no data received
            const defaultStreak: ActivityStreakResponse = {
              participation: {
                id: 0,
                user: 0,
                userName: username,
                activity: activity.activityId,
                activityTitle: activity.activityTitle || 'Unknown',
                activityInitialSignupPoints: 0,
                badgeImage: '',
                setupProof: null,
                setupCaption: '',
                dateStarted: new Date().toISOString().split('T')[0],
                level: 1,
                currentStreak: 0,
                hasSubmittedToday: false
              },
              submissions: []
            };
            newStreakData.set(activity.activityId, defaultStreak);
          }
        } catch (error) {
          console.log(`Could not load streak for activity ${activity.activityId}:`, error);
          // Set default streak 0 in case of error
          const defaultStreak: ActivityStreakResponse = {
            participation: {
              id: 0,
              user: 0,
              userName: username,
              activity: activity.activityId,
              activityTitle: activity.activityTitle || 'Unknown',
              activityInitialSignupPoints: 0,
              badgeImage: '',
              setupProof: null,
              setupCaption: '',
              dateStarted: new Date().toISOString().split('T')[0],
              level: 1,
              currentStreak: 0,
              hasSubmittedToday: false
            },
            submissions: []
          };
          newStreakData.set(activity.activityId, defaultStreak);
        }
      });

      await Promise.all(streakPromises);
      setStreakData(newStreakData);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoadingStreaks(false);
    }
  };

  useEffect(() => {
    if (!username) {
      setProfileData(null);
      setStreakData(new Map());
      return;
    }

    const loadUserProfile = async () => {
      setLoading(true);
      try {
        const data = await fetchSneakerDBProfile(username.toLowerCase());
        setProfileData(data);
        
        // Load streak data after profile is loaded
        if (data?.activities) {
          await loadStreakData(data.activities, username.toLowerCase());
        }
      } catch (error) {
        console.error('Error loading user profile for activities:', error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [username]);

  if (!username || loading) {
    return loading ? (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} style={{ color: '#8b7355' }} />
      </Box>
    ) : null;
  }

  if (!profileData?.activities || profileData.activities.length === 0) {
    return null;
  }

  const completedActivities = profileData.activities.filter(activity => activity.hasSubmittedToday);
  const pendingActivities = profileData.activities.filter(activity => !activity.hasSubmittedToday);
  const totalActivities = profileData.activities.length;

  return (
    <Card className={classes.card} elevation={0} style={{ marginBottom: cardMarginBottom }}>
      <Box className={classes.header}>
        <Box display="flex" alignItems="center" style={{ flex: 1 }}>
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
            <PersonIcon style={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" component="h2" style={{ fontWeight: 600, color: '#8b7355', fontSize: '1.25rem' }}>
            Daily Progress
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" style={{ gap: '6px' }}>
          <Chip
            label={`${completedActivities.length}/${totalActivities}`}
            size="small"
            style={{
              backgroundColor: completedActivities.length === totalActivities ? 'rgba(107, 125, 90, 0.15)' : 'rgba(139, 115, 85, 0.1)',
              color: completedActivities.length === totalActivities ? '#6b7d5a' : '#8b7355',
              fontSize: '0.7rem',
              fontWeight: 'bold',
            }}
          />
          {profileData?.user?.totalPoints !== undefined && (
            <Chip
              label={`${profileData.user.totalPoints} pts`}
              size="small"
              style={{
                backgroundColor: 'rgba(139, 115, 85, 0.1)',
                color: '#8b7355',
                fontSize: '0.7rem',
                fontWeight: 'bold',
              }}
            />
          )}
          {completedActivities.length === totalActivities && (
            <Typography style={{ color: '#6b7d5a', fontSize: '1.2rem' }}>🎉</Typography>
          )}
        </Box>
      </Box>

      <CardContent style={{ padding: isMobile ? '12px 16px' : '16px 32px', textAlign: 'center' }}>
        <Box display="inline-block" style={{ textAlign: 'left' }}>
          <Box display="flex" style={{ gap: '24px', width: isMobile ? '320px' : '420px' }}>
            {/* Done Column */}
            <Box style={{ flex: 1 }}>
            <Box display="flex" alignItems="center" style={{ marginBottom: '12px' }}>
              <CheckIcon style={{ fontSize: '1.1rem', color: '#6b7d5a', marginRight: '6px' }} />
              <Typography variant="body2" style={{ color: '#6b7d5a', fontWeight: 'bold' }}>
                Done ({completedActivities.length})
              </Typography>
            </Box>
            {completedActivities.length === 0 ? (
              <Typography variant="caption" style={{ color: '#999', fontStyle: 'italic' }}>
                None yet
              </Typography>
            ) : (
              completedActivities.slice(0, 4).map((activity, index) => (
                <Box key={index} style={{ marginBottom: '6px' }}>
                  <Typography 
                    variant="body2" 
                    style={{ 
                      color: '#6b7d5a', 
                      lineHeight: 1.4,
                      fontSize: '0.85rem'
                    }}
                  >
                    • {activity.activityTitle}
                  </Typography>
                </Box>
              ))
            )}
            {completedActivities.length > 4 && (
              <Typography variant="caption" style={{ color: '#6b7d5a', fontStyle: 'italic' }}>
                +{completedActivities.length - 4} more
              </Typography>
            )}
            </Box>

            {/* Todo Column */}
            <Box style={{ flex: 1 }}>
            <Box display="flex" alignItems="center" style={{ marginBottom: '12px' }}>
              <PendingIcon style={{ fontSize: '1.1rem', color: '#d4c4a8', marginRight: '6px' }} />
              <Typography variant="body2" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                Todo ({pendingActivities.length})
              </Typography>
            </Box>
            {pendingActivities.length === 0 ? (
              <Typography variant="body2" style={{ color: '#6b7d5a', fontWeight: 'bold' }}>
                All done! 🎉
              </Typography>
            ) : (
              pendingActivities.slice(0, 4).map((activity, index) => (
                <Box key={index} style={{ marginBottom: '6px' }}>
                  <Typography 
                    variant="body2" 
                    style={{ 
                      color: '#8b7355', 
                      lineHeight: 1.4,
                      fontSize: '0.85rem'
                    }}
                  >
                    • {activity.activityTitle}
                  </Typography>
                </Box>
              ))
            )}
            {pendingActivities.length > 4 && (
              <Typography variant="caption" style={{ color: '#8b7355', fontStyle: 'italic' }}>
                +{pendingActivities.length - 4} more
              </Typography>
            )}
            </Box>
          </Box>
        </Box>
        
        {/* Sezione Streak Collassabile */}
        <Box className={classes.streakSection}>
          <Box 
            className={classes.streakHeader}
            onClick={() => setStreakExpanded(!streakExpanded)}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            style={{ padding: isMobile ? '8px 0' : '12px 0' }}
          >
            <Box display="flex" alignItems="center">
              <StreakIcon style={{ fontSize: '1.1rem', color: '#ff7043', marginRight: '8px' }} />
              <Typography variant="body2" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                Activity Streaks
              </Typography>
            </Box>
            <IconButton 
              size="small"
              className={`${classes.expandIcon} ${streakExpanded ? classes.expandIconOpen : ''}`}
              style={{ color: '#8b7355' }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          
          <Collapse in={streakExpanded}>
            <Box style={{ padding: isMobile ? '8px 0 16px 0' : '12px 0 20px 0' }}>
              {loadingStreaks ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={20} style={{ color: '#8b7355' }} />
                </Box>
              ) : (
                <Box>
                  {profileData?.activities?.slice(0, 6).map((activity, index) => {
                    const streak = streakData.get(activity.activityId);
                    const currentStreak = streak?.participation?.currentStreak ?? 0;
                    const streakProgress = getStreakProgress(currentStreak);
                    
                    return (
                      <Box key={activity.activityId} style={{ marginBottom: '16px' }}>
                        {/* Activity name and streak value */}
                        <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: '6px' }}>
                          <Typography 
                            variant="body2" 
                            style={{ 
                              color: '#8b7355', 
                              fontWeight: '500',
                              flex: 1,
                              fontSize: '0.85rem'
                            }}
                          >
                            {activity.activityTitle}
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <StreakIcon style={{ 
                              fontSize: '1rem', 
                              color: currentStreak > 0 ? '#ff7043' : '#d4c4a8',
                              marginRight: '4px' 
                            }} />
                            <Typography 
                              variant="body2" 
                              style={{ 
                                color: currentStreak > 0 ? '#ff7043' : '#999', 
                                fontSize: '0.85rem', 
                                fontWeight: 'bold',
                                marginRight: '4px'
                              }}
                            >
                              {currentStreak}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              style={{ 
                                color: currentStreak > 0 ? '#ff7043' : '#999', 
                                fontSize: '0.75rem'
                              }}
                            >
                              streak
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Progress bar - show always for better UX */}
                        <Box style={{ marginBottom: '4px' }}>
                          <Box 
                            style={{ 
                              width: '100%', 
                              height: '4px', 
                              backgroundColor: '#e0e0e0', 
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}
                          >
                            <Box 
                              style={{ 
                                height: '100%', 
                                width: `${streakProgress.progress}%`, 
                                backgroundColor: streakProgress.isMaxLevel ? '#4caf50' : (currentStreak > 0 ? '#ff7043' : '#d4c4a8'),
                                borderRadius: '2px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </Box>
                          <Typography 
                            variant="caption" 
                            style={{ 
                              color: '#999', 
                              fontSize: '0.7rem',
                              marginTop: '2px',
                              display: 'block'
                            }}
                          >
                            {streakProgress.isMaxLevel 
                              ? 'Max level reached! 🏆' 
                              : currentStreak === 0
                                ? `Start your streak! Next: ${streakProgress.nextLevel} days`
                                : `${streakProgress.remaining} to level ${streakProgress.nextLevel}`
                            }
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  
                  {(!profileData?.activities || profileData.activities.length === 0) && (
                    <Typography variant="body2" style={{ color: '#999', textAlign: 'center', fontStyle: 'italic' }}>
                      No activities found
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
};
