import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  Chip,
  IconButton,
  Button,
  Snackbar,
  InputAdornment,
  Tooltip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Share as ShareIcon,
  Clear as ClearIcon,
  People as PeopleIcon,
  Close as CloseIcon,
} from '@material-ui/icons';
import { fetchSneakerDBProfile } from '../apiService';
import { SneakerDBUserProfile } from '../types';
import ProfileExportService from '../services/profileExportService';
import { LeagueImageExporter, LeagueExportData } from '../utils/leagueImageExporter';

// Custom Alert component for Material-UI v4 compatibility
interface AlertProps {
  severity: 'success' | 'info' | 'warning' | 'error';
  children: React.ReactNode;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ severity, children, onClose }) => {
  const colors = {
    success: '#4caf50',
    info: '#2196f3',
    warning: '#ff9800',
    error: '#f44336'
  };

  const alertStyle: React.CSSProperties = {
    backgroundColor: colors[severity],
    color: 'white',
    padding: '12px 16px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    minWidth: '200px'
  };

  return (
    <div style={alertStyle}>
      {children}
      {onClose && (
        <IconButton size="small" style={{ color: 'white', marginLeft: '8px' }} onClick={onClose}>
          <ClearIcon fontSize="small" />
        </IconButton>
      )}
    </div>
  );
};

// Styles inspired by Score Distribution
const useStyles = makeStyles((theme) => ({
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '100%': { opacity: 0.4 },
  },
  container: {
    background: 'linear-gradient(135deg, #fefdfb 0%, #f5f1eb 100%)',
    borderRadius: '16px',
    border: '1px solid #e6ddd4',
    marginBottom: '32px',
    [theme.breakpoints.down('sm')]: {
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
      padding: '16px 20px 12px 20px',
    },
  },
  title: {
    color: '#8b7355',
    fontWeight: 600,
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  titleIcon: {
    backgroundColor: '#8b7355',
    borderRadius: '12px',
    padding: '8px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  controls: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  content: {
    padding: '32px',
    [theme.breakpoints.down('sm')]: {
      padding: '20px',
    },
  },
  searchContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchField: {
    backgroundColor: 'white',
    borderRadius: '12px',
    minWidth: '200px',
    flex: 1,
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#e6ddd4',
      },
      '&:hover fieldset': {
        borderColor: '#8b7355',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#8b7355',
        boxShadow: '0 0 0 3px rgba(139, 115, 85, 0.1)',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#8b7355',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#8b7355',
    },
  },
  filterSelect: {
    minWidth: '140px',
    backgroundColor: 'white',
    borderRadius: '12px',
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#e6ddd4',
      },
      '&:hover fieldset': {
        borderColor: '#8b7355',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#8b7355',
        boxShadow: '0 0 0 3px rgba(139, 115, 85, 0.1)',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#8b7355',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#8b7355',
    },
    '& .MuiSelect-icon': {
      color: '#8b7355',
    },
  },
  friendsList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  friendCard: {
    backgroundColor: '#f5f1eb',
    border: '1px solid #e6ddd4',
    borderRadius: '16px',
    transition: 'all 0.2s ease',
    position: 'relative',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f0ebe0',
      borderColor: '#d1c7b8',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(139, 115, 85, 0.15)',
    },
  },
  friendCardContent: {
    padding: '16px !important',
  },
  friendHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  friendAvatar: {
    width: 44,
    height: 44,
    backgroundColor: '#8b7355',
    color: 'white',
    fontWeight: 600,
    fontSize: '1.1rem',
  },
  avatarContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  friendInfo: {
    flex: 1,
    marginLeft: theme.spacing(1.5),
    minWidth: 0,
  },
  friendName: {
    fontWeight: 600,
    fontSize: '1.1rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#3c3530',
    marginBottom: '2px',
  },
  friendUsername: {
    fontSize: '0.9rem',
    color: '#8b7355',
    opacity: 0.8,
  },
  statChip: {
    fontSize: '0.75rem',
    height: '28px',
    backgroundColor: '#f5f1eb',
    color: '#8b7355',
    border: '1px solid #e6ddd4',
    fontWeight: 500,
  },
  pointsChip: {
    fontSize: '0.75rem',
    height: '28px',
    backgroundColor: '#8b7355',
    color: 'white',
    border: '1px solid #8b7355',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: '#7a6449',
    },
  },
  rankBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#8b7355',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    border: '2px solid white',
    zIndex: 999,
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  goldRank: {
    backgroundColor: '#FFD700',
    color: '#000',
  },
  silverRank: {
    backgroundColor: '#C0C0C0',
    color: '#000',
  },
  bronzeRank: {
    backgroundColor: '#CD7F32',
    color: '#fff',
  },
  loadingCard: {
    backgroundColor: 'white',
    border: '1px solid #e6ddd4',
    borderRadius: '16px',
    padding: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '140px',
    color: '#8b7355',
  },
  errorCard: {
    backgroundColor: '#f5f1eb',
    border: '2px solid #f44336',
    borderRadius: '16px',
    color: '#f44336',
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: '#8b7355',
    opacity: 0.7,
  },
  addButton: {
    backgroundColor: '#8b7355',
    color: 'white',
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '8px 16px',
    '&:hover': {
      backgroundColor: '#6d5940',
      boxShadow: '0 4px 12px rgba(139, 115, 85, 0.3)',
    },
  },
  refreshButton: {
    color: '#8b7355',
    border: '1px solid #e6ddd4',
    borderRadius: '12px',
    padding: '8px 12px',
    '&:hover': {
      backgroundColor: 'rgba(139, 115, 85, 0.04)',
      borderColor: '#8b7355',
    },
  },
  shareButton: {
    backgroundColor: '#a0916c',
    color: 'white',
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '8px 16px',
    '&:hover': {
      backgroundColor: '#8b7d5a',
      boxShadow: '0 4px 12px rgba(160, 145, 108, 0.3)',
    },
  },
  highlight: {
    backgroundColor: '#fff3cd',
    color: '#8b7355',
    fontWeight: 600,
    padding: '2px 4px',
    borderRadius: '4px',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    display: 'inline-block',
    marginRight: theme.spacing(0.5),
    boxShadow: '0 0 4px rgba(76, 175, 80, 0.5)',
  },
  countChip: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    color: '#8b7355',
    fontWeight: 600,
    fontSize: '0.7rem',
  },
  skeletonCard: {
    backgroundColor: '#f5f1eb',
    border: '1px solid #e6ddd4',
    borderRadius: '16px',
    position: 'relative',
  },
  profileModal: {
    backgroundColor: '#f5f1eb',
    borderRadius: '12px',
  },
}));

