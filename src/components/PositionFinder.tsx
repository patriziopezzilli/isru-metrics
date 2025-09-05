import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Fade,
  LinearProgress,
  Collapse,
  IconButton,
  makeStyles,
  Grid
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import {
  Search as SearchIcon,
  TrendingUp as RankIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  LocalMall as ShoeIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  positionCard: {
    background: 'linear-gradient(135deg, #e55a2b 0%, #d4751c 50%, #e67332 100%)',
    color: 'white',
    borderRadius: 8,
    marginBottom: 16,
    border: 'none',
    boxShadow: 'none',
  },
  cardContent: {
    padding: '16px !important',
  },
  headerBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  subtitle: {
    opacity: 0.9,
    marginBottom: 16,
    fontSize: '0.95rem',
  },
  inputContainer: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  },
  usernameInput: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 6,
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.8)',
      },
    },
    '& .MuiOutlinedInput-input': {
      color: 'white',
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.7)',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.8)',
    },
  },
  findButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontWeight: 'bold',
    padding: '12px 24px',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&:disabled': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.5)',
    },
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  findButtonContainer: {
    display: 'flex',
    gap: 12,
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: 8,
    },
  },
  progressContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: '0.9rem',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#4caf50',
      borderRadius: 3,
    },
  },
  resultContainer: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
  rankNumber: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#ffd700',
  },
  rankText: {
    fontSize: '1.1rem',
    marginBottom: 12,
    opacity: 0.9,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  statChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  warningText: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.85rem',
    opacity: 0.8,
    marginTop: 12,
  },
}));

// Shoe stock estimation scenarios
interface StockScenario {
  name: string;
  totalStock: number;
  piecesPerSize: {min: number, max: number, avg: number};
  color: string;
  bgColor: string;
}

const STOCK_SCENARIOS: StockScenario[] = [
  {
    name: "Extremely Limited",
    totalStock: 1000,
    piecesPerSize: {min: 80, max: 130, avg: 105},
    color: "#d32f2f",
    bgColor: "#ffebee"
  },
  {
    name: "Normal Stock", 
    totalStock: 2000,
    piecesPerSize: {min: 130, max: 200, avg: 165},
    color: "#f57c00",
    bgColor: "#fff3e0"
  },
  {
    name: "Best Case",
    totalStock: 3000,
    piecesPerSize: {min: 200, max: 300, avg: 250},
    color: "#388e3c",
    bgColor: "#e8f5e8"
  }
];

// Calculate probability of getting the shoe based on position and stock
const calculateShoeChance = (position: number, stock: number, avgPiecesPerSize: number): number => {
  // Each person can buy only 1 pair, ranking is in assignment order
  const totalAvailableShoes = stock;
  
  // If your position is within total stock, you're guaranteed a pair
  if (position <= totalAvailableShoes) {
    // Position within stock = 100% chance (guaranteed)
    return 100;
  } else {
    // Position beyond total stock - only chance is if people ahead don't buy
    const overflow = position - totalAvailableShoes;
    const overflowPercentage = (overflow / totalAvailableShoes) * 100;
    
    // Small chance based on typical dropout rates (payment failures, changed minds, etc.)
    if (overflowPercentage <= 5) {
      return Math.max(8, 15 - overflowPercentage); // ~10-15% chance due to dropouts
    } else if (overflowPercentage <= 15) {
      return Math.max(3, 8 - (overflowPercentage * 0.3)); // ~3-8% chance
    } else {
      return Math.max(0.5, 3 - (overflowPercentage * 0.1)); // Very low chance
    }
  }
};

interface PositionResult {
  position: number;
  totalPages: number;
  isExact: boolean;
  totalPoints?: number;
  username: string;
  usersWithSameScore?: number;
}

interface PositionFinderProps {
  currentUsername?: string;
}

