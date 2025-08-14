import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Avatar,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Chip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { SneakerDBUserProfile } from '../types';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      backgroundColor: '#f5f1eb',
      borderRadius: '12px',
    },
  },
  dialogTitle: {
    backgroundColor: '#e0dfca',
    color: '#8b7355',
    fontWeight: 'bold',
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      '& fieldset': {
        borderColor: '#d4c4a8',
      },
      '&:hover fieldset': {
        borderColor: '#8b7355',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#8b7355',
      },
    },
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    marginTop: theme.spacing(2),
    border: '1px solid #d4c4a8',
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#8b7355',
    fontSize: '2rem',
  },
  statChip: {
    backgroundColor: '#d4c4a8',
    color: '#8b7355',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#6d5a42',
    },
    borderRadius: '8px',
  },
  secondaryButton: {
    color: '#8b7355',
    borderColor: '#8b7355',
    '&:hover': {
      backgroundColor: '#f5f1eb',
      borderColor: '#6d5a42',
    },
    borderRadius: '8px',
  },
}));

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
  username?: string;
  onUsernameSet: (username: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  open,
  onClose,
  username,
  onUsernameSet,
}) => {
  const classes = useStyles();
  const [inputUsername, setInputUsername] = useState(username || '');
  const [profileData, setProfileData] = useState<SneakerDBUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(!username);

  useEffect(() => {
    if (username && open) {
      fetchUserProfile(username);
    }
  }, [username, open]);

  const fetchUserProfile = async (usernameToFetch: string) => {
    setLoading(true);
    setError(null);
    
    const apiUrl = `https://tools.sneakerdb.net/api/isrucamp-user-profile/${usernameToFetch}`;
    console.log('👤 Starting profile API call to:', apiUrl);
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Location:', window.location.href);
    
    try {
      console.log('📡 Making profile fetch request...');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      console.log('📊 Profile response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        throw new Error(`User profile not found - HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Profile data parsed successfully:', {
        hasUser: !!data.user,
        username: data.user?.username,
        activitiesCount: data.activities?.length || 0,
        modulesCount: data.completedModules?.length || 0
      });
      
      setProfileData(data);
    } catch (err) {
      const errorDetails = err instanceof Error ? {
        message: err.message,
        name: err.name,
        stack: err.stack
      } : {
        message: String(err),
        name: 'UnknownError',
        stack: undefined
      };
      
      console.error('❌ Profile API Error Details:', {
        ...errorDetails,
        url: apiUrl,
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        isMobile: /iPhone|iPad|iPod|Android/.test(navigator.userAgent)
      });
      
      // Show user-friendly message on mobile
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert(`📱 Profile loading issue on Safari mobile. Error: ${errorDetails.message}`);
      }
      
      setError(errorDetails.message);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = () => {
    if (inputUsername.trim()) {
      const trimmedUsername = inputUsername.trim();
      localStorage.setItem('isru-username', trimmedUsername);
      onUsernameSet(trimmedUsername);
      setIsFirstTime(false);
      fetchUserProfile(trimmedUsername);
    }
  };

  const handleChangeUsername = () => {
    setIsFirstTime(true);
    setProfileData(null);
    setError(null);
  };

  const handleDeleteProfile = () => {
    localStorage.removeItem('isru-username');
    onUsernameSet('');
    setProfileData(null);
    setInputUsername('');
    setIsFirstTime(true);
    onClose();
  };

  const renderFirstTimeSetup = () => (
    <>
      <DialogTitle className={classes.dialogTitle}>
        Welcome to ISRU Metrics
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" style={{ marginBottom: 16, color: '#8b7355' }}>
          Enter your username to set up your profile and track your metrics:
        </Typography>
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          className={classes.textField}
          onKeyPress={(e) => e.key === 'Enter' && handleSaveUsername()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} className={classes.secondaryButton}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveUsername}
          disabled={!inputUsername.trim()}
          className={classes.button}
        >
          Save Profile
        </Button>
      </DialogActions>
    </>
  );

  const renderProfileView = () => (
    <>
      <DialogTitle className={classes.dialogTitle}>
        User Profile
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress style={{ color: '#8b7355' }} />
            <Typography variant="body2" style={{ marginLeft: 16, color: '#8b7355' }}>
              Loading profile...
            </Typography>
          </Box>
        )}

        {error && (
          <Box
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              color: '#856404'
            }}
          >
            <Typography variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {profileData && (
          <Card className={classes.profileCard}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  className={classes.avatar}
                  src={profileData.user.profilePhotoUrl}
                >
                  {profileData.user.firstName.charAt(0).toUpperCase()}
                </Avatar>
                <Box ml={2}>
                  <Typography variant="h6" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                    {profileData.user.firstName} {profileData.user.lastName}
                  </Typography>
                  <Typography variant="body2" style={{ color: '#8b7355' }}>
                    @{profileData.user.username}
                  </Typography>
                  <Typography variant="caption" style={{ color: '#8b7355' }}>
                    ID: {profileData.user.idNumber}
                  </Typography>
                  <br />
                  <Typography variant="caption" style={{ color: '#8b7355' }}>
                    Member since: {new Date(profileData.user.dateJoined).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Divider style={{ backgroundColor: '#d4c4a8', margin: '16px 0' }} />
              
              {/* Statistics Section */}
              <Box mb={2}>
                <Typography variant="subtitle2" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 8 }}>
                  Statistics
                </Typography>
                <Box display="flex" flexWrap="wrap" style={{ gap: '8px' }}>
                  <Chip
                    label={`Total Points: ${profileData.user.totalPoints}`}
                    className={classes.statChip}
                    size="small"
                  />
                  <Chip
                    label={`Excellence Awards: ${profileData.user.excellenceAwardsCount}`}
                    className={classes.statChip}
                    size="small"
                  />
                  {profileData.user.profileExcellenceRank && (
                    <Chip
                      label={`Excellence Rank: ${profileData.user.profileExcellenceRank}`}
                      className={classes.statChip}
                      size="small"
                    />
                  )}
                </Box>
              </Box>

              {/* Active Activities Section */}
              {profileData.activities && profileData.activities.length > 0 && (
                <>
                  <Divider style={{ backgroundColor: '#d4c4a8', margin: '16px 0' }} />
                  <Box mb={2}>
                    <Typography variant="subtitle2" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 8 }}>
                      Active Activities ({profileData.activities.length})
                    </Typography>
                    {profileData.activities.map((activity) => (
                      <Box key={activity.activityId} mb={1} p={1} style={{ backgroundColor: '#f9f8f6', borderRadius: 8 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                              Week {activity.activityWeek}: {activity.activityTitle}
                            </Typography>
                            <Typography variant="caption" style={{ color: '#8b7355' }}>
                              Level {activity.level} • Started: {new Date(activity.dateStarted).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box display="flex" style={{ gap: '4px' }}>
                            {activity.hasSubmittedToday && (
                              <Chip
                                label="Today ✓"
                                size="small"
                                style={{ backgroundColor: '#6b7d5a', color: 'white', fontSize: '0.7rem' }}
                              />
                            )}
                            {activity.hasSubmittedYesterday && (
                              <Chip
                                label="Yesterday ✓"
                                size="small"
                                style={{ backgroundColor: '#8b7355', color: 'white', fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              )}

              {/* Completed Modules Section */}
              {profileData.completedModules && profileData.completedModules.length > 0 && (
                <>
                  <Divider style={{ backgroundColor: '#d4c4a8', margin: '16px 0' }} />
                  <Box>
                    <Typography variant="subtitle2" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 8 }}>
                      Completed Modules ({profileData.completedModules.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" style={{ gap: '8px' }}>
                      {profileData.completedModules.map((module) => (
                        <Chip
                          key={module.id}
                          label={module.name}
                          className={classes.statChip}
                          size="small"
                          style={{ backgroundColor: '#6b7d5a', color: 'white' }}
                        />
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Box mt={2}>
          <Typography variant="body2" style={{ color: '#8b7355', fontStyle: 'italic' }}>
            Current username: {username}
          </Typography>
          {profileData && (
            <Typography variant="body2" style={{ color: '#8b7355', fontStyle: 'italic' }}>
              Profile ID: {profileData.user.id} • Last updated: {new Date(profileData.user.profilePhotoData.updatedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeleteProfile} style={{ color: '#d32f2f' }}>
          Delete Profile
        </Button>
        <Button onClick={handleChangeUsername} className={classes.secondaryButton}>
          Change Username
        </Button>
        <Button onClick={onClose} className={classes.button}>
          Close
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={classes.dialog}
      PaperProps={{
        style: {
          maxHeight: '90vh',
          overflow: 'auto'
        }
      }}
    >
      {isFirstTime ? renderFirstTimeSetup() : renderProfileView()}
    </Dialog>
  );
};
