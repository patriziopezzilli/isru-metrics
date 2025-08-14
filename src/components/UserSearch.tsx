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
  Paper,
  Divider
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import { ScoreDistributionResponse } from '../types';
import { searchUsers } from '../apiService';

interface UserSearchProps {
  scoreDistribution: ScoreDistributionResponse;
}

const UserSearch = ({ scoreDistribution }: UserSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    return searchUsers(searchQuery, scoreDistribution);
  }, [searchQuery, scoreDistribution]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
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
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by username or name..."
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
              }
            }}
            style={{ marginBottom: 24 }}
          />

          {searchQuery && (
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16, fontWeight: 500 }}>
              {searchResults.length} results found for "{searchQuery}"
            </Typography>
          )}
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card 
          elevation={0}
          style={{
            background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
            border: '1px solid #e6ddd4',
          }}
        >
          <CardContent style={{ padding: 32 }}>
            <Typography variant="h6" gutterBottom style={{ fontWeight: 600, color: '#3c3530', marginBottom: 24 }}>
              Search Results
            </Typography>
            <List style={{ padding: 0 }}>
              {searchResults.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem style={{ padding: '16px 0', borderRadius: 12 }}>
                    <ListItemAvatar>
                      <Avatar 
                        style={{ 
                          backgroundColor: '#8b7355',
                          width: 48,
                          height: 48,
                          border: '2px solid #e6ddd4',
                        }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" style={{ gap: 12, marginBottom: 8 }}>
                          <Typography variant="h6" style={{ fontWeight: 600, color: '#3c3530' }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Chip 
                            label={`@${user.username}`} 
                            size="small" 
                            style={{
                              backgroundColor: '#f5f1eb',
                              color: '#6b5d52',
                              border: '1px solid #e6ddd4',
                              borderRadius: 8,
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                          <Chip 
                            label={`Score: ${user.score}`} 
                            size="small"
                            style={{
                              backgroundColor: '#8b7355',
                              color: 'white',
                              fontWeight: 600,
                              borderRadius: 8,
                            }}
                          />
                          <Chip 
                            label={`Position: ~${user.position}`} 
                            size="small"
                            style={{
                              backgroundColor: '#a0916c',
                              color: 'white',
                              fontWeight: 600,
                              borderRadius: 8,
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider style={{ margin: '0 16px', backgroundColor: '#e6ddd4' }} />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {searchQuery && searchResults.length === 0 && (
        <Paper 
          elevation={0} 
          style={{ 
            padding: 48, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
          }}
        >
          <Box 
            style={{ 
              backgroundColor: '#f1f5f9', 
              borderRadius: 20, 
              padding: 16, 
              display: 'inline-flex',
              marginBottom: 16,
            }}
          >
            <SearchIcon style={{ fontSize: 32, color: '#64748b' }} />
          </Box>
          <Typography variant="h6" color="textSecondary" gutterBottom style={{ fontWeight: 600, color: '#64748b' }}>
            No users found
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ fontWeight: 500 }}>
            Try searching with a different username or name
          </Typography>
        </Paper>
      )}

      {!searchQuery && (
        <Paper 
          elevation={0} 
          style={{ 
            padding: 48, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
          }}
        >
          <Box 
            style={{ 
              backgroundColor: '#f1f5f9', 
              borderRadius: 20, 
              padding: 16, 
              display: 'inline-flex',
              marginBottom: 16,
            }}
          >
            <SearchIcon style={{ fontSize: 32, color: '#64748b' }} />
          </Box>
          <Typography variant="h6" color="textSecondary" gutterBottom style={{ fontWeight: 600, color: '#64748b' }}>
            Search for Users
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ fontWeight: 500 }}>
            Enter a username or name to search through the ISRU leaderboard
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default UserSearch;
