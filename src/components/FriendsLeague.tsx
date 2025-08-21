import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon
} from '@material-ui/icons';
import { SneakerDBUserProfile } from '../types';
import { fetchSneakerDBProfile } from '../apiService';

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    marginBottom: theme.spacing(3),
    border: '1px solid #d4c4a8',
    boxShadow: '0 4px 6px -1px rgba(139, 115, 85, 0.1)',
    [theme.breakpoints.down('sm')]: {
      borderRadius: '12px',
      marginBottom: theme.spacing(2),
    },
  },
  header: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    padding: '16px 24px',
    borderRadius: '16px 16px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      padding: '12px 16px',
      borderRadius: '12px 12px 0 0',
      flexDirection: 'row', // Mantieni sempre su una riga su mobile
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  },
  leaderboardItem: {
    backgroundColor: '#f9f8f6',
    marginBottom: '8px',
    borderRadius: '12px',
    border: '1px solid #e6ddd4',
    [theme.breakpoints.down('sm')]: {
      borderRadius: '8px',
      marginBottom: '6px',
    },
  },
  rankBadge: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    fontWeight: 'bold',
    minWidth: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    [theme.breakpoints.down('sm')]: {
      minWidth: '28px',
      height: '28px',
      marginRight: '8px',
      fontSize: '0.8rem',
    },
  },
  goldBadge: {
    backgroundColor: '#FFD700',
    color: '#000000',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
    color: '#000000',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
    color: '#ffffff',
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#8b7355',
    marginRight: '12px',
    [theme.breakpoints.down('sm')]: {
      width: 40,
      height: 40,
      marginRight: '8px',
    },
  },
  statChip: {
    backgroundColor: '#d4c4a8',
    color: '#8b7355',
    fontWeight: 'bold',
    margin: '2px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.7rem',
      height: '24px',
      margin: '1px',
    },
  },
  deleteButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    color: '#d32f2f',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '32px',
    height: '32px',
    '&:hover': {
      backgroundColor: 'rgba(211, 47, 47, 0.1)',
      color: '#d32f2f',
    },
    [theme.breakpoints.down('sm')]: {
      top: '6px',
      right: '6px',
      width: '28px',
      height: '28px',
    },
  },
  addButton: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#6d5a42',
    },
    [theme.breakpoints.down('sm')]: {
      minWidth: 'auto',
      padding: '6px 12px',
      fontSize: '0.8rem',
    },
  },
  dialog: {
    '& .MuiDialog-paper': {
      backgroundColor: '#f5f1eb',
      borderRadius: '12px',
    },
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
  listItemContent: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: theme.spacing(1),
    },
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  statsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginTop: theme.spacing(0.5),
    },
  },
  mobileActions: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: theme.spacing(0.5),
    },
  },
}));

interface Friend {
  username: string;
  profileData?: SneakerDBUserProfile | null;
  loading?: boolean;
  error?: string;
}

