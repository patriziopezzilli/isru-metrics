import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme,
  makeStyles,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar
} from '@material-ui/core';
import {
  EmojiEvents as TrophyIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Schedule as ClockIcon,
  Stars as ExcellenceIcon
} from '@material-ui/icons';
import { FinalLeaderboardResponse, FinalLeaderboardEntry } from '../types';

const useStyles = makeStyles((theme) => ({
  card: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a1a0a 100%)',
    color: 'white',
    borderRadius: 16,
    border: '2px solid #ff6b35',
    borderTop: '1px solid rgba(255, 107, 53, 0.3)',
    boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3)',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      borderRadius: 12,
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
      boxShadow: '0 4px 16px rgba(255, 107, 53, 0.2)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.1), transparent)',
      animation: '$shine 3s ease-in-out infinite',
    },
  },
  '@keyframes shine': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2, 3),
    background: 'rgba(255, 107, 53, 0.1)',
    borderBottom: '1px solid rgba(255, 107, 53, 0.3)',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5, 2),
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
    },
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    fontWeight: 'bold',
    fontSize: '1.4rem',
    color: '#ff6b35',
    textShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.2rem',
      gap: theme.spacing(1),
    },
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.9rem',
    marginTop: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8rem',
      textAlign: 'center',
    },
  },
  searchContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(0, 2),
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      padding: theme.spacing(0, 1),
    },
  },
  searchInput: {
    flex: 1,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      borderRadius: 12,
      [theme.breakpoints.down('sm')]: {
        borderRadius: 8,
      },
      '& fieldset': {
        borderColor: 'rgba(255, 107, 53, 0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 107, 53, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#ff6b35',
        borderWidth: '2px',
      },
    },
    '& .MuiOutlinedInput-input': {
      color: 'white',
      [theme.breakpoints.down('sm')]: {
        fontSize: '0.9rem',
        padding: theme.spacing(1.5),
      },
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#ff6b35',
      },
    },
  },
  actionButton: {
    backgroundColor: '#ff6b35',
    color: 'white',
    fontWeight: 'bold',
    padding: theme.spacing(1.5, 3),
    borderRadius: 12,
    textTransform: 'none',
    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
    [theme.breakpoints.down('sm')]: {
      borderRadius: 8,
      padding: theme.spacing(1, 2),
      fontSize: '0.9rem',
      width: '100%',
    },
    '&:hover': {
      backgroundColor: '#ff8a5b',
      boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)',
    },
    '&:disabled': {
      backgroundColor: 'rgba(255, 107, 53, 0.3)',
      color: 'rgba(255, 255, 255, 0.5)',
    },
  },
  expandButton: {
    color: '#ff6b35',
    margin: theme.spacing(2),
    padding: theme.spacing(1.5, 3),
    border: '2px solid #ff6b35',
    borderRadius: 12,
    background: 'rgba(255, 107, 53, 0.1)',
    fontWeight: 'bold',
    textTransform: 'none',
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(1.5, 1),
      padding: theme.spacing(1, 2),
      borderRadius: 8,
      fontSize: '0.9rem',
      width: 'calc(100% - 16px)',
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 107, 53, 0.2)',
      borderColor: '#ff8a5b',
      boxShadow: '0 4px 15px rgba(255, 107, 53, 0.2)',
    },
  },
  userResult: {
    background: 'rgba(255, 107, 53, 0.15)',
    padding: theme.spacing(2),
    borderRadius: 12,
    border: '2px solid #ff6b35',
    marginBottom: theme.spacing(2),
    margin: theme.spacing(0, 2),
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(0, 1),
      padding: theme.spacing(1.5),
      borderRadius: 8,
    },
  },
  notFoundResult: {
    background: 'rgba(255, 107, 53, 0.15)',
    padding: theme.spacing(2),
    borderRadius: 12,
    border: '2px solid #ff6b35',
    marginBottom: theme.spacing(2),
    margin: theme.spacing(0, 2),
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(0, 1),
      padding: theme.spacing(1.5),
      borderRadius: 8,
    },
  },
  leaderboardTable: {
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    '& .MuiTableHead-root': {
      backgroundColor: 'rgba(255, 107, 53, 0.2)',
    },
    '& .MuiTableCell-root': {
      borderBottom: '1px solid rgba(255, 107, 53, 0.2)',
      color: 'white',
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0.5),
        fontSize: '0.8rem',
      },
    },
    '& .MuiTableCell-head': {
      fontWeight: 'bold',
      color: '#ff6b35',
      [theme.breakpoints.down('sm')]: {
        fontSize: '0.75rem',
      },
    },
    '& .MuiTableRow-root:hover': {
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
    },
  },
  positionCell: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(0.5),
    },
  },
  medal: {
    fontSize: '1.5rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.2rem',
    },
  },
  infoChip: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    color: '#ff6b35',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.65rem',
    },
  },
}));

