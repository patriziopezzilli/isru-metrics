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
  makeStyles
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import {
  Search as SearchIcon,
  TrendingUp as RankIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon
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
  const [username, setUsername] = useState(currentUsername || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PositionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchedUsers, setSearchedUsers] = useState(0);

  const findPosition = async () => {
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
      
      console.log(`🔍 Starting position search for: ${targetUsername}`);

      while (!found && page <= 20) { // Max 20 pages for unauthenticated users
        try {
          const progressPercent = Math.min((page / 20) * 100, 100);
          setProgress(progressPercent);

          console.log(`📄 Checking page ${page}...`);
          
          const response = await fetch(
            `/api/universal-proxy?api=isru-leaderboard-pages&page=${page}&limit=${limit}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

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
              const usersWithSameScore = await countUsersWithSameScore(user.totalPoints);

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
  const countUsersWithSameScore = async (targetPoints: number): Promise<number> => {
    try {
      console.log(`🔍 Searching for all users with ${targetPoints} points...`);
      const limit = 100; // Same as findPosition function
      let totalCount = 0;
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages && currentPage <= 50) { // Safety limit: max 50 pages (100k users)
        try {
          const response = await fetch(
            `/api/universal-proxy?api=isru-leaderboard-pages&page=${currentPage}&limit=${limit}`,
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
            <Button
              className={classes.findButton}
              onClick={findPosition}
              disabled={loading || !username.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            >
              {loading ? 'Searching...' : 'Find Position'}
            </Button>
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
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PositionFinder;
