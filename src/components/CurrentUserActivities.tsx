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
  Grid,
  makeStyles
} from '@material-ui/core';
import { CheckCircle as CheckIcon, Schedule as PendingIcon, Person as PersonIcon } from '@material-ui/icons';
import { SneakerDBUserProfile } from '../types';
import { fetchSneakerDBProfile } from '../apiService';

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
}));

interface CurrentUserActivitiesProps {
  username: string;
}

export const CurrentUserActivities: React.FC<CurrentUserActivitiesProps> = ({ username }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [profileData, setProfileData] = useState<SneakerDBUserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) {
      setProfileData(null);
      return;
    }

    const loadUserProfile = async () => {
      setLoading(true);
      try {
        const data = await fetchSneakerDBProfile(username);
        setProfileData(data);
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
    <Card className={classes.card} elevation={0}>
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

      <CardContent style={{ padding: isMobile ? '12px 16px' : '16px 24px', textAlign: 'center' }}>
        <Box display="inline-block" style={{ textAlign: 'left' }}>
          <Box display="flex" style={{ gap: '16px', width: isMobile ? '280px' : '350px' }}>
            {/* Done Column */}
            <Box style={{ flex: 1 }}>
            <Box display="flex" alignItems="center" style={{ marginBottom: '8px' }}>
              <CheckIcon style={{ fontSize: '1rem', color: '#6b7d5a', marginRight: '4px' }} />
              <Typography variant="caption" style={{ color: '#6b7d5a', fontWeight: 'bold' }}>
                Done ({completedActivities.length})
              </Typography>
            </Box>
            {completedActivities.length === 0 ? (
              <Typography variant="caption" style={{ color: '#999', fontStyle: 'italic' }}>
                None yet
              </Typography>
            ) : (
              completedActivities.slice(0, 3).map((activity, index) => (
                <Typography 
                  key={index} 
                  variant="caption" 
                  style={{ 
                    display: 'block', 
                    color: '#6b7d5a', 
                    lineHeight: 1.3,
                    marginBottom: '2px',
                    fontSize: '0.75rem'
                  }}
                >
                  • {activity.activityTitle}
                </Typography>
              ))
            )}
            {completedActivities.length > 3 && (
              <Typography variant="caption" style={{ color: '#6b7d5a', fontStyle: 'italic' }}>
                +{completedActivities.length - 3} more
              </Typography>
            )}
            </Box>

            {/* Todo Column */}
            <Box style={{ flex: 1 }}>
            <Box display="flex" alignItems="center" style={{ marginBottom: '8px' }}>
              <PendingIcon style={{ fontSize: '1rem', color: '#d4c4a8', marginRight: '4px' }} />
              <Typography variant="caption" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                Todo ({pendingActivities.length})
              </Typography>
            </Box>
            {pendingActivities.length === 0 ? (
              <Typography variant="caption" style={{ color: '#6b7d5a', fontWeight: 'bold' }}>
                All done! 🎉
              </Typography>
            ) : (
              pendingActivities.slice(0, 3).map((activity, index) => (
                <Typography 
                  key={index} 
                  variant="caption" 
                  style={{ 
                    display: 'block', 
                    color: '#8b7355', 
                    lineHeight: 1.3,
                    marginBottom: '2px',
                    fontSize: '0.75rem'
                  }}
                >
                  • {activity.activityTitle}
                </Typography>
              ))
            )}
            {pendingActivities.length > 3 && (
              <Typography variant="caption" style={{ color: '#8b7355', fontStyle: 'italic' }}>
                +{pendingActivities.length - 3} more
              </Typography>
            )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