interface FinalLeaderboardProps {
  currentUsername?: string;
}

export const FinalLeaderboard: React.FC<FinalLeaderboardProps> = ({ currentUsername }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [leaderboard, setLeaderboard] = useState<FinalLeaderboardResponse>([]);
  const [loading, setLoading] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [userPosition, setUserPosition] = useState<{ position: number; entry: FinalLeaderboardEntry } | null>(null);
  const [searchResult, setSearchResult] = useState<{ position: number; entry: FinalLeaderboardEntry } | null>(null);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [notFound, setNotFound] = useState(false);

  console.log('🎯 FinalLeaderboard component rendered');
  console.log('📊 Current state:', { 
    leaderboardLength: leaderboard.length, 
    loading, 
    currentUsername,
    userPosition: userPosition?.position 
  });

  // Debug: vediamo cosa c'è nel leaderboard
  if (leaderboard.length > 0) {
    console.log('🏆 First 3 leaderboard entries:', leaderboard.slice(0, 3));
  }

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting fetch...');
      
      // Usa il proxy universale
      const response = await fetch('/api/universal-proxy?api=hdwatts-leaderboard');
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('📦 Raw response data:', responseData);
      console.log('📦 Response is array?', Array.isArray(responseData));
      console.log('📦 Response type:', typeof responseData);
      
      // Gestisci sia array diretto che oggetto con proprietà data
      let leaderboardData: FinalLeaderboardResponse;
      
      if (Array.isArray(responseData)) {
        leaderboardData = responseData;
        console.log('✅ Using response directly as array');
      } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        leaderboardData = responseData.data;
        console.log('✅ Using response.data as array');
      } else {
        console.error('❌ Response is not an array and does not have data property:', responseData);
        setLeaderboard([]);
        return;
      }
      
      console.log('📊 Final leaderboard data:', leaderboardData);
      console.log('📊 Data length:', leaderboardData.length);
      
      if (leaderboardData.length === 0) {
        console.warn('⚠️ Leaderboard is empty');
        setLeaderboard([]);
        return;
      }
      
      console.log('✅ Setting leaderboard state with', leaderboardData.length, 'entries');
      setLeaderboard(leaderboardData);
      
      // If user is logged in, find their position
      if (currentUsername && leaderboardData.length > 0) {
        console.log('🔍 Looking for user:', currentUsername);
        const userEntry = leaderboardData.find(entry => 
          entry?.username?.toLowerCase() === currentUsername.toLowerCase()
        );
        if (userEntry) {
          const position = leaderboardData.indexOf(userEntry) + 1;
          setUserPosition({ position, entry: userEntry });
          console.log(`👤 User ${currentUsername} found at position ${position}`);
        } else {
          console.log(`👤 User ${currentUsername} not found in leaderboard`);
        }
      }
      
    } catch (error) {
      console.error('💥 Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  // Search for a specific user
  const searchUser = () => {
    if (!searchUsername.trim() || !Array.isArray(leaderboard)) return;
    
    const userEntry = leaderboard.find(entry => 
      entry?.username?.toLowerCase() === searchUsername.trim().toLowerCase()
    );
    
    if (userEntry) {
      const position = leaderboard.indexOf(userEntry) + 1;
      setSearchResult({ position, entry: userEntry });
      setNotFound(false);
    } else {
      setSearchResult(null);
      setNotFound(true);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUsername]);

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  console.log('🎨 About to render FinalLeaderboard');
  console.log('🎨 Render data check:', { 
    hasLeaderboard: Array.isArray(leaderboard) && leaderboard.length > 0,
    isLoading: loading,
    showFullBoard: showFullLeaderboard
  });

  return (
    <Card className={classes.card} style={{ 
      minHeight: '200px', 
      backgroundColor: 'red', 
      border: '5px solid yellow',
      margin: '20px 0',
      display: 'block',
      visibility: 'visible',
      opacity: 1,
      zIndex: 9999
    } as React.CSSProperties}>
      {console.log('🃏 Card rendered with classes:', classes.card)}
      <Box className={classes.header}>
        {console.log('📦 Header rendered')}
        <Box>
          <div style={{ color: 'white', fontSize: '24px', padding: '20px' }}>
            🚨 DEBUG: FINAL LEADERBOARD COMPONENT IS HERE! 🚨
          </div>
          <Box className={classes.title}>
            <TrophyIcon style={{ fontSize: '2rem', color: '#FFD700' }} />
            Final Summer Camp Leaderboard
          </Box>
          <Typography className={classes.subtitle}>
            <ClockIcon style={{ fontSize: '1rem', marginRight: 4 }} />
            Points as of September 5th + Excellence Bonuses
          </Typography>
        </Box>
        <Chip
          icon={<ExcellenceIcon />}
          label={`${Array.isArray(leaderboard) ? leaderboard.length : 0} Players`}
          className={classes.infoChip}
          size="small"
        />
      </Box>

      <CardContent style={{ padding: isMobile ? '16px' : '24px' }}>
        {/* User's position (if logged in) */}
        {currentUsername && userPosition && (
          <Box className={classes.userResult}>
            <Typography variant="h6" style={{ color: '#ff6b35', marginBottom: 8 }}>
              Your Final Position
            </Typography>
            <Box display="flex" alignItems="center" style={{ gap: '16px' }}>
              <Box className={classes.positionCell}>
                {getMedalEmoji(userPosition.position) && (
                  <span className={classes.medal}>{getMedalEmoji(userPosition.position)}</span>
                )}
                <Typography variant="h4" style={{ fontWeight: 'bold', color: '#FFD700' }}>
                  #{userPosition.position}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6">{userPosition.entry.username || 'N/A'}</Typography>
                <Typography style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {userPosition.entry.total_points || 0} points
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Search section */}
        <Box className={classes.searchContainer}>
          <TextField
            className={classes.searchInput}
            variant="outlined"
            size="small"
            placeholder="Search for a player..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                searchUser();
              }
            }}
          />
          <Button
            className={classes.actionButton}
            onClick={searchUser}
            disabled={!searchUsername.trim() || loading}
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
          <Button
            className={classes.actionButton}
            onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
            disabled={loading}
            startIcon={
              <ExpandMoreIcon 
                style={{ 
                  transform: showFullLeaderboard ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} 
              />
            }
          >
            {showFullLeaderboard ? 'Hide' : 'Show'} Full Board
          </Button>
        </Box>

        {/* Search result */}
        {searchResult && (
          <Box className={classes.userResult}>
            <Typography variant="h6" style={{ color: '#ff6b35', marginBottom: 8 }}>
              Search Result
            </Typography>
            <Box display="flex" alignItems="center" style={{ gap: '16px' }}>
              <Box className={classes.positionCell}>
                {getMedalEmoji(searchResult.position) && (
                  <span className={classes.medal}>{getMedalEmoji(searchResult.position)}</span>
                )}
                <Typography variant="h4" style={{ fontWeight: 'bold', color: '#FFD700' }}>
                  #{searchResult.position}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6">{searchResult.entry.username}</Typography>
                <Typography style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {searchResult.entry.total_points} points
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Not found result */}
        {notFound && (
          <Box className={classes.notFoundResult}>
            <Typography variant="h6" style={{ color: '#ff6b35' }}>
              Player "{searchUsername}" not found in the final leaderboard
            </Typography>
          </Box>
        )}

        {/* Loading */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress style={{ color: '#ff6b35' }} />
            <Typography style={{ marginLeft: 16 }}>Loading final leaderboard...</Typography>
          </Box>
        )}

        {/* Full leaderboard */}
        <Collapse in={showFullLeaderboard}>
          <TableContainer component={Paper} className={classes.leaderboardTable}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="right">Points</TableCell>
                  <TableCell align="right">Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(leaderboard) && leaderboard.slice(0, 50).map((entry, index) => 
                  entry && entry.username ? (
                  <TableRow key={entry.id || index}>
                    <TableCell>
                      <Box className={classes.positionCell}>
                        {getMedalEmoji(index + 1) && (
                          <span style={{ fontSize: '1.2rem' }}>{getMedalEmoji(index + 1)}</span>
                        )}
                        <Typography style={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                          #{index + 1}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" style={{ gap: '8px' }}>
                        <Avatar style={{ width: 24, height: 24, backgroundColor: '#ff6b35' }}>
                          <PersonIcon style={{ fontSize: '1rem' }} />
                        </Avatar>
                        <Typography style={{ 
                          fontWeight: entry.username === currentUsername ? 'bold' : 'normal',
                          color: entry.username === currentUsername ? '#FFD700' : 'inherit'
                        }}>
                          {entry.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography style={{ fontWeight: 'bold' }}>
                        {entry.total_points || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {entry.last_checked_on ? formatDate(entry.last_checked_on) : 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  ) : null
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FinalLeaderboard;
