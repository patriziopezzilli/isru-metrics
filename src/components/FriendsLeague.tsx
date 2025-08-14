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
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
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
  },
  header: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    padding: '16px 24px',
    borderRadius: '16px 16px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaderboardItem: {
    backgroundColor: '#f9f8f6',
    marginBottom: '8px',
    borderRadius: '12px',
    border: '1px solid #e6ddd4',
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
  },
  statChip: {
    backgroundColor: '#d4c4a8',
    color: '#8b7355',
    fontWeight: 'bold',
    margin: '2px',
  },
  addButton: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#6d5a42',
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
}));

interface Friend {
  username: string;
  profileData?: SneakerDBUserProfile | null;
  loading?: boolean;
  error?: string;
}

export const FriendsLeague: React.FC = () => {
  const classes = useStyles();
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
          <Box display="flex" alignItems="center">
            <TrophyIcon style={{ marginRight: 8 }} />
            <Typography variant="h6" style={{ fontWeight: 'bold' }}>
              Friends League ({friends.length})
            </Typography>
          </Box>
          <Box>
            <IconButton
              onClick={() => refreshAllFriends()}
              disabled={loading}
              style={{ color: '#ffffff', marginRight: 8 }}
            >
              <RefreshIcon />
            </IconButton>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              className={classes.addButton}
              size="small"
            >
              Add Friend
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
              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 16 }}>
                    🏆 Leaderboard
                  </Typography>
                  {leaderboard.map((friend, index) => (
                    <Box key={friend.username} className={classes.leaderboardItem} p={2}>
                      <Box display="flex" alignItems="center">
                        <Box className={getRankBadgeClass(index)}>
                          {index + 1}
                        </Box>
                        <Avatar
                          src={friend.profileData?.user?.profilePhotoUrl}
                          className={classes.avatar}
                        >
                          {friend.profileData?.user?.firstName?.charAt(0) || friend.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="body1" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                            {friend.profileData?.user?.firstName} {friend.profileData?.user?.lastName}
                          </Typography>
                          <Typography variant="body2" style={{ color: '#8b7355' }}>
                            @{friend.username}
                          </Typography>
                          <Box mt={1}>
                            <Chip
                              label={`${friend.profileData?.user?.totalPoints || 0} points`}
                              className={classes.statChip}
                              size="small"
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
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider style={{ backgroundColor: '#d4c4a8', margin: '16px 0' }} />

              {/* All friends list */}
              <Typography variant="subtitle1" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 16 }}>
                👥 All Friends
              </Typography>
              <List>
                {friends.map((friend) => (
                  <ListItem key={friend.username} divider>
                    <Box display="flex" alignItems="center" mr={2}>
                      {friend.loading ? (
                        <CircularProgress size={24} style={{ color: '#8b7355' }} />
                      ) : friend.error ? (
                        <Box style={{ color: '#d32f2f', fontSize: '20px' }}>⚠️</Box>
                      ) : (
                        <Avatar
                          src={friend.profileData?.user?.profilePhotoUrl}
                          style={{ width: 32, height: 32, backgroundColor: '#8b7355' }}
                        >
                          {friend.profileData?.user?.firstName?.charAt(0) || friend.username.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                    </Box>
                    <ListItemText
                      primary={
                        friend.profileData 
                          ? `${friend.profileData.user?.firstName} ${friend.profileData.user?.lastName}`
                          : friend.username
                      }
                      secondary={
                        friend.loading ? 'Loading...' :
                        friend.error ? `Error: ${friend.error}` :
                        `@${friend.username} • ${friend.profileData?.user?.totalPoints || 0} points`
                      }
                      primaryTypographyProps={{ style: { color: '#8b7355', fontWeight: 'bold' } }}
                      secondaryTypographyProps={{ style: { color: friend.error ? '#d32f2f' : '#8b7355' } }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => removeFriend(friend.username)}
                        style={{ color: '#d32f2f' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
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
