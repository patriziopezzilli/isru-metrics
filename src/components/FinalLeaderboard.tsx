import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@material-ui/core';
import {
  EmojiEvents as TrophyIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Schedule as ClockIcon,
  Stars as ExcellenceIcon,
  Info as InfoIcon
} from '@material-ui/icons';
import { FinalLeaderboardResponse, FinalLeaderboardEntry } from '../types';

// Memoized row component for better performance
const LeaderboardRow = React.memo(({ 
  entry, 
  absoluteIndex, 
  currentUsername, 
  isMobile, 
  classes, 
  getMedalEmoji 
}: {
  entry: FinalLeaderboardEntry;
  absoluteIndex: number;
  currentUsername?: string;
  isMobile: boolean;
  classes: any;
  getMedalEmoji: (position: number) => string;
}) => {
  if (!entry || !entry.username) return null;

  return (
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
            color: entry.username === currentUsername ? '#FFD700' : 'inherit',
            fontSize: isMobile ? '0.85rem' : 'inherit'
          }}>
            {entry.username}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="right">
        <Typography style={{ 
          fontWeight: 'bold',
          color: '#ff6b35',
          fontSize: isMobile ? '0.85rem' : 'inherit'
        }}>
          {entry.total_points || 0}
        </Typography>
      </TableCell>
    </TableRow>
  );
});

