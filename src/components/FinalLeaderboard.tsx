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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Usa il proxy universale
      const response = await fetch('/api/universal-proxy?api=hdwatts-leaderboard');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Gestisci sia array diretto che oggetto con proprietà data
      let leaderboardData: FinalLeaderboardResponse;
      
      if (Array.isArray(responseData)) {
        leaderboardData = responseData;
      } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        leaderboardData = responseData.data;
      } else {
        console.error('❌ Response is not an array and does not have data property:', responseData);
        setLeaderboard([]);
        return;
      }
      
      if (leaderboardData.length === 0) {
        console.warn('⚠️ Leaderboard is empty');
        setLeaderboard([]);
        return;
      }
      
      setLeaderboard(leaderboardData);
      
      // If user is logged in, find their position
      if (currentUsername && leaderboardData.length > 0) {
        const userEntry = leaderboardData.find(entry => 
          entry?.username?.toLowerCase() === currentUsername.toLowerCase()
        );
        if (userEntry) {
          const position = leaderboardData.indexOf(userEntry) + 1;
          setUserPosition({ position, entry: userEntry });
        } else {
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

  // Helper functions for pagination blocks
  const BLOCK_SIZE = 100;
  
  const getLeaderboardBlocks = () => {
    if (!Array.isArray(leaderboard)) return [];
    const blocks = [];
    for (let i = 0; i < leaderboard.length; i += BLOCK_SIZE) {
      blocks.push({
        startIndex: i,
        endIndex: Math.min(i + BLOCK_SIZE, leaderboard.length),
        data: leaderboard.slice(i, i + BLOCK_SIZE)
      });
    }
    return blocks;
  };

  const toggleBlock = (blockIndex: number) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockIndex)) {
        newSet.delete(blockIndex);
      } else {
        newSet.add(blockIndex);
      }
      return newSet;
    });
  };

  const expandAllBlocks = () => {
    const allBlockIndices = getLeaderboardBlocks().map((_, index) => index);
    setExpandedBlocks(new Set(allBlockIndices));
  };

  const collapseAllBlocks = () => {
    setExpandedBlocks(new Set());
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

  return (
    <Card className={classes.card}>
      <Box className={classes.header}>
        <Box>
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
          <Box className={classes.userResult} style={{ marginBottom: '24px' }}>
            <Typography variant="h6" style={{ color: '#ff6b35', marginBottom: 8 }}>
              Summer Camp Position
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
          <Box style={{ marginTop: '16px' }}>
            {/* Block controls */}
            <Box display="flex" mb={2} flexWrap="wrap" style={{ gap: '8px' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={expandAllBlocks}
                style={{ color: '#ff6b35', borderColor: '#ff6b35' }}
              >
                Expand All
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={collapseAllBlocks}
                style={{ color: '#ff6b35', borderColor: '#ff6b35' }}
              >
                Collapse All
              </Button>
              <Typography variant="body2" style={{ alignSelf: 'center', marginLeft: '8px', color: 'rgba(255,255,255,0.7)' }}>
                {getLeaderboardBlocks().length} blocks • {leaderboard.length} total players
              </Typography>
            </Box>

            {/* Leaderboard blocks */}
            {getLeaderboardBlocks().map((block, blockIndex) => (
              <Accordion
                key={blockIndex}
                expanded={expandedBlocks.has(blockIndex)}
                onChange={() => toggleBlock(blockIndex)}
                style={{
                  backgroundColor: 'rgba(255, 107, 53, 0.05)',
                  marginBottom: '8px'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon style={{ color: '#ff6b35' }} />}
                  style={{
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    minHeight: '48px'
                  }}
                >
                  <Typography style={{ color: '#ff6b35', fontWeight: 'bold' }}>
                    Positions {block.startIndex + 1} - {block.endIndex} ({block.data.length} players)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails style={{ padding: 0 }}>
                  <TableContainer component={Paper} className={classes.leaderboardTable} style={{ margin: 0 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Position</TableCell>
                          <TableCell>Username</TableCell>
                          <TableCell align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {block.data.map((entry, relativeIndex) => {
                          const absoluteIndex = block.startIndex + relativeIndex;
                          return entry && entry.username ? (
                            <TableRow key={entry.id || absoluteIndex}>
                              <TableCell style={{ width: isMobile ? '60px' : 'auto' }}>
                                <Box className={classes.positionCell}>
                                  {getMedalEmoji(absoluteIndex + 1) && (
                                    <span style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>
                                      {getMedalEmoji(absoluteIndex + 1)}
                                    </span>
                                  )}
                                  <Typography style={{ 
                                    fontWeight: absoluteIndex < 3 ? 'bold' : 'normal',
                                    fontSize: isMobile ? '0.85rem' : 'inherit'
                                  }}>
                                    #{absoluteIndex + 1}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" style={{ gap: isMobile ? '4px' : '8px' }}>
                                  {!isMobile && (
                                    <Avatar style={{ width: 24, height: 24, backgroundColor: '#ff6b35' }}>
                                      <PersonIcon style={{ fontSize: '1rem' }} />
                                    </Avatar>
                                  )}
                                  <Typography style={{ 
                                    fontWeight: entry.username === currentUsername ? 'bold' : 'normal',
                                    color: entry.username === currentUsername ? '#FFD700' : 'inherit'
                                  }}>
                                    {entry.username}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right" style={{ width: isMobile ? '80px' : 'auto' }}>
                                <Typography style={{ 
                                  fontWeight: 'bold',
                                  fontSize: isMobile ? '0.85rem' : 'inherit'
                                }}>
                                  {entry.total_points || 0}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : null;
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FinalLeaderboard;