// Profile cache for intelligent caching
const profileCache = new Map<string, { data: SneakerDBUserProfile | null; timestamp: number; error?: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Main component
export const FriendsLeague: React.FC = () => {
  const classes = useStyles();
  
  // State management with migration from old format
  const [friends, setFriends] = useState<string[]>(() => {
    console.log('🚀 Inizializzando Friends League...');
    
    // Check the friends-league key
    const saved = localStorage.getItem('friends-league');
    console.log('📦 Dati friends-league:', saved);
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        console.log('🔄 Dati parsati:', data);
        
        // Check if it's already in new format (array of strings)
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
          console.log('✅ Formato già aggiornato, trovati', data.length, 'amici:', data);
          return data;
        }
        
        // If it's in old format [{username: "...", profileData: {...}}], migrate it
        if (Array.isArray(data) && data.length > 0 && data[0].username) {
          const migratedFriends = data.map((item: any) => item.username);
          console.log('✅ Migrazione completata! Amici migrati:', migratedFriends);
          // Save in new format using the same key
          localStorage.setItem('friends-league', JSON.stringify(migratedFriends));
          return migratedFriends;
        } else {
          console.log('❌ Formato non riconosciuto:', data);
        }
      } catch (error) {
        console.error('❌ Errore durante migrazione:', error);
      }
    }
    
    console.log('📭 Nessun dato trovato, inizializzando array vuoto');
    return [];
  });
  
  const [profiles, setProfiles] = useState<Map<string, SneakerDBUserProfile | null>>(() => {
    // Try to restore profiles from old data
    const oldSaved = localStorage.getItem('friends-league');
    if (oldSaved) {
      try {
        const oldData = JSON.parse(oldSaved);
        if (Array.isArray(oldData) && oldData.length > 0 && oldData[0].profileData) {
          const profilesMap = new Map<string, SneakerDBUserProfile | null>();
          oldData.forEach((item: any) => {
            if (item.username && item.profileData) {
              profilesMap.set(item.username, item.profileData);
            }
          });
          return profilesMap;
        }
      } catch (error) {
        console.error('Error migrating profile data:', error);
      }
    }
    return new Map();
  });
  
  const [loading, setLoading] = useState<Map<string, boolean>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  
  // Friend profile modal states
  const [friendProfileModalOpen, setFriendProfileModalOpen] = useState(false);
  const [selectedFriendUsername, setSelectedFriendUsername] = useState<string>('');
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<SneakerDBUserProfile | null>(null);
  const [friendProfileLoading, setFriendProfileLoading] = useState(false);
  const [friendProfileError, setFriendProfileError] = useState<string | null>(null);

  // Save friends to localStorage whenever friends change
  useEffect(() => {
    localStorage.setItem('friends-league', JSON.stringify(friends));
  }, [friends]);

  // Debug: Log current friends state
  useEffect(() => {
    console.log('🎯 Stato attuale amici:', friends);
    console.log('🎯 Numero amici:', friends.length);
  }, [friends]);

  // Show migration message if data was migrated (only once)
  useEffect(() => {
    const oldSaved = localStorage.getItem('friends-league');
    const migrationShown = localStorage.getItem('migration-notification-shown');
    
    if (oldSaved && friends.length > 0 && !migrationShown) {
      // Check if we have old data but new data exists (migration happened)
      try {
        const oldData = JSON.parse(oldSaved);
        // Only show if the data was actually migrated (old format with username property)
        if (Array.isArray(oldData) && oldData.length > 0 && oldData[0].username) {
          setTimeout(() => {
            setSnackbar({
              open: true,
              message: `Migrated ${friends.length} friends from old format!`,
              severity: 'success'
            });
            // Mark migration notification as shown
            localStorage.setItem('migration-notification-shown', 'true');
          }, 1000);
        }
      } catch (error) {
        console.log('Could not parse old data for migration notification');
      }
    }
  }, []); // Only run once on mount

  // Load friend profile with caching
  const loadFriendProfile = useCallback(async (username: string) => {
    // Check cache first
    const cached = profileCache.get(username);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.data) {
        setProfiles(prev => new Map(prev.set(username, cached.data!)));
      }
      if (cached.error) {
        setErrors(prev => new Map(prev.set(username, cached.error!)));
      }
      return;
    }

    setLoading(prev => new Map(prev.set(username, true)));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(username);
      return newErrors;
    });

    try {
      const profile = await fetchSneakerDBProfile(username);
      
      // Cache the result
      profileCache.set(username, { data: profile, timestamp: Date.now() });
      
      setProfiles(prev => new Map(prev.set(username, profile)));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load profile';
      
      // Cache the error
      profileCache.set(username, { data: null, timestamp: Date.now(), error: errorMessage });
      
      setErrors(prev => new Map(prev.set(username, errorMessage)));
    } finally {
      setLoading(prev => {
        const newLoading = new Map(prev);
        newLoading.delete(username);
        return newLoading;
      });
    }
  }, []);

  // Handle friend profile modal
  const handleOpenFriendProfile = useCallback(async (username: string) => {
    setSelectedFriendUsername(username);
    setFriendProfileModalOpen(true);
    setFriendProfileLoading(true);
    setFriendProfileError(null);
    setSelectedFriendProfile(null);

    try {
      const profile = await fetchSneakerDBProfile(username);
      setSelectedFriendProfile(profile);
    } catch (error: any) {
      setFriendProfileError(error.message || 'Failed to load friend profile');
    } finally {
      setFriendProfileLoading(false);
    }
  }, []);

  const handleCloseFriendProfile = useCallback(() => {
    setFriendProfileModalOpen(false);
    setSelectedFriendUsername('');
    setSelectedFriendProfile(null);
    setFriendProfileError(null);
  }, []);

  // Load all friends profiles on mount and when friends change
  useEffect(() => {
    friends.forEach(friend => {
      loadFriendProfile(friend);
    });
  }, [friends, loadFriendProfile]);

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Show snackbar helper
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Filter and search friends
  const filteredFriends = useMemo(() => {
    return friends
      .filter(friend => {
        const profile = profiles.get(friend);
        const displayName = profile?.user?.firstName && profile?.user?.lastName 
          ? `${profile.user.firstName} ${profile.user.lastName}` 
          : friend;
        const matchesSearch = friend.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                             displayName.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // Since we don't have online status in the API, show all users for now
        return true;
      })
      .sort((a, b) => {
        // Sort by points (highest first)
        const profileA = profiles.get(a);
        const profileB = profiles.get(b);
        const pointsA = profileA?.user?.totalPoints || 0;
        const pointsB = profileB?.user?.totalPoints || 0;
        return pointsB - pointsA; // Descending order
      });
  }, [friends, profiles, debouncedSearchTerm]);

  // Highlight search term in text
  const highlightText = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className={classes.highlight}>{part}</span> : part
    );
  }, [classes.highlight]);

  // Add friend
  const openAddFriendModal = () => {
    setAddFriendModalOpen(true);
    setNewFriendUsername('');
  };

  const closeAddFriendModal = () => {
    setAddFriendModalOpen(false);
    setNewFriendUsername('');
  };

  const addFriend = () => {
    const username = newFriendUsername.trim();
    if (username && !friends.includes(username)) {
      setFriends(prev => [...prev, username]);
      loadFriendProfile(username);
      showSnackbar(`Added ${username} to friends!`);
      closeAddFriendModal();
    } else if (username && friends.includes(username)) {
      showSnackbar(`${username} is already in your friends list`, 'error');
    } else {
      showSnackbar('Please enter a valid username', 'error');
    }
  };

  // Remove friend
  const removeFriend = (username: string) => {
    setFriends(prev => prev.filter(f => f !== username));
    setProfiles(prev => {
      const newProfiles = new Map(prev);
      newProfiles.delete(username);
      return newProfiles;
    });
    showSnackbar(`Removed ${username} from friends`);
  };

  // Refresh all profiles
  const refreshAllProfiles = async () => {
    setRefreshing(true);
    
    // Clear cache for all friends
    friends.forEach(friend => {
      profileCache.delete(friend);
    });
    
    // Reload all profiles
    await Promise.all(friends.map(friend => loadFriendProfile(friend)));
    
    setRefreshing(false);
    showSnackbar('All profiles refreshed!');
  };

  // Share friends data as custom styled image
  const shareFriendsData = async () => {
    try {
      // Prepara i dati per l'export
      const leaderboard = filteredFriends.map((friend, index) => {
        const profile = profiles.get(friend);
        return {
          username: friend,
          score: profile?.user?.totalPoints || 0,
          position: index + 1,
          profilePicture: profile?.user?.profilePhotoUrl
        };
      });

      const exportData: LeagueExportData = {
        leaderboard,
        timestamp: new Date().toISOString(),
        totalFriends: friends.length
      };

      // Genera l'immagine personalizzata
      const exporter = new LeagueImageExporter();
      const imageDataUrl = await exporter.generateLeagueImage(exportData);
      
      // Download dell'immagine
      const link = document.createElement('a');
      link.download = `isru-league-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imageDataUrl;
      link.click();
      
      showSnackbar('Friends League image generated!');
    } catch (error) {
      console.error('Share failed:', error);
      showSnackbar('Share failed. Please try again.');
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Card className={classes.skeletonCard}>
      <CardContent className={classes.friendCardContent}>
        <Box display="flex" alignItems="center" justifyContent="space-between" marginBottom={1}>
          {/* Avatar container with badge skeleton */}
          <Box style={{ position: 'relative', display: 'inline-block' }}>
            <Box 
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: '#e0e0e0',
                animation: 'pulse 1.5s ease-in-out infinite alternate'
              }}
            />
            {/* Badge skeleton */}
            <Box 
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#d0d0d0',
                border: '2px solid white',
                animation: 'pulse 1.5s ease-in-out infinite alternate'
              }}
            />
          </Box>
          
          {/* Info section skeleton */}
          <Box flex={1} marginLeft={1.5}>
            {/* Name + Points row */}
            <Box display="flex" alignItems="center" style={{ gap: '8px' }} marginBottom={0.5}>
              <Box 
                style={{
                  height: 16,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 4,
                  width: '45%',
                  animation: 'pulse 1.5s ease-in-out infinite alternate'
                }}
              />
              <Box 
                style={{
                  height: 24,
                  backgroundColor: '#d0d0d0',
                  borderRadius: 12,
                  width: '60px',
                  animation: 'pulse 1.5s ease-in-out infinite alternate'
                }}
              />
            </Box>
            {/* Username skeleton */}
            <Box 
              style={{
                height: 14,
                backgroundColor: '#e0e0e0',
                borderRadius: 4,
                width: '35%',
                marginBottom: 4,
                animation: 'pulse 1.5s ease-in-out infinite alternate'
              }}
            />
            {/* S/N skeleton */}
            <Box 
              style={{
                height: 12,
                backgroundColor: '#e0e0e0',
                borderRadius: 4,
                width: '30%',
                animation: 'pulse 1.5s ease-in-out infinite alternate'
              }}
            />
          </Box>
          
          {/* Remove button skeleton */}
          <Box 
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#e0e0e0',
              animation: 'pulse 1.5s ease-in-out infinite alternate'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card id="friends-league-container" className={classes.container} elevation={0}>
      {/* Header */}
      <Box className={classes.header}>
        <Box display="flex" alignItems="center">
          <Box className={classes.titleIcon}>
            <PeopleIcon style={{ fontSize: 24 }} />
          </Box>
          <Typography className={classes.title}>
            Friends League
            <Chip 
              label={`${friends.length} friends`} 
              size="small" 
              className={classes.countChip}
              style={{ marginLeft: 12 }}
            />
          </Typography>
        </Box>
          
          <Box className={classes.controls}>
            <Tooltip title="Add Friend">
              <Button
                className={classes.addButton}
                startIcon={<PersonAddIcon />}
                onClick={openAddFriendModal}
                size="small"
              >
                Add Friend
              </Button>
            </Tooltip>
            
            <Tooltip title="Refresh All">
              <IconButton
                className={classes.refreshButton}
                onClick={refreshAllProfiles}
                disabled={refreshing}
                size="small"
                style={{ marginLeft: '8px' }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Share Data">
              <IconButton
                className={classes.shareButton}
                onClick={shareFriendsData}
                size="small"
                style={{ 
                  backgroundColor: '#8b7355',
                  color: 'white',
                  marginLeft: '8px'
                }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        <Box className={classes.content}>
          {/* Search and Filter */}
          <Box className={classes.searchContainer}>
            <TextField
              className={classes.searchField}
              label="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon style={{ color: '#8b7355' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      style={{ color: '#8b7355' }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Friends List */}
          {friends.length === 0 ? (
            <Box className={classes.emptyState}>
              <PeopleIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No friends added yet
              </Typography>
              <Typography variant="body2">
                Click "Add Friend" to start building your league!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={0} className={classes.friendsList}>
              {filteredFriends.map((friend, index) => {
                const profile = profiles.get(friend);
                const isLoading = loading.get(friend);
                const error = errors.get(friend);
                const position = index + 1;

                // Helper function to get rank badge style
                const getRankBadgeClass = (pos: number) => {
                  if (pos === 1) return `${classes.rankBadge} ${classes.goldRank}`;
                  if (pos === 2) return `${classes.rankBadge} ${classes.silverRank}`;
                  if (pos === 3) return `${classes.rankBadge} ${classes.bronzeRank}`;
                  return classes.rankBadge;
                };

                const getRankText = (pos: number) => {
                  if (pos === 1) return '🥇';
                  if (pos === 2) return '🥈';
                  if (pos === 3) return '🥉';
                  return pos.toString();
                };

                if (isLoading) {
                  return (
                    <Grid item xs={12} key={friend}>
                      <LoadingSkeleton />
                    </Grid>
                  );
                }

                if (error) {
                  return (
                    <Grid item xs={12} key={friend}>
                      <Card className={classes.errorCard} elevation={0}>
                        <CardContent className={classes.friendCardContent}>
                          <Box className={classes.friendHeader}>
                            <Box className={classes.friendInfo}>
                              <Typography className={classes.friendName}>
                                {highlightText(friend, debouncedSearchTerm)}
                              </Typography>
                              <Typography variant="body2" color="error">
                                {error}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => removeFriend(friend)}
                              style={{ color: '#f44336' }}
                            >
                              <ClearIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                }

                return (
                  <Grid item xs={12} key={friend}>
                    <Fade in timeout={300}>
                      <Card 
                        className={classes.friendCard} 
                        elevation={0}
                        onClick={() => handleOpenFriendProfile(friend)}
                        style={{ cursor: 'pointer' }}
                      >
                        <CardContent className={classes.friendCardContent}>
                          <Box className={classes.friendHeader}>
                            <Box className={classes.avatarContainer}>
                              <Avatar
                                className={classes.friendAvatar}
                                src={profile?.user?.profilePhotoUrl}
                              >
                                {(profile?.user?.firstName || friend)[0].toUpperCase()}
                              </Avatar>
                              {/* Rank Badge */}
                              <Box className={getRankBadgeClass(position)}>
                                {getRankText(position)}
                              </Box>
                            </Box>
                            
                            <Box className={classes.friendInfo}>
                              <Box display="flex" alignItems="center" style={{ gap: '8px' }}>
                                <Typography className={classes.friendName}>
                                  {highlightText(
                                    profile?.user?.firstName && profile?.user?.lastName 
                                      ? `${profile.user.firstName} ${profile.user.lastName}`
                                      : friend, 
                                    debouncedSearchTerm
                                  )}
                                </Typography>
                                <Chip
                                  label={`${profile?.user?.totalPoints || 0} pts`}
                                  className={classes.pointsChip}
                                  size="small"
                                />
                              </Box>
                              <Typography className={classes.friendUsername}>
                                @{highlightText(friend, debouncedSearchTerm)}
                              </Typography>
                              <Typography variant="body2" style={{ color: '#a0916c', fontSize: '0.8rem' }}>
                                S/N: {profile?.user?.idNumber || 'N/A'}
                              </Typography>
                            </Box>
                            
                            <IconButton
                              size="small"
                              onClick={() => removeFriend(friend)}
                              style={{ color: '#8b7355', opacity: 0.6 }}
                            >
                              <ClearIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        {/* Add Friend Modal */}
        <Dialog open={addFriendModalOpen} onClose={closeAddFriendModal} maxWidth="sm" fullWidth>
          <DialogTitle>Add Friend to League</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="I.S.R.U Username"
              type="text"
              fullWidth
              variant="outlined"
              value={newFriendUsername}
              onChange={(e) => setNewFriendUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addFriend();
                }
              }}
              placeholder="Enter username..."
              style={{ marginTop: 16 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAddFriendModal} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={addFriend} 
              color="primary" 
              variant="contained"
              disabled={!newFriendUsername.trim()}
            >
              Add Friend
            </Button>
          </DialogActions>
        </Dialog>

        {/* Friend Profile Modal */}
        <Dialog
          open={friendProfileModalOpen}
          onClose={handleCloseFriendProfile}
          maxWidth="sm"
          fullWidth
          classes={{
            paper: classes.profileModal
          }}
        >
          <DialogTitle
            style={{
              backgroundColor: '#e0dfca',
              color: '#8b7355',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              minHeight: '48px',
            }}
          >
            <IconButton
              onClick={handleCloseFriendProfile}
              style={{ color: '#8b7355', padding: 4 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent style={{ padding: '24px' }}>
            {friendProfileLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress style={{ color: '#8b7355' }} />
              </Box>
            )}

            {friendProfileError && (
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
                  {friendProfileError}
                </Typography>
              </Box>
            )}

            {selectedFriendProfile && (
              <Card
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #d4c4a8',
                }}
              >
                <CardContent
                  style={{
                    background: 'linear-gradient(135deg, #fefdfb 0%, #f8f6f1 100%)',
                    borderRadius: 12,
                    padding: 24,
                  }}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      style={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#8b7355',
                        fontSize: '2rem',
                      }}
                      src={selectedFriendProfile.user.profilePhotoUrl}
                    >
                      {selectedFriendProfile.user.firstName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box ml={2}>
                      <Typography variant="h6" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                        {selectedFriendProfile.user.firstName} {selectedFriendProfile.user.lastName}
                      </Typography>
                      <Typography variant="body2" style={{ color: '#8b7355' }}>
                        @{selectedFriendProfile.user.username}
                      </Typography>
                      <Typography variant="caption" style={{ color: '#8b7355' }}>
                        ID: {selectedFriendProfile.user.idNumber}
                      </Typography>
                      <br />
                      <Typography variant="caption" style={{ color: '#8b7355' }}>
                        Member since: {new Date(selectedFriendProfile.user.dateJoined).toLocaleDateString()}
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
                        label={`Total Points: ${selectedFriendProfile.user.totalPoints}`}
                        style={{
                          backgroundColor: '#d4c4a8',
                          color: '#8b7355',
                          fontWeight: 'bold',
                        }}
                        size="small"
                      />
                      <Chip
                        label={`Excellence Awards: ${selectedFriendProfile.user.excellenceAwardsCount}`}
                        style={{
                          backgroundColor: '#d4c4a8',
                          color: '#8b7355',
                          fontWeight: 'bold',
                        }}
                        size="small"
                      />
                      {selectedFriendProfile.user.profileExcellenceRank && (
                        <Chip
                          label={`Excellence Rank: ${selectedFriendProfile.user.profileExcellenceRank}`}
                          style={{
                            backgroundColor: '#d4c4a8',
                            color: '#8b7355',
                            fontWeight: 'bold',
                          }}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Active Activities Section */}
                  {selectedFriendProfile.activities && selectedFriendProfile.activities.length > 0 && (
                    <>
                      <Divider style={{ backgroundColor: '#d4c4a8', margin: '16px 0' }} />
                      <Box mb={2}>
                        <Typography variant="subtitle2" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 8 }}>
                          Active Activities ({selectedFriendProfile.activities.length})
                        </Typography>
                        {selectedFriendProfile.activities.slice(0, 3).map((activity) => (
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
                              </Box>
                            </Box>
                          </Box>
                        ))}
                        {selectedFriendProfile.activities.length > 3 && (
                          <Typography variant="caption" style={{ color: '#8b7355', fontStyle: 'italic' }}>
                            +{selectedFriendProfile.activities.length - 3} more activities...
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}

                  {/* Completed Modules Section */}
                  {selectedFriendProfile.completedModules && selectedFriendProfile.completedModules.length > 0 && (
                    <>
                      <Divider style={{ backgroundColor: '#d4c4a8', margin: '16px 0' }} />
                      <Box>
                        <Typography variant="subtitle2" style={{ color: '#8b7355', fontWeight: 'bold', marginBottom: 8 }}>
                          Completed Modules ({selectedFriendProfile.completedModules.length})
                        </Typography>
                        <Box display="flex" flexWrap="wrap" style={{ gap: '4px' }}>
                          {selectedFriendProfile.completedModules.slice(0, 6).map((module) => (
                            <Chip
                              key={module.id}
                              label={module.name}
                              size="small"
                              style={{
                                backgroundColor: '#6b7d5a',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          ))}
                          {selectedFriendProfile.completedModules.length > 6 && (
                            <Chip
                              label={`+${selectedFriendProfile.completedModules.length - 6} more`}
                              size="small"
                              style={{
                                backgroundColor: '#a0916c',
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Card>
    </>
  );
};

export default FriendsLeague;
