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
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Snackbar
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ShareIcon from '@material-ui/icons/Share';
import GetAppIcon from '@material-ui/icons/GetApp';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Whatshot as StreakIcon } from '@material-ui/icons';
import { SneakerDBUserProfile, ActivityStreakResponse } from '../types';
import { fetchSneakerDBProfile, fetchActivityStreak } from '../apiService';
import ProfileExportService from '../services/profileExportService';

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
  inline?: boolean; // Add inline mode for mobile
}

export const UserProfile: React.FC<UserProfileProps> = ({
  open,
  onClose,
  username,
  onUsernameSet,
  inline = false,
}) => {
  console.log('🚀 UserProfile render:', { 
    open, 
    username, 
    inline, 
    timestamp: new Date().toISOString() 
  });
  
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [inputUsername, setInputUsername] = useState(username || '');
  const [profileData, setProfileData] = useState<SneakerDBUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(!username);
  const [streakData, setStreakData] = useState<Map<number, ActivityStreakResponse>>(new Map());
  const [loadingStreaks, setLoadingStreaks] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Notification handlers
  const showNotification = (message: string, severity: 'success' | 'error' = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Update isFirstTime when username changes
  useEffect(() => {
    setIsFirstTime(!username);
  }, [username]);

  // Export handlers
  const handleExportProfile = async () => {
    if (!username || !profileData) return;
    try {
      const elementId = 'user-profile-modal-content';
      await ProfileExportService.exportProfileAsImage(elementId, username);
      showNotification('✅ Profile exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('❌ Export failed. Please try again.', 'error');
    }
  };

  const handleShareProfile = async () => {
    if (!username || !profileData) return;
    try {
      const elementId = 'user-profile-modal-content';
      const fullName = `${profileData.user.firstName} ${profileData.user.lastName}`;
      
      await ProfileExportService.shareProfile(elementId, username, `${fullName}'s I.S.R.U League Profile`);
      showNotification('✅ Profile shared successfully!');
    } catch (error) {
      console.error('Share failed:', error);
      showNotification('❌ Share failed. Profile exported instead.', 'error');
    }
  };

  const handleCopyProfile = async () => {
    if (!username || !profileData) return;
    try {
      const elementId = 'user-profile-modal-content';
      await ProfileExportService.copyProfileToClipboard(elementId);
      showNotification('✅ Profile copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      showNotification('❌ Copy failed. This feature may not be supported.', 'error');
    }
  };

  useEffect(() => {
    console.log('🔍 UserProfile useEffect triggered:', { username, open, inline, isFirstTime });
    if (username && open) {
      console.log('✅ Fetching profile for:', username);
      fetchUserProfile(username);
    } else {
      console.log('❌ Skipping fetch - conditions not met:', { username: !!username, open });
    }
  }, [username, open]);

  // Function to load streak data for activities
  const loadStreakData = async (activities: any[], username: string) => {
    setLoadingStreaks(true);
    const newStreakData = new Map<number, ActivityStreakResponse>();
    
    try {
      // Load streak data for each activity (limit to first 10 for performance)
      const streakPromises = activities.slice(0, 10).map(async (activity) => {
        try {
          const streak = await fetchActivityStreak(username, activity.activityId);
          
          if (streak) {
            // Handle different possible response structures
            let processedStreak = streak;
            
            // Check if the response is wrapped in a proxy container
            if (streak.contents && typeof streak.contents === 'string') {
              try {
                processedStreak = JSON.parse(streak.contents);
              } catch (e) {
                console.warn('UserProfile: Could not parse streak contents as JSON');
              }
            } else if (streak.contents && typeof streak.contents === 'object') {
              processedStreak = streak.contents;
            }
            
            // Check if we have the expected structure
            if (processedStreak && typeof processedStreak === 'object') {
              newStreakData.set(activity.activityId, processedStreak);
            } else {
              // Set default streak 0 if data structure is invalid
              const defaultStreak: ActivityStreakResponse = {
                current_streak: 0,
                longest_streak: 0,
                total_participations: 0,
                activity_id: activity.activityId,
                username: username
              };
              newStreakData.set(activity.activityId, defaultStreak);
            }
          } else {
            // Set default streak 0 if no data received
            const defaultStreak: ActivityStreakResponse = {
              current_streak: 0,
              longest_streak: 0,
              total_participations: 0,
              activity_id: activity.activityId,
              username: username
            };
            newStreakData.set(activity.activityId, defaultStreak);
          }
        } catch (error) {
          console.log(`UserProfile: Could not load streak for activity ${activity.activityId}:`, error);
          // Set default streak 0 in case of error
          const defaultStreak: ActivityStreakResponse = {
            current_streak: 0,
            longest_streak: 0,
            total_participations: 0,
            activity_id: activity.activityId,
            username: username
          };
          newStreakData.set(activity.activityId, defaultStreak);
        }
      });

      await Promise.all(streakPromises);
      setStreakData(newStreakData);
    } catch (error) {
      console.error('UserProfile: Error loading streak data:', error);
    } finally {
      setLoadingStreaks(false);
    }
  };

  const fetchUserProfile = async (usernameToFetch: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchSneakerDBProfile(usernameToFetch);
      
      console.log('✅ Profile data parsed successfully:', {
        hasUser: !!data.user,
        username: data.user?.username,
        activitiesCount: data.activities?.length || 0,
        modulesCount: data.completedModules?.length || 0
      });
      
      setProfileData(data);
      
      // Load streak data after profile is loaded
      if (data?.activities) {
        await loadStreakData(data.activities, usernameToFetch);
      }
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
        username: usernameToFetch,
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
      console.log('🔄 UserProfile: Saving username to localStorage:', trimmedUsername);
      localStorage.setItem('isru-username', trimmedUsername);
      console.log('✅ UserProfile: localStorage after save:', localStorage.getItem('isru-username'));
      onUsernameSet(trimmedUsername);
      setIsFirstTime(false);
      fetchUserProfile(trimmedUsername);
    }
  };

  const handleChangeUsername = () => {
    setIsFirstTime(true);
    setProfileData(null);
    setError(null);
    // In modalità inline, resetta anche l'username per mostrare il form di cambio
    if (inline) {
      setInputUsername('');
      // Notifica al parent component che l'username è stato resettato
      onUsernameSet('');
    }
  };

  const handleDeleteProfile = () => {
    localStorage.removeItem('isru-username');
    onUsernameSet('');
    setProfileData(null);
    setInputUsername('');
    setIsFirstTime(true);
    // In modalità inline non chiudiamo, solo resettiamo lo stato
    if (!inline) {
      onClose();
    }
  };

  const renderFirstTimeSetup = () => (
    <>
      <DialogTitle className={classes.dialogTitle}>
        Welcome to I.S.R.U League
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" style={{ marginBottom: 16, color: '#8b7355' }}>
          Enter your username to set up your profile and track your league position:
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
        {!inline && (
          <Button onClick={onClose} className={classes.secondaryButton}>
            Cancel
          </Button>
        )}
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
          <Card 
            className={classes.profileCard}
          >
            <CardContent id="user-profile-modal-content"
              style={{
                background: 'linear-gradient(135deg, #fefdfb 0%, #f8f6f1 100%)',
                borderRadius: 12,
                padding: 24,
              }}
            >
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
                    {profileData.activities.map((activity) => {
                      const streak = streakData.get(activity.activityId);
                      const currentStreak = streak?.current_streak ?? 0;
                      const streakProgress = getStreakProgress(currentStreak);
                      
                      return (
                        <Box key={activity.activityId} mb={1} p={1} style={{ backgroundColor: '#f9f8f6', borderRadius: 8 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box style={{ flex: 1 }}>
                              <Box display="flex" alignItems="center" style={{ gap: '8px', marginBottom: '4px' }}>
                                <Typography variant="body2" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                                  Week {activity.activityWeek}: {activity.activityTitle}
                                </Typography>
                                {loadingStreaks && !streak ? (
                                  <CircularProgress size={12} style={{ color: '#d4c4a8' }} />
                                ) : (
                                  <Box display="flex" alignItems="center" style={{ gap: '2px' }}>
                                    <StreakIcon style={{ 
                                      fontSize: '1rem', 
                                      color: currentStreak > 0 ? '#ff7043' : '#d4c4a8'
                                    }} />
                                    <Typography 
                                      variant="caption" 
                                      style={{ 
                                        color: currentStreak > 0 ? '#ff7043' : '#999', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 'bold',
                                        marginRight: '2px'
                                      }}
                                    >
                                      {currentStreak}
                                    </Typography>
                                    <Typography 
                                      variant="caption" 
                                      style={{ 
                                        color: currentStreak > 0 ? '#ff7043' : '#999', 
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      streak
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              
                              {/* Progress bar - only show if streak > 0 */}
                              {currentStreak > 0 && (
                                <Box style={{ marginBottom: '4px', maxWidth: '200px' }}>
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
                                        backgroundColor: streakProgress.isMaxLevel ? '#4caf50' : '#ff7043',
                                        borderRadius: '2px',
                                        transition: 'width 0.3s ease'
                                      }}
                                    />
                                  </Box>
                                  <Typography 
                                    variant="caption" 
                                    style={{ 
                                      color: '#999', 
                                      fontSize: '0.65rem',
                                      marginTop: '2px',
                                      display: 'block'
                                    }}
                                  >
                                    {streakProgress.isMaxLevel 
                                      ? 'Max level reached! 🏆' 
                                      : `${streakProgress.remaining} to level ${streakProgress.nextLevel}`
                                    }
                                  </Typography>
                                </Box>
                              )}
                              
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
                      );
                    })}
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

        {/* Export Controls - Solo se il profilo è caricato */}
        {profileData && !loading && !error && (
          <Box 
            display="flex" 
            justifyContent="center"
            alignItems="center"
            style={{ 
              gap: 8,
              marginTop: 16,
              marginBottom: 8,
              padding: '0 16px',
            }}
          >
            <Tooltip title="Share Profile">
              <IconButton
                onClick={handleShareProfile}
                style={{
                  backgroundColor: '#8b7355',
                  color: 'white',
                  padding: 10,
                  borderRadius: 12,
                }}
                size="small"
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download as Image">
              <IconButton
                onClick={handleExportProfile}
                style={{
                  backgroundColor: '#a0916c',
                  color: 'white',
                  padding: 10,
                  borderRadius: 12,
                }}
                size="small"
              >
                <GetAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Copy to Clipboard">
              <IconButton
                onClick={handleCopyProfile}
                style={{
                  backgroundColor: '#6b7d5a',
                  color: 'white',
                  padding: 10,
                  borderRadius: 12,
                }}
                size="small"
              >
                <FileCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleChangeUsername} className={classes.secondaryButton}>
          Change Username
        </Button>
        {!inline && (
          <>
            <Button onClick={handleDeleteProfile} style={{ color: '#d32f2f' }}>
              Delete Profile
            </Button>
            <Button onClick={onClose} className={classes.button}>
              Close
            </Button>
          </>
        )}
      </DialogActions>
    </>
  );

  const content = (
    <>
      {console.log('🎭 Rendering content:', { isFirstTime, loading, error: !!error, profileData: !!profileData, inline })}
      {/* In modalità inline con username, salta il renderProfileView e vai direttamente al layout inline */}
      {(inline && username) ? null : (isFirstTime ? renderFirstTimeSetup() : renderProfileView())}
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <div
          style={{
            backgroundColor: notification.severity === 'success' ? '#4caf50' : '#f44336',
            color: 'white',
            padding: '12px 16px',
            borderRadius: 8,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {notification.message}
        </div>
      </Snackbar>
    </>
  );

  // Modalità inline per mobile (come pagina)
  if (inline) {
    return (
      <Box style={{ 
        backgroundColor: '#f5f1eb', 
        minHeight: '100vh', 
        padding: '0'
      }}>
        <Box style={{
          maxWidth: '100%',
          margin: '0 auto',
          backgroundColor: '#f5f1eb',
        }}>
          {/* Content per modalità inline - senza header separato */}
          <Box style={{ padding: '24px' }}>
            {/* In modalità inline, se abbiamo un username, mostra sempre il profilo completo */}
            {(isFirstTime && !username) ? (
              // First time setup inline - design migliorato
              <Box style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center'
              }}>
                {/* Icon/Logo area */}
                <Box style={{
                  backgroundColor: '#8b7355',
                  borderRadius: '50%',
                  padding: '20px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3)'
                }}>
                  <Typography variant="h3" style={{ 
                    color: 'white',
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    🚀
                  </Typography>
                </Box>

                <Typography variant="h5" style={{ 
                  color: '#8b7355', 
                  fontWeight: 'bold',
                  marginBottom: '12px'
                }}>
                  Welcome to I.S.R.U League
                </Typography>
                
                <Typography variant="body1" style={{ 
                  color: '#8b7355', 
                  marginBottom: '32px',
                  maxWidth: '300px',
                  lineHeight: 1.6
                }}>
                  Enter your ISRU username to get started and see your stats, activities, and league position
                </Typography>
                
                <Box style={{ width: '100%', maxWidth: '280px' }}>
                  <TextField
                    label="ISRU Username"
                    variant="outlined"
                    fullWidth
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    className={classes.textField}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveUsername()}
                    style={{ marginBottom: '24px' }}
                  />
                  <Button
                    onClick={handleSaveUsername}
                    disabled={!inputUsername.trim()}
                    className={classes.button}
                    size="large"
                    fullWidth
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold'
                    }}
                  >
                    Get Started
                  </Button>
                </Box>
              </Box>
            ) : (
              // Profile view inline - usa il contenuto della card esistente ma senza Dialog wrapper
              <>
                {loading && (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress style={{ color: '#8b7355' }} />
                  </Box>
                )}

                {error && (
                  <Box
                    p={2}
                    mb={2}
                    style={{
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
                  // Contenuto diretto senza Card wrapper
                  <Box
                    id="user-profile-modal-content"
                    style={{
                      padding: 0, // Rimuovo padding extra
                    }}
                  >
                    {/* Informazioni utente */}
                    <Box display="flex" alignItems="center" mb={3}>
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
                            {profileData.activities.map((activity) => {
                              const streak = streakData.get(activity.activityId);
                              const currentStreak = streak?.current_streak ?? 0;
                              const streakProgress = getStreakProgress(currentStreak);
                              
                              return (
                                <Box key={activity.activityId} mb={1} p={1} style={{ backgroundColor: '#f9f8f6', borderRadius: 8 }}>
                                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box style={{ flex: 1 }}>
                                      <Box display="flex" alignItems="center" style={{ gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                        <Typography variant="body2" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                                          Week {activity.activityWeek}: {activity.activityTitle}
                                        </Typography>
                                        {loadingStreaks && !streak ? (
                                          <CircularProgress size={10} style={{ color: '#d4c4a8' }} />
                                        ) : (
                                          <Box display="flex" alignItems="center" style={{ gap: '2px' }}>
                                            <StreakIcon style={{ 
                                              fontSize: '0.9rem', 
                                              color: currentStreak > 0 ? '#ff7043' : '#d4c4a8'
                                            }} />
                                            <Typography 
                                              variant="caption" 
                                              style={{ 
                                                color: currentStreak > 0 ? '#ff7043' : '#999', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 'bold',
                                                marginRight: '2px'
                                              }}
                                            >
                                              {currentStreak}
                                            </Typography>
                                            <Typography 
                                              variant="caption" 
                                              style={{ 
                                                color: currentStreak > 0 ? '#ff7043' : '#999', 
                                                fontSize: '0.65rem'
                                              }}
                                            >
                                              streak
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>
                                      
                                      {/* Progress bar - only show if streak > 0 */}
                                      {currentStreak > 0 && (
                                        <Box style={{ marginBottom: '4px', maxWidth: '180px' }}>
                                          <Box 
                                            style={{ 
                                              width: '100%', 
                                              height: '3px', 
                                              backgroundColor: '#e0e0e0', 
                                              borderRadius: '2px',
                                              overflow: 'hidden'
                                            }}
                                          >
                                            <Box 
                                              style={{ 
                                                height: '100%', 
                                                width: `${streakProgress.progress}%`, 
                                                backgroundColor: streakProgress.isMaxLevel ? '#4caf50' : '#ff7043',
                                                borderRadius: '2px',
                                                transition: 'width 0.3s ease'
                                              }}
                                            />
                                          </Box>
                                          <Typography 
                                            variant="caption" 
                                            style={{ 
                                              color: '#999', 
                                              fontSize: '0.6rem',
                                              marginTop: '2px',
                                              display: 'block'
                                            }}
                                          >
                                            {streakProgress.isMaxLevel 
                                              ? 'Max level reached! 🏆' 
                                              : `${streakProgress.remaining} to level ${streakProgress.nextLevel}`
                                            }
                                          </Typography>
                                        </Box>
                                      )}
                                      
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
                              );
                            })}
                          </Box>
                        </>
                      )}

                      {/* Completed Modules Section */}
                      {profileData.completedModules && profileData.completedModules.length > 0 && (
                        <>
                          <Divider style={{ backgroundColor: '#d4c4a8', margin: '16px 0' }} />
                          <Box mb={2}>
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

                      {/* Share/Export buttons inline */}
                      {profileData && (
                        <Box display="flex" alignItems="center" style={{ gap: '8px', marginBottom: '16px' }}>
                          <Tooltip title="Share profile as image">
                            <IconButton
                              onClick={handleShareProfile}
                              style={{
                                backgroundColor: '#8b7355',
                                color: 'white',
                                padding: '8px',
                              }}
                              size="small"
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export profile as image">
                            <IconButton
                              onClick={handleExportProfile}
                              style={{
                                backgroundColor: '#6b7d5a',
                                color: 'white',
                                padding: '8px',
                              }}
                              size="small"
                            >
                              <GetAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy profile to clipboard">
                            <IconButton
                              onClick={handleCopyProfile}
                              style={{
                                backgroundColor: '#a0916c',
                                color: 'white',
                                padding: '8px',
                              }}
                              size="small"
                            >
                              <FileCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                  </Box>
                )}

                {/* Action buttons per modalità inline */}
                <Box style={{ textAlign: 'center', marginTop: '24px' }}>
                  <Button 
                    onClick={handleChangeUsername} 
                    className={classes.secondaryButton}
                    size="large"
                  >
                    Change Username
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
        
        {/* Notification per modalità inline */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={closeNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <div
            style={{
              backgroundColor: notification.severity === 'success' ? '#4caf50' : '#f44336',
              color: 'white',
              padding: '12px 16px',
              borderRadius: 8,
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {notification.message}
          </div>
        </Snackbar>
      </Box>
    );
  }

  // Modalità normale (Dialog)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile} // Full screen su mobile
      className={classes.dialog}
      PaperProps={{
        style: {
          maxHeight: isMobile ? '100vh' : '75vh', // Full height su mobile, limitata su desktop
          overflow: 'auto',
          margin: isMobile ? 0 : undefined, // Rimuove margini su mobile
        }
      }}
    >
      {content}
    </Dialog>
  );
};
