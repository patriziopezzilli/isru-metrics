import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  useMediaQuery,
  useTheme,
  makeStyles
} from '@material-ui/core';
import { Whatshot as StreakIcon } from '@material-ui/icons';
import { SneakerDBUserProfile, ActivityStreakResponse } from '../types';
import { fetchSneakerDBProfile, fetchActivityStreak } from '../apiService';

const useStyles = makeStyles((theme) => ({
  headerBar: {
    backgroundColor: '#f8f8f8',
    borderBottom: '1px solid #e0e0e0',
    padding: '8px 16px',
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
    '&::-webkit-scrollbar': {
      height: 4,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#f1f1f1',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#c1c1c1',
      borderRadius: 2,
    },
    [theme.breakpoints.down('sm')]: {
      padding: '6px 12px',
    },
  },
  activityItem: {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 12,
    padding: '4px 8px',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: 16,
    fontSize: '0.75rem',
    minWidth: 'auto',
    height: 28,
    '& .MuiChip-icon': {
      width: 16,
      height: 16,
      marginLeft: 4,
      marginRight: -4,
    },
    [theme.breakpoints.down('sm')]: {
      marginRight: 8,
      padding: '3px 6px',
      fontSize: '0.7rem',
      height: 24,
    },
  },
  activityBadge: {
    width: 16,
    height: 16,
    marginRight: 4,
    borderRadius: 3,
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& img': {
      width: 12,
      height: 12,
      objectFit: 'contain',
      filter: 'grayscale(100%)',
    },
    [theme.breakpoints.down('sm')]: {
      width: 14,
      height: 14,
      '& img': {
        width: 10,
        height: 10,
      },
    },
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  weekText: {
    fontSize: '0.65rem',
    color: '#666',
    marginRight: 4,
    fontWeight: 500,
  },
  streakContainer: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 4,
    '& .streak-icon': {
      fontSize: 12,
      color: '#666',
      marginRight: 2,
    },
    '& .streak-text': {
      fontSize: '0.65rem',
      color: '#666',
      fontWeight: 'bold',
    },
  },
}));

// Helper function to get the full badge image URL
const getBadgeImageUrl = (badgeImage: string | null): string | null => {
  if (!badgeImage) return null;
  
  if (badgeImage.startsWith('http')) {
    return badgeImage;
  }
  
  if (badgeImage.startsWith('/badges/')) {
    return `https://media.isrucamp.com${badgeImage}`;
  }
  
  return `https://media.isrucamp.com/badges/${badgeImage}`;
};

interface ActivityHeaderBarProps {
  username: string;
}

const ActivityHeaderBar: React.FC<ActivityHeaderBarProps> = ({ username }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [profileData, setProfileData] = useState<SneakerDBUserProfile | null>(null);
  const [streakData, setStreakData] = useState<Map<number, ActivityStreakResponse>>(new Map());
  const [loading, setLoading] = useState(true);

  // Function to load streak data for activities
  const loadStreakData = async (activities: any[], username: string) => {
    const newStreakData = new Map<number, ActivityStreakResponse>();
    
    try {
      // Load streak data for all activities (limit to 10 for performance)
      const streakPromises = activities.slice(0, 10).map(async (activity) => {
        try {
          const streak = await fetchActivityStreak(username.toLowerCase(), activity.activityId);
          
          if (streak) {
            let processedStreak = streak;
            
            if (streak.contents && typeof streak.contents === 'string') {
              try {
                processedStreak = JSON.parse(streak.contents);
              } catch (e) {
                console.warn('Could not parse streak contents as JSON');
              }
            } else if (streak.contents && typeof streak.contents === 'object') {
              processedStreak = streak.contents;
            }
            
            if (processedStreak && typeof processedStreak === 'object') {
              if (processedStreak.participation && typeof processedStreak.participation.currentStreak === 'number') {
                newStreakData.set(activity.activityId, processedStreak);
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
            }
          }
        } catch (error) {
          console.error('Error loading streak for activity:', activity.activityId, error);
        }
      });
      
      await Promise.all(streakPromises);
      setStreakData(newStreakData);
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchSneakerDBProfile(username.toLowerCase());
        setProfileData(data);
        
        if (data.activities && data.activities.length > 0) {
          await loadStreakData(data.activities, username.toLowerCase());
        }
      } catch (error) {
        console.error('Error loading profile data for header:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username]);

  if (!username) {
    return null;
  }

  if (loading) {
    return (
      <Box className={classes.headerBar}>
        <Box className={classes.loadingContainer}>
          <CircularProgress size={16} style={{ color: '#666' }} />
        </Box>
      </Box>
    );
  }

  if (!profileData || !profileData.activities || profileData.activities.length === 0) {
    return null;
  }

  return (
    <Box className={classes.headerBar}>
      {profileData.activities.map((activity) => {
        const streak = streakData.get(activity.activityId);
        const currentStreak = streak?.participation?.currentStreak ?? 0;
        
        return (
          <Chip
            key={activity.activityId}
            className={classes.activityItem}
            size="small"
            variant="outlined"
            icon={
              <Box className={classes.streakContainer}>
                <StreakIcon className="streak-icon" />
                <span className="streak-text">{currentStreak}</span>
              </Box>
            }
            label={
              <Box display="flex" alignItems="center">
                {activity.activityBadgeImage && (
                  <Box className={classes.activityBadge}>
                    <img 
                      src={getBadgeImageUrl(activity.activityBadgeImage) || ''} 
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Box>
                )}
                <span className={classes.weekText}>W{activity.activityWeek}</span>
                {!isMobile && (
                  <span style={{ fontSize: '0.7rem', color: '#333' }}>
                    {activity.activityTitle.length > 15 
                      ? `${activity.activityTitle.substring(0, 15)}...`
                      : activity.activityTitle
                    }
                  </span>
                )}
              </Box>
            }
          />
        );
      })}
    </Box>
  );
};

export default ActivityHeaderBar;
