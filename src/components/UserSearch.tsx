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
  useTheme
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import { ScoreDistributionResponse, SneakerDBUserProfile } from '../types';
import { searchUsers, fetchSneakerDBProfile, calculateUserRanking } from '../apiService';

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

  // Search in local data
  const localSearchResults = useMemo(() => {
    return searchUsers(searchQuery, scoreDistribution);
  }, [searchQuery, scoreDistribution]);

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
      const profile = await fetchSneakerDBProfile(trimmedUsername);
      
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
              style={{ gap: isMobile ? 12 : 16 }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder={isMobile ? "Enter username..." : "Enter username to search (e.g., cokisnake)..."}
                value={searchQuery}
                onChange={handleSearchChange}
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
                    fontSize: isMobile ? '0.9rem' : '1rem'
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
                  <ListItem style={{ padding: '16px 0', borderRadius: 12 }}>
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
                  {index < searchedUsers.length - 1 && <Divider style={{ margin: '0 16px', backgroundColor: '#e6ddd4' }} />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UserSearch;