const PositionFinder: React.FC<PositionFinderProps> = ({ currentUsername }) => {
  const classes = useStyles();
  
  const [expanded, setExpanded] = useState(false);
  const [probabilityExpanded, setProbabilityExpanded] = useState(false);
  const [username, setUsername] = useState(currentUsername || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PositionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchedUsers, setSearchedUsers] = useState(0);

  const findPosition = async () => {
    await findPositionInternal(false); // Live position
  };

  const findEndOfCampPosition = async () => {
    await findPositionInternal(true); // End of camp position
  };

  const findPositionInternal = async (isEndOfCamp: boolean) => {
    if (!username.trim()) return;

    setLoading(true);
    setResult(null);
    setProgress(0);
    setSearchedUsers(0);

    try {
      const targetUsername = username.trim().toLowerCase();
      const limit = 100;
      let page = 1;
      let found = false;
      let position = 0;
      let totalChecked = 0;
      
      console.log(`🔍 Starting ${isEndOfCamp ? 'end of camp' : 'live'} position search for: ${targetUsername}`);

      while (!found && page <= 20) { // Max 20 pages for unauthenticated users
        try {
          const progressPercent = Math.min((page / 20) * 100, 100);
          setProgress(progressPercent);

          console.log(`📄 Checking page ${page}...`);
          
          // Costruisci l'URL con o senza il parametro eod
          const baseUrl = `/api/universal-proxy?api=isru-leaderboard-pages&page=${page}&limit=${limit}`;
          const fullUrl = isEndOfCamp ? `${baseUrl}&eod=true` : baseUrl;
          
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            console.log(`❌ Page ${page} failed with status: ${response.status}`);
            if (response.status === 404 || response.status === 400) {
              // Reached end of results
              break;
            }
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          console.log(`✅ Page ${page} loaded: ${data.results?.length || 0} users`);

          if (!data.results || data.results.length === 0) {
            console.log(`🔚 No more results on page ${page}`);
            break;
          }

          // Check users on this page
          for (let i = 0; i < data.results.length; i++) {
            const user = data.results[i];
            totalChecked++;
            
            if (user.username.toLowerCase() === targetUsername) {
              position = (page - 1) * limit + i + 1;
              found = true;

              // Count ALL users with the same score across the entire leaderboard
              console.log(`🔍 Counting all users with ${user.totalPoints} points...`);
              const usersWithSameScore = await countUsersWithSameScore(user.totalPoints, isEndOfCamp);

              setResult({
                position,
                totalPages: page,
                isExact: true,
                totalPoints: user.totalPoints,
                username: user.username,
                usersWithSameScore
              });

              console.log(`🎯 Found ${targetUsername} at position ${position}! Total users with same score: ${usersWithSameScore}`);
              break;
            }
          }

          setSearchedUsers(totalChecked);

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 200));
          
          page++;
        } catch (error) {
          console.error(`❌ Error on page ${page}:`, error);
          // Continue to next page on error
          page++;
        }
      }

      if (!found) {
        const estimatedPosition = searchedUsers + 1;
        setResult({
          position: estimatedPosition,
          totalPages: page - 1,
          isExact: false,
          username: targetUsername
        });
        console.log(`📊 User not found in first ${searchedUsers} users, estimated position: ${estimatedPosition}+`);
      }

      setProgress(100);
    } catch (error) {
      console.error('❌ Position search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPosition = (pos: number, isExact: boolean): string => {
    if (!isExact && pos > 2000) {
      return '2000+';
    }
    if (!isExact) {
      return `${pos}+`;
    }
    return pos.toString();
  };

  // Count all users with the same score across the entire leaderboard
  const countUsersWithSameScore = async (targetPoints: number, isEndOfCamp: boolean = false): Promise<number> => {
    try {
      console.log(`🔍 Searching for all users with ${targetPoints} points...`);
      const limit = 100; // Same as findPosition function
      let totalCount = 0;
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages && currentPage <= 50) { // Safety limit: max 50 pages (100k users)
        try {
          // Costruisci l'URL con o senza il parametro eod
          const baseUrl = `/api/universal-proxy?api=isru-leaderboard-pages&page=${currentPage}&limit=${limit}`;
          const fullUrl = isEndOfCamp ? `${baseUrl}&eod=true` : baseUrl;
          
          const response = await fetch(fullUrl,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (!response.ok) {
            console.warn(`⚠️ Failed to fetch page ${currentPage} for score counting`);
            break;
          }

          const data = await response.json();

          if (!data.results || data.results.length === 0) {
            hasMorePages = false;
            break;
          }

          // Count users with same score on this page
          let pageCount = 0;
          for (const user of data.results) {
            if (user.totalPoints === targetPoints) {
              pageCount++;
            }
          }

          totalCount += pageCount;
          console.log(`📄 Page ${currentPage}: found ${pageCount} users with ${targetPoints} points (total so far: ${totalCount})`);

          // If no users with target score on this page, we might be done
          // (assuming leaderboard is sorted by score descending)
          if (pageCount === 0) {
            // Check if we've gone past the target score
            const maxScoreOnPage = Math.max(...data.results.map((u: any) => u.totalPoints));

            if (maxScoreOnPage < targetPoints) {
              // We've gone past the target score, stop searching
              console.log(`🛑 Reached scores below target (${maxScoreOnPage} < ${targetPoints}), stopping search`);
              hasMorePages = false;
              break;
            }
          }

          currentPage++;

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (pageError) {
          console.warn(`⚠️ Error fetching page ${currentPage}:`, pageError);
          break;
        }
      }

      console.log(`✅ Total users with ${targetPoints} points: ${totalCount}`);
      return totalCount;

    } catch (error) {
      console.error('❌ Error counting users with same score:', error);
      return 1; // Fallback: at least the user we found
    }
  };

  const getPositionText = (pos: number, isExact: boolean, usersWithSameScore?: number): string => {
    if (!isExact && pos > 2000) {
      return 'User not found in top 2000 positions. They might be ranked beyond position 2000 or not exist in the leaderboard.';
    }
    if (!isExact) {
      return `User not found in the first ${pos - 1} positions. They are likely ranked beyond position ${pos - 1}.`;
    }
    if (pos === 1) {
      return 'You are #1! 🏆';
    }

    let baseText = `You have ${pos - 1} people ahead of you`;
    if (usersWithSameScore && usersWithSameScore > 1) {
      if (usersWithSameScore === 2) {
        baseText += ` (1 other person shares your score)`;
      } else {
        baseText += ` (${usersWithSameScore - 1} other people share your score)`;
      }
    }
    return baseText;
  };

  return (
    <>
      <Card className={classes.positionCard}>
      <CardContent className={classes.cardContent}>
        <Box className={classes.headerBox}>
          <Typography variant="h6" className={classes.title}>
            <RankIcon />
            🎯 Rank Finder
          </Typography>
          <IconButton 
            className={classes.expandButton}
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Typography className={classes.subtitle}>
          Find your exact position in the leaderboard
        </Typography>

        <Collapse in={expanded}>
          <Box className={classes.inputContainer}>
            <TextField
              className={classes.usernameInput}
              label="Username"
              variant="outlined"
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder={currentUsername ? currentUsername : "Enter your username"}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && username.trim()) {
                  findPosition();
                }
              }}
            />
            <Box className={classes.findButtonContainer}>
              <Button
                className={classes.findButton}
                onClick={findPosition}
                disabled={loading || !username.trim()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              >
                {loading ? 'Searching...' : 'Check Live Position'}
              </Button>
              <Button
                className={classes.findButton}
                onClick={findEndOfCampPosition}
                disabled={loading || !username.trim()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              >
                {loading ? 'Searching...' : 'Check End of Camp Position'}
              </Button>
            </Box>
          </Box>

          <Box className={classes.warningText}>
            <TimerIcon fontSize="small" />
            This calculation may take 30-60 seconds
          </Box>

          {loading && (
            <Fade in={loading}>
              <Box className={classes.progressContainer}>
                <Box className={classes.progressText}>
                  <Typography variant="body2">
                    Finding your position... {searchedUsers} users analyzed
                  </Typography>
                </Box>
                <LinearProgress 
                  className={classes.progressBar}
                  variant="determinate" 
                  value={progress} 
                />
              </Box>
            </Fade>
          )}

          {result && (
            <Fade in={!!result}>
              <Box className={classes.resultContainer}>
                <Typography className={classes.rankNumber}>
                  #{formatPosition(result.position, result.isExact)}
                </Typography>
              
              <Typography className={classes.rankText}>
                {getPositionText(result.position, result.isExact, result.usersWithSameScore)}
              </Typography>

              <Box className={classes.statsRow}>
                <Chip
                  className={classes.statChip}
                  icon={<PeopleIcon />}
                  label={`@${result.username}`}
                  size="small"
                />
                {result.totalPoints && (
                  <Chip
                    className={classes.statChip}
                    icon={<TrophyIcon />}
                    label={`${result.totalPoints} points`}
                    size="small"
                  />
                )}
                {result.usersWithSameScore && result.usersWithSameScore > 1 && (
                  <Chip
                    className={classes.statChip}
                    icon={<PeopleIcon />}
                    label={
                      result.usersWithSameScore === 2
                        ? `1 other with same score`
                        : `${result.usersWithSameScore - 1} others with same score`
                    }
                    size="small"
                  />
                )}
                <Chip
                  className={classes.statChip}
                  icon={<SearchIcon />}
                  label={result.isExact ? 'Exact' : 'Estimated'}
                  size="small"
                />
              </Box>
            </Box>
          </Fade>
        )}
        
        {/* Shoe Drop Probability - Collapsible Section within same card */}
        {result && (
          <Fade in={!!result}>
            <Box mt={2}>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                onClick={() => setProbabilityExpanded(!probabilityExpanded)}
                style={{ 
                  cursor: 'pointer',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(60, 53, 48, 0.05)',
                  borderRadius: 8,
                  border: '1px solid rgba(60, 53, 48, 0.15)',
                  marginBottom: 8
                }}
              >
                <Box display="flex" alignItems="center">
                  <ShoeIcon style={{ color: '#3c3530', marginRight: 8, fontSize: 20 }} />
                  <Typography variant="subtitle1" style={{ color: '#3c3530', fontWeight: 600 }}>
                    👟 Shoe Drop Probability
                  </Typography>
                </Box>
                <IconButton 
                  size="small"
                  style={{ 
                    color: '#3c3530',
                    transform: probabilityExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Box>
              
              <Collapse in={probabilityExpanded}>
                <Box p={2} style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 8 }}>
                  <Typography variant="body2" style={{ color: '#666', marginBottom: 16, textAlign: 'center' }}>
                    Your chances based on position #{result.position}
                  </Typography>
                  
                  {/* Mobile-first: Single column layout */}
                  <Box display="flex" flexDirection="column">
                    {STOCK_SCENARIOS.map((scenario, index) => {
                      const chance = calculateShoeChance(result.position, scenario.totalStock, scenario.piecesPerSize.avg);
                      const isGoodChance = chance >= 70;
                      const isMediumChance = chance >= 40 && chance < 70;
                      
                      return (
                        <Box 
                          key={index}
                          p={2} 
                          mb={2}
                          style={{ 
                            backgroundColor: scenario.bgColor, 
                            border: `2px solid ${scenario.color}`,
                            borderRadius: 12,
                            position: 'relative'
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography 
                              variant="subtitle2" 
                              style={{ 
                                color: scenario.color, 
                                fontWeight: 700
                              }}
                            >
                              {scenario.name}
                            </Typography>
                            <Box style={{ fontSize: '18px' }}>
                              {isGoodChance ? '🔥' : isMediumChance ? '⚡' : '😅'}
                            </Box>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography 
                                variant="h4" 
                                style={{ 
                                  color: scenario.color, 
                                  fontWeight: 800,
                                  lineHeight: 1
                                }}
                              >
                                {Math.round(chance)}%
                              </Typography>
                              <Typography 
                                variant="caption" 
                                style={{ 
                                  color: '#666',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {scenario.totalStock.toLocaleString()} pairs total
                              </Typography>
                            </Box>
                            
                            <Box style={{ width: '40%' }}>
                              <Box 
                                style={{ 
                                  height: 8, 
                                  backgroundColor: 'rgba(0,0,0,0.1)', 
                                  borderRadius: 4,
                                  overflow: 'hidden'
                                }}
                              >
                                <Box 
                                  style={{ 
                                    height: '100%', 
                                    backgroundColor: scenario.color,
                                    width: `${Math.min(100, chance)}%`,
                                    transition: 'width 0.8s ease'
                                  }} 
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  
                  {/* How it works section - same width as cards */}
                  <Box 
                    mt={3} 
                    p={2} 
                    style={{ 
                      backgroundColor: 'rgba(60, 53, 48, 0.05)', 
                      borderRadius: 8,
                      borderLeft: '4px solid #3c3530'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      style={{ 
                        color: '#555',
                        fontSize: '0.85rem',
                        lineHeight: 1.4
                      }}
                    >
                      💡 <strong>How it works:</strong> Calculations assume each person buys exactly 1 pair. 
                      Your position #{result.position} is compared directly to stock levels. Higher positions 
                      account for potential dropouts (payment issues, size unavailability, etc.).
                    </Typography>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </Fade>
        )}
        </Collapse>
      </CardContent>
    </Card>
    
    </>
  );
};

export default PositionFinder;