export const FriendsLeague: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [friends, setFriends] = useState<Friend[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Load friends from localStorage on component mount
  useEffect(() => {
    const savedFriends = localStorage.getItem('friends-league');
    if (savedFriends) {
      try {
        const parsedFriends = JSON.parse(savedFriends);
        setFriends(parsedFriends);
        // Refresh data for existing friends
        refreshAllFriends(parsedFriends);
      } catch (error) {
        console.error('Error parsing saved friends:', error);
      }
    }
  }, []);

  // Save friends to localStorage
  const saveFriends = (friendsList: Friend[]) => {
    localStorage.setItem('friends-league', JSON.stringify(friendsList));
  };

  // Fetch profile data for a username
  const fetchUserProfile = async (username: string): Promise<SneakerDBUserProfile | null> => {
    console.log(`👥 Fetching profile for friend: ${username}`);
    
    try {
      const data = await fetchSneakerDBProfile(username);
      console.log(`✅ Profile data loaded for ${username}:`, {
        totalPoints: data.user?.totalPoints,
        activitiesCount: data.activities?.length
      });
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching profile for ${username}:`, error);
      throw error;
    }
  };

  // Add a new friend
  const addFriend = async () => {
    if (!newUsername.trim()) return;

    const username = newUsername.trim();
    
    // Check if friend already exists
    if (friends.find(f => f.username.toLowerCase() === username.toLowerCase())) {
      alert('This friend is already in your league!');
      return;
    }

    setLoading(true);
    const newFriend: Friend = { username, loading: true };
    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);

    try {
      const profileData = await fetchUserProfile(username);
      const friendWithData: Friend = {
        username,
        profileData,
        loading: false
      };
      
      const finalFriends = friends.map(f => 
        f.username === username ? friendWithData : f
      ).concat(friends.find(f => f.username === username) ? [] : [friendWithData]);
      
      setFriends(finalFriends);
      saveFriends(finalFriends);
      setNewUsername('');
      setDialogOpen(false);
    } catch (error) {
      const friendWithError: Friend = {
        username,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile'
      };
      
      const updatedFriendsWithError = friends.map(f => 
        f.username === username ? friendWithError : f
      ).concat(friends.find(f => f.username === username) ? [] : [friendWithError]);
      
      setFriends(updatedFriendsWithError);
      saveFriends(updatedFriendsWithError);
    } finally {
      setLoading(false);
    }
  };

  // Remove a friend
  const removeFriend = (username: string) => {
    const updatedFriends = friends.filter(f => f.username !== username);
    setFriends(updatedFriends);
    saveFriends(updatedFriends);
  };

  // Refresh all friends data
  const refreshAllFriends = async (friendsList?: Friend[]) => {
    const currentFriends = friendsList || friends;
    if (currentFriends.length === 0) return;

    console.log('🔄 Refreshing all friends data...');
    
    // Set all friends to loading state
    const loadingFriends = currentFriends.map(f => ({ ...f, loading: true }));
    setFriends(loadingFriends);

    // Fetch data for each friend
    const updatedFriends = await Promise.all(
      currentFriends.map(async (friend) => {
        try {
          const profileData = await fetchUserProfile(friend.username);
          return {
            username: friend.username,
            profileData,
            loading: false
          };
        } catch (error) {
          return {
            username: friend.username,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load profile'
          };
        }
      })
    );

    setFriends(updatedFriends);
    saveFriends(updatedFriends);
  };

  // Get leaderboard sorted by total points
  const getLeaderboard = () => {
    return friends
      .filter(f => f.profileData && !f.error)
      .sort((a, b) => {
        const pointsA = a.profileData?.user?.totalPoints || 0;
        const pointsB = b.profileData?.user?.totalPoints || 0;
        return pointsB - pointsA;
      });
  };

  const getRankBadgeClass = (position: number) => {
    if (position === 0) return `${classes.rankBadge} ${classes.goldBadge}`;
    if (position === 1) return `${classes.rankBadge} ${classes.silverBadge}`;
    if (position === 2) return `${classes.rankBadge} ${classes.bronzeBadge}`;
    return classes.rankBadge;
  };

  const leaderboard = getLeaderboard();

  return (
    <>
      <Card className={classes.card}>
        <Box className={classes.header}>
          <Box display="flex" alignItems="center" style={{ flex: 1 }}>
            <TrophyIcon style={{ marginRight: 8 }} />
            <Typography variant="h6" style={{ fontWeight: 'bold' }}>
              Friends League ({friends.length})
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <IconButton
              onClick={() => refreshAllFriends()}
              disabled={loading}
              style={{ color: '#ffffff', marginRight: 8 }}
              size="small"
            >
              <RefreshIcon />
            </IconButton>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              className={classes.addButton}
              size="small"
            >
              {isMobile ? 'Add' : 'Add Friend'}
            </Button>
          </Box>
        </Box>

        <CardContent>
          {friends.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PersonIcon style={{ fontSize: 48, color: '#d4c4a8', marginBottom: 16 }} />
              <Typography variant="h6" style={{ color: '#8b7355', marginBottom: 8 }}>
                No friends in your league yet
              </Typography>
              <Typography variant="body2" style={{ color: '#8b7355', marginBottom: 16 }}>
                Add your friends' usernames to see who's leading!
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                className={classes.addButton}
              >
                Add Your First Friend
              </Button>
            </Box>
          ) : (
            <>
              {/* Unified Friends Leaderboard */}
              <Typography variant="subtitle1" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏆 Friends League
                <Chip 
                  label={`${leaderboard.length} friends`} 
                  size="small" 
                  style={{ backgroundColor: 'rgba(139, 115, 85, 0.1)', color: '#8b7355', fontSize: '0.7rem' }}
                />
              </Typography>
              
              {leaderboard.map((friend, index) => (
                <Box key={friend.username} className={classes.leaderboardItem} p={2} style={{ position: 'relative' }}>
                  {/* Delete button - top right corner */}
                  <IconButton
                    onClick={() => removeFriend(friend.username)}
                    className={classes.deleteButton}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>

                  <Box className={classes.listItemContent}>
                    <Box className={classes.userInfo}>
                      <Box className={getRankBadgeClass(index)}>
                        {index + 1}
                      </Box>
                      
                      {friend.loading ? (
                        <Box display="flex" alignItems="center" mr={2}>
                          <CircularProgress size={32} style={{ color: '#8b7355' }} />
                        </Box>
                      ) : friend.error ? (
                        <Box display="flex" alignItems="center" mr={2} style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          justifyContent: 'center'
                        }}>
                          <Box style={{ color: '#d32f2f', fontSize: '20px' }}>⚠️</Box>
                        </Box>
                      ) : (
                        <Avatar
                          src={friend.profileData?.user?.profilePhotoUrl}
                          className={classes.avatar}
                        >
                          {friend.profileData?.user?.firstName?.charAt(0) || friend.username.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                      
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                          {friend.loading ? 'Loading...' :
                           friend.error ? friend.username :
                           `${friend.profileData?.user?.firstName} ${friend.profileData?.user?.lastName}`}
                        </Typography>
                        <Typography variant="body2" style={{ color: friend.error ? '#d32f2f' : '#8b7355' }}>
                          {friend.loading ? 'Fetching profile...' :
                           friend.error ? `Error: ${friend.error}` :
                           `@${friend.username}`}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {!friend.loading && !friend.error && (
                      <Box className={classes.statsContainer} style={{ paddingRight: '40px' }}>
                        <Chip
                          label={`${friend.profileData?.user?.totalPoints || 0} pts`}
                          className={classes.statChip}
                          size="small"
                          icon={<TrophyIcon style={{ fontSize: '14px' }} />}
                        />
                        <Chip
                          label={`${friend.profileData?.activities?.length || 0} activities`}
                          className={classes.statChip}
                          size="small"
                        />
                        <Chip
                          label={`${friend.profileData?.completedModules?.length || 0} modules`}
                          className={classes.statChip}
                          size="small"
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Friend Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className={classes.dialog}
      >
        <DialogTitle style={{ backgroundColor: '#8b7355', color: '#ffffff' }}>
          Add Friend to League
        </DialogTitle>
        <DialogContent style={{ paddingTop: 16 }}>
          <Typography variant="body2" style={{ color: '#8b7355', marginBottom: 16 }}>
            Enter your friend's ISRU Camp username:
          </Typography>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className={classes.textField}
            onKeyPress={(e) => e.key === 'Enter' && addFriend()}
            placeholder="e.g. cokisnake"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} style={{ color: '#8b7355' }}>
            Cancel
          </Button>
          <Button
            onClick={addFriend}
            disabled={!newUsername.trim() || loading}
            className={classes.addButton}
          >
            {loading ? <CircularProgress size={20} style={{ color: '#ffffff' }} /> : 'Add Friend'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
