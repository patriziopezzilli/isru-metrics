import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  InputAdornment,
  Divider,
  CircularProgress,
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Snackbar
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import ShareIcon from '@material-ui/icons/Share';
import GetAppIcon from '@material-ui/icons/GetApp';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { ScoreDistributionResponse, SneakerDBUserProfile } from '../types';
import { searchUsers, fetchSneakerDBProfile, calculateUserRanking } from '../apiService';
import ProfileExportService from '../services/profileExportService';

interface UserSearchProps {
  scoreDistribution: ScoreDistributionResponse;
}

interface SearchedUser {
  username: string;
  loading: boolean;
  profile?: SneakerDBUserProfile;
  ranking?: any;
  error?: string;
}

const UserSearch = ({ scoreDistribution }: UserSearchProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Search in local data
  const localSearchResults = useMemo(() => {
    return searchUsers(searchQuery, scoreDistribution);
  }, [searchQuery, scoreDistribution]);

  // Notification handlers
  const showNotification = (message: string, severity: 'success' | 'error' = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Export handlers
  const handleExportProfile = async (username: string) => {
    try {
      const elementId = `profile-card-${username}`;
      await ProfileExportService.exportProfileAsImage(elementId, username);
      showNotification(`✅ Profile exported successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('❌ Export failed. Please try again.', 'error');
    }
  };

  const handleShareProfile = async (username: string) => {
    try {
      const elementId = `profile-card-${username}`;
      const profile = searchedUsers.find(u => u.username === username)?.profile;
      const fullName = profile?.user ? `${profile.user.firstName} ${profile.user.lastName}` : username;
      
      await ProfileExportService.shareProfile(elementId, username, `${fullName}'s I.S.R.U League Profile`);
      showNotification(`✅ Profile shared successfully!`);
    } catch (error) {
      console.error('Share failed:', error);
      showNotification('❌ Share failed. Profile exported instead.', 'error');
    }
  };

  const handleCopyProfile = async (username: string) => {
    try {
      const elementId = `profile-card-${username}`;
      await ProfileExportService.copyProfileToClipboard(elementId);
      showNotification(`✅ Profile copied to clipboard!`);
    } catch (error) {
      console.error('Copy failed:', error);
      showNotification('❌ Copy failed. This feature may not be supported.', 'error');
    }
  };

  // Function to search for a specific user via API
  const searchUserProfile = async (username: string) => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;
    
    // Check if user is already searched
    if (searchedUsers.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      return;
    }

    const newUser: SearchedUser = {
      username: trimmedUsername,
      loading: true
    };

    setSearchedUsers(prev => [...prev, newUser]);

    try {
      console.log(`🔍 Searching profile for: ${trimmedUsername}`);
      const profile = await fetchSneakerDBProfile(trimmedUsername.toLowerCase());
      
      if (profile && profile.user) {
        const ranking = calculateUserRanking(profile.user.totalPoints, scoreDistribution);
        
        setSearchedUsers(prev => prev.map(user => 
          user.username.toLowerCase() === trimmedUsername.toLowerCase() 
            ? { ...user, loading: false, profile, ranking }
            : user
        ));
        
        console.log(`✅ Profile found for ${trimmedUsername}:`, {
          totalPoints: profile.user.totalPoints,
          position: ranking.position,
          percentageAbove: ranking.percentageAbove
        });
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error(`❌ Error searching user ${trimmedUsername}:`, error);
      setSearchedUsers(prev => prev.map(user => 
        user.username.toLowerCase() === trimmedUsername.toLowerCase() 
          ? { ...user, loading: false, error: error instanceof Error ? error.message : 'User not found' }
          : user
      ));
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      searchUserProfile(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const clearSearchResults = () => {
    setSearchedUsers([]);
  };

  return (
    <Box>
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
              <SearchIcon style={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" component="h2" style={{ fontWeight: 600, color: '#3c3530' }}>
              User Search
            </Typography>
          </Box>
          
          <form onSubmit={handleSearchSubmit}>
            <Box
              display="flex"
              alignItems="center"
              flexDirection={isMobile ? "column" : "row"}
              style={{
                gap: isMobile ? 12 : 16,
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder={isMobile ? "Enter username..." : "Enter username to search (e.g., cokisnake)..."}
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  maxWidth: '100%'
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon style={{ color: '#6b5d52' }} />
                    </InputAdornment>
                  ),
                  style: {
                    borderRadius: 12,
                    backgroundColor: '#f5f1eb',
                    border: '1px solid #e6ddd4',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    width: '100%',
                    maxWidth: '100%'
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!searchQuery.trim()}
                fullWidth={isMobile}
                style={{
                  backgroundColor: '#8b7355',
                  color: 'white',
                  borderRadius: 12,
                  padding: isMobile ? '12px 16px' : '12px 24px',
                  fontWeight: 600,
                  textTransform: 'none',
                  minWidth: isMobile ? 'auto' : '120px'
                }}
              >
                {isMobile ? 'Search' : 'Search'}
              </Button>
            </Box>
          </form>

          {localSearchResults.length > 0 && searchQuery && (
            <Box mt={3}>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16, fontWeight: 500 }}>
                Quick results from leaderboard for "{searchQuery}":
              </Typography>
              <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
                {localSearchResults.slice(0, 5).map((user: any) => (
                  <Chip
                    key={user.id}
                    label={`${user.firstName} ${user.lastName} (@${user.username})`}
                    onClick={() => searchUserProfile(user.username)}
                    clickable
                    size="small"
                    style={{
                      backgroundColor: '#f5f1eb',
                      color: '#6b5d52',
                      border: '1px solid #e6ddd4',
                      borderRadius: 8,
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {searchedUsers.length > 0 && (
            <Box mt={3} display="flex" alignItems="center" style={{ gap: 8 }}>
              <Button
                onClick={clearSearchResults}
                size="small"
                style={{
                  color: '#8b7355',
                  textTransform: 'none',
                }}
              >
                Clear Results
              </Button>
              <Typography variant="body2" color="textSecondary">
                {searchedUsers.length} user(s) searched
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {searchedUsers.length > 0 && (
        <Card 
          elevation={0}
          style={{
            background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
            border: '1px solid #e6ddd4',
          }}
        >
          <CardContent style={{ padding: 32 }}>
            <Typography variant="h6" gutterBottom style={{ fontWeight: 600, color: '#3c3530', marginBottom: 24 }}>
              User Profiles & Rankings
            </Typography>
            <List style={{ padding: 0 }}>
              {searchedUsers.map((searchedUser, index) => (
                <React.Fragment key={searchedUser.username}>
                  <ListItem 
                    id={`profile-card-${searchedUser.username}`}
                    style={{ 
                      padding: '20px 24px', 
                      borderRadius: 12,
                      position: 'relative',
                      background: 'linear-gradient(135deg, #fefdfb 0%, #f8f6f1 100%)',
                      margin: '8px 0',
                      border: '1px solid #e6ddd4',
                    }}
                  >
                    <ListItemAvatar>
                      {searchedUser.loading ? (
                        <CircularProgress size={48} style={{ color: '#8b7355' }} />
                      ) : (
                        <Avatar 
                          src={searchedUser.profile?.user?.profilePhotoUrl}
                          style={{ 
                            backgroundColor: '#8b7355',
                            width: 48,
                            height: 48,
                            border: '2px solid #e6ddd4',
                          }}
                        >
                          {searchedUser.profile?.user?.firstName?.charAt(0) || searchedUser.username.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box 
                          display="flex" 
                          alignItems={isMobile ? "flex-start" : "center"} 
                          flexDirection={isMobile ? "column" : "row"}
                          style={{ gap: isMobile ? 4 : 12, marginBottom: 8 }}
                        >
                          <Typography 
                            variant="h6" 
                            style={{ 
                              fontWeight: 600, 
                              color: '#3c3530',
                              fontSize: isMobile ? '1rem' : '1.25rem',
                              lineHeight: 1.2
                            }}
                          >
                            {searchedUser.loading ? 'Loading...' : 
                             searchedUser.error ? `@${searchedUser.username}` :
                             `${searchedUser.profile?.user?.firstName} ${searchedUser.profile?.user?.lastName}`}
                          </Typography>
                          <Chip 
                            label={`@${searchedUser.username}`} 
                            size="small" 
                            style={{
                              backgroundColor: '#f5f1eb',
                              color: '#6b5d52',
                              border: '1px solid #e6ddd4',
                              borderRadius: 8,
                              fontWeight: 500,
                              fontSize: isMobile ? '0.7rem' : '0.75rem'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {searchedUser.loading && (
                            <Typography variant="body2" color="textSecondary">
                              Fetching profile data...
                            </Typography>
                          )}
                          
                          {searchedUser.error && (
                            <Typography variant="body2" style={{ color: '#d32f2f' }}>
                              {searchedUser.error}
                            </Typography>
                          )}
                          
                          {searchedUser.profile && searchedUser.ranking && (
                            <Box>
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                flexWrap="wrap"
                                style={{ gap: isMobile ? 4 : 12, marginBottom: 8 }}
                              >
                                <Chip 
                                  label={`${searchedUser.profile.user?.totalPoints || 0} points`} 
                                  size="small"
                                  style={{
                                    backgroundColor: '#8b7355',
                                    color: 'white',
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                                  }}
                                />
                                <Chip 
                                  label={`Position: #${searchedUser.ranking.position?.toLocaleString() || 'N/A'}`} 
                                  size="small"
                                  icon={<TrendingUpIcon style={{ fontSize: isMobile ? 14 : 16 }} />}
                                  style={{
                                    backgroundColor: '#a0916c',
                                    color: 'white',
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                                  }}
                                />
                                <Chip 
                                  label={`Top ${searchedUser.ranking.percentageAbove || 0}%`} 
                                  size="small"
                                  style={{
                                    backgroundColor: '#6b7d5a',
                                    color: 'white',
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                                  }}
                                />
                              </Box>
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                flexWrap="wrap"
                                style={{ gap: isMobile ? 4 : 12 }}
                              >
                                <Chip 
                                  label={`${searchedUser.profile.activities?.length || 0} activities`} 
                                  size="small"
                                  style={{
                                    backgroundColor: '#d4c4a8',
                                    color: '#8b7355',
                                    fontWeight: 500,
                                    borderRadius: 8,
                                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                                  }}
                                />
                                <Chip 
                                  label={`${searchedUser.profile.completedModules?.length || 0} modules`} 
                                  size="small"
                                  style={{
                                    backgroundColor: '#d4c4a8',
                                    color: '#8b7355',
                                    fontWeight: 500,
                                    borderRadius: 8,
                                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                                  }}
                                />
                                {!isMobile && (
                                  <Typography variant="body2" color="textSecondary" style={{ fontSize: '0.75rem' }}>
                                    {(searchedUser.ranking.usersAbove || 0).toLocaleString()} users above • {(searchedUser.ranking.totalUsers || 0).toLocaleString()} total
                                  </Typography>
                                )}
                              </Box>
                              {isMobile && (
                                <Typography 
                                  variant="body2" 
                                  color="textSecondary" 
                                  style={{ 
                                    fontSize: '0.7rem', 
                                    marginTop: 4,
                                    textAlign: 'left'
                                  }}
                                >
                                  {(searchedUser.ranking.usersAbove || 0).toLocaleString()} users above • {(searchedUser.ranking.totalUsers || 0).toLocaleString()} total
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {/* Export Controls - Centrati in basso */}
                  {searchedUser.profile && !searchedUser.loading && !searchedUser.error && (
                    <Box 
                      display="flex" 
                      justifyContent="center"
                      alignItems="center"
                      style={{ 
                        gap: 8,
                        marginTop: 12,
                        marginBottom: 8,
                        paddingLeft: 16,
                        paddingRight: 16,
                      }}
                    >
                      <Tooltip title="Share Profile">
                        <IconButton
                          onClick={() => handleShareProfile(searchedUser.username)}
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
                          onClick={() => handleExportProfile(searchedUser.username)}
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
                          onClick={() => handleCopyProfile(searchedUser.username)}
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
                  {index < searchedUsers.length - 1 && <Divider style={{ margin: '0 16px', backgroundColor: '#e6ddd4' }} />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

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
    </Box>
  );
};

export default UserSearch;