LeaderboardRow.displayName = 'LeaderboardRow';

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSearchAndControls, setShowSearchAndControls] = useState(true);
  
  // Paginazione
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch leaderboard data paginata
  const fetchLeaderboard = async (pageParam = page, searchParam = searchUsername) => {
    setLoading(true);
    try {
      const url = `/api/universal-proxy?api=hdwatts-leaderboard&page=${pageParam}&search=${encodeURIComponent(searchParam.trim())}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      // Atteso: { data: [...], totalPages: n, total: n }
      if (!responseData || !Array.isArray(responseData.data)) {
        setLeaderboard([]);
        setTotalPages(1);
        return;
      }
      setLeaderboard(responseData.data);
      setTotalPages(responseData.totalPages || 1);
      // Reset user position e risultati ricerca
      setUserPosition(null);
      setSearchResult(null);
      setNotFound(false);
    } catch (error) {
      setLeaderboard([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Ricerca: aggiorna la tabella usando il parametro search dell'API
  const searchUser = () => {
    setPage(1);
    fetchLeaderboard(1, searchUsername);
  };

  // Nessun blocco, la paginazione sarà gestita lato API


  // Blocchi e virtualizzazione rimossi: la tabella mostrerà solo i dati della pagina corrente

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line
  }, [page, currentUsername]);

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
            <IconButton
              onClick={() => setShowInfoModal(true)}
              style={{ 
                color: '#FFD700', 
                marginLeft: '12px',
                padding: '8px',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              title="How it works?"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
              }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
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

        {/* Toggle button for logged users */}
        {currentUsername && userPosition && (
          <Box style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '16px',
            marginBottom: '8px'
          }}>
            <Button
              onClick={() => setShowSearchAndControls(!showSearchAndControls)}
              style={{
                color: '#FFD700',
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                textTransform: 'none',
                borderRadius: '20px',
                padding: '8px 24px'
              }}
              variant="outlined"
              startIcon={
                <ExpandMoreIcon 
                  style={{ 
                    transform: showSearchAndControls ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }} 
                />
              }
            >
              {showSearchAndControls ? 'Hide' : 'Open'} Full Board & Search
            </Button>
          </Box>
        )}

        {/* Search section */}
        <Collapse in={showSearchAndControls}>
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
        </Collapse>

        {/* Full leaderboard */}
        <Collapse in={showFullLeaderboard}>
          <Box style={{ marginTop: '16px' }}>
            {/* Tabella paginata */}
            <TableContainer component={Paper} className={classes.leaderboardTable} style={{ backgroundColor: 'transparent' }}>
              <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ width: isMobile ? '60px' : 'auto', backgroundColor: 'rgba(26, 26, 26, 0.95)' }}>Position</TableCell>
                    <TableCell style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)' }}>Username</TableCell>
                    <TableCell align="right" style={{ backgroundColor: 'rgba(26, 26, 26, 0.95)' }}>Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry: FinalLeaderboardEntry, idx: number) => (
                    entry && entry.username ? (
                      <TableRow key={entry.id || idx}>
                        <TableCell style={{ width: isMobile ? '60px' : 'auto' }}>
                          <Box className={classes.positionCell}>
                            {getMedalEmoji((page - 1) * 50 + idx + 1) && (
                              <span style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>
                                {getMedalEmoji((page - 1) * 50 + idx + 1)}
                              </span>
                            )}
                            <Typography style={{ 
                              fontWeight: idx < 3 ? 'bold' : 'normal',
                              fontSize: isMobile ? '0.85rem' : 'inherit'
                            }}>
                              #{(page - 1) * 50 + idx + 1}
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
                              color: entry.username === currentUsername ? '#FFD700' : 'inherit',
                              fontSize: isMobile ? '0.85rem' : 'inherit'
                            }}>
                              {entry.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" style={{ width: isMobile ? '80px' : 'auto' }}>
                          <Typography style={{ 
                            fontWeight: 'bold',
                            color: '#ff6b35',
                            fontSize: isMobile ? '0.85rem' : 'inherit'
                          }}>
                            {entry.total_points || 0}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Controlli paginazione */}
            <Box display="flex" justifyContent="center" alignItems="center" mt={2} mb={2} style={{ gap: 16 }}>
              <Button
                variant="outlined"
                color="primary"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
                style={{ marginRight: 12 }}
              >
                Pagina precedente
              </Button>
              <Typography variant="body1" style={{ color: '#FFD700', fontWeight: 'bold' }}>
                Pagina {page} di {totalPages}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                style={{ marginLeft: 12 }}
              >
                Pagina successiva
              </Button>
            </Box>
          </Box>
        </Collapse>

        {/* Credits Section */}
        <Box 
          style={{ 
            marginTop: '16px',
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 107, 53, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 107, 53, 0.1)',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="caption" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '4px',
              fontSize: '0.7rem'
            }}
          >
            Leaderboard data powered by
          </Typography>
          <Typography
            component="a"
            href="https://www.hdwatts.com/isru-stats"
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            style={{
              color: '#FFD700',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-block',
              marginLeft: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff6b35';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#FFD700';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            HDWatts.com
          </Typography>
        </Box>
      </CardContent>

      {/* Info Modal */}
      <Dialog
        open={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: '1px solid #ff6b35'
          }
        }}
      >
        <DialogTitle style={{ borderBottom: '1px solid rgba(255, 107, 53, 0.3)', paddingBottom: '16px' }}>
          <Typography variant="h6" style={{ color: '#FFD700', fontWeight: 'bold' }}>
            How It Works?
          </Typography>
        </DialogTitle>
        <DialogContent style={{ padding: '24px' }}>
          <Typography variant="h6" style={{ color: '#ff6b35', marginBottom: '16px' }}>
            What is this?
          </Typography>
          <Typography variant="body1" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
            The goal of this project is to provide an estimated snapshot of the leaderboard as of the end of camp + excellence after camp. It aims to accomplish this by:
          </Typography>
          
          <Box component="ul" style={{ paddingLeft: '20px', marginBottom: '24px' }}>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Scraping the current state of the leaderboard from the ISRU API.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Filtering out all points that were earned in preseason, post season, and bonuses. The bonuses are filtered out because they are calculated as of EST, so users in Asia and Europe got red badge upgrades for dates after camp. We do not know if ISRU will take this into account, but it should be safe to assume!
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Keeping all negative adjustments that occur in the post season, as the moderating team is adjusting the points after the deadline.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Dynamically calculating the streak bonuses for each user.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Dynamically calculating the cumulative point bonuses for each user.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              If a user used make up points and end up earning double cumulative point bonuses, those are currently not being counted. TBD on how I will handle those. See user: "dizzy" who had two Ten Free Throw bonuses and also used a make up day to fill in the gap.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Turn any point reversals from deleted submissions to just -1 point, as streaks and bonuses are now dynamically calculated.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Only count a single "Shared their Movie" submission as 101 points. The reason we include the bonus 100 points no matter what is because it gets calculated in EST, so PST users who uploaded at like 10PM on the last day would end up with a 100 point bonus recorded after the deadline. This feels wrong to me, so I include those points, but we don't know how ISRU will handle it.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Doubled up points are not counted for cumulative point bonuses, even if they haven't been caught by mods. See users like "taichi" who have multiple points. They are currently still counted as normal points as it is too difficult to filter out.
            </Typography>
            <Typography component="li" variant="body2" style={{ marginBottom: '8px', lineHeight: 1.5 }}>
              Tie breaking based on the internal ISRU ID of each user.
            </Typography>
          </Box>

          <Typography variant="h6" style={{ color: '#ff6b35', marginBottom: '16px' }}>
            Additional Disclaimers - Please Read Before Asking Questions:
          </Typography>
          <Typography variant="body2" style={{ marginBottom: '12px', lineHeight: 1.6 }}>
            This is currently under very active development and should not be viewed as a 100% accurate snapshot of the leaderboard. I still haven't even scraped all the data yet, as of right now there are 7280 users in the database.
          </Typography>
          <Typography variant="body2" style={{ lineHeight: 1.6 }}>
            I believe I now have logic built around post-seasonally awarded excellence bonuses, however it requires me to manually run the script. I will work on automating it tomorrow.
          </Typography>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 107, 53, 0.3)' }}>
          <Button 
            onClick={() => setShowInfoModal(false)} 
            style={{ color: '#FFD700' }}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default FinalLeaderboard;
