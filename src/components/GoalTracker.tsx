import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  GpsFixed as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@material-ui/icons';
import { UserGoal, GoalProgress, GoalPrediction, UserStats } from '../types';
import GoalService from '../services/goalService';

const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      backgroundColor: '#f5f1eb',
      borderRadius: '12px',
      maxWidth: '600px',
    },
  },
  dialogTitle: {
    backgroundColor: '#e0dfca',
    color: '#8b7355',
    fontWeight: 'bold',
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    marginBottom: theme.spacing(2),
    border: '2px solid #d4c4a8',
  },
  activeGoalCard: {
    border: '2px solid #8b7355',
    boxShadow: '0 4px 8px rgba(139, 115, 85, 0.2)',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#8b7355',
    },
  },
  predictionChip: {
    fontWeight: 'bold',
    fontSize: '0.75rem',
  },
  highLikelihood: {
    backgroundColor: '#4caf50',
    color: 'white',
  },
  mediumLikelihood: {
    backgroundColor: '#ff9800',
    color: 'white',
  },
  lowLikelihood: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  button: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#6d5a42',
    },
    borderRadius: '8px',
  },
  secondaryButton: {
    color: '#8b7355',
    borderColor: '#8b7355',
    '&:hover': {
      backgroundColor: '#f5f1eb',
    },
    borderRadius: '8px',
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
    },
  },
  achievedBadge: {
    backgroundColor: '#4caf50',
    color: 'white',
    fontWeight: 'bold',
  },
}));

interface GoalTrackerProps {
  open: boolean;
  onClose: () => void;
  username: string;
  currentStats?: UserStats;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  open,
  onClose,
  username,
  currentStats,
}) => {
  const classes = useStyles();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [activeGoal, setActiveGoal] = useState<UserGoal | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [goalPrediction, setGoalPrediction] = useState<GoalPrediction | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTargetPosition, setNewTargetPosition] = useState<string>('');
  const [targetDays, setTargetDays] = useState<string>('30');

  useEffect(() => {
    if (open && username) {
      loadGoals();
    }
  }, [open, username]);

  useEffect(() => {
    if (activeGoal && currentStats) {
      // Save progress entry
      GoalService.saveProgressEntry(username, currentStats.position, currentStats.score);
      
      // Calculate progress and predictions
      const progress = GoalService.calculateProgress(activeGoal, currentStats);
      const prediction = GoalService.generatePrediction(activeGoal, currentStats);
      
      setGoalProgress(progress);
      setGoalPrediction(prediction);

      // Check if goal is achieved
      if (GoalService.checkGoalAchieved(activeGoal, currentStats)) {
        loadGoals(); // Refresh goals list
      }
    }
  }, [activeGoal, currentStats, username]);

  const loadGoals = () => {
    const userGoals = GoalService.getGoals(username);
    const active = GoalService.getActiveGoal(username);
    
    setGoals(userGoals);
    setActiveGoal(active);
  };

  const handleCreateGoal = () => {
    const targetPos = parseInt(newTargetPosition);
    if (!targetPos || targetPos <= 0) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(targetDays));

    const newGoal = GoalService.createGoal(username, targetPos, targetDate);
    
    setGoals(prev => [...prev.map(g => ({ ...g, isActive: false })), newGoal]);
    setActiveGoal(newGoal);
    setShowCreateForm(false);
    setNewTargetPosition('');
    setTargetDays('30');
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    setGoals(updatedGoals);
    
    // Update localStorage
    const allGoals = GoalService.getGoals(username);
    const filteredGoals = allGoals.filter(g => g.id !== goalId);
    localStorage.setItem(`isru-goals_${username}`, JSON.stringify(filteredGoals));
    
    if (activeGoal?.id === goalId) {
      setActiveGoal(null);
      setGoalProgress(null);
      setGoalPrediction(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLikelihoodChipClass = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return classes.highLikelihood;
      case 'medium': return classes.mediumLikelihood;
      case 'low': return classes.lowLikelihood;
      default: return classes.mediumLikelihood;
    }
  };

  const renderGoalCard = (goal: UserGoal) => {
    const isActive = goal.isActive;
    const isAchieved = !!goal.achievedAt;
    
    return (
      <Card 
        key={goal.id} 
        className={`${classes.goalCard} ${isActive ? classes.activeGoalCard : ''}`}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" mb={1}>
                <TargetIcon style={{ color: '#8b7355', marginRight: 8 }} />
                <Typography variant="h6" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                  Target Position: #{goal.targetPosition}
                </Typography>
                {isAchieved && (
                  <Chip
                    label="Achieved!"
                    icon={<CheckCircleIcon />}
                    className={classes.achievedBadge}
                    size="small"
                    style={{ marginLeft: 8 }}
                  />
                )}
                {isActive && !isAchieved && (
                  <Chip
                    label="Active"
                    color="primary"
                    size="small"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Box>
              
              <Typography variant="body2" style={{ color: '#8b7355', marginBottom: 8 }}>
                Created: {formatDate(goal.createdAt)}
                {goal.targetDate && (
                  <> • Target: {formatDate(goal.targetDate)}</>
                )}
                {goal.achievedAt && (
                  <> • Achieved: {formatDate(goal.achievedAt)}</>
                )}
              </Typography>

              {isActive && goalProgress && !isAchieved && (
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" style={{ fontWeight: 'bold', color: '#8b7355' }}>
                      Progress: {goalProgress.progressPercentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" style={{ color: '#8b7355' }}>
                      {goalProgress.positionsToGo} positions to go
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, goalProgress.progressPercentage)}
                    className={classes.progressBar}
                  />
                  
                  {goalPrediction && (
                    <Box mt={2}>
                      <Box display="flex" alignItems="center" style={{ gap: '8px' }} mb={1}>
                        <Chip
                          label={`${goalPrediction.likelihood.toUpperCase()} LIKELIHOOD`}
                          className={`${classes.predictionChip} ${getLikelihoodChipClass(goalPrediction.likelihood)}`}
                          size="small"
                        />
                        <Chip
                          label={`${goalPrediction.confidence}% confidence`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" style={{ color: '#8b7355', fontSize: '0.85rem' }}>
                        📅 Estimated: {formatDate(goalPrediction.estimatedAchievementDate)}
                      </Typography>
                      
                      {goalPrediction.factors.length > 0 && (
                        <Typography variant="body2" style={{ color: '#8b7355', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          {goalPrediction.factors.join(' • ')}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            
            <IconButton
              size="small"
              onClick={() => handleDeleteGoal(goal.id)}
              style={{ color: '#f44336' }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCreateForm = () => (
    <Card className={classes.goalCard}>
      <CardContent>
        <Typography variant="h6" style={{ color: '#8b7355', marginBottom: 16 }}>
          Create New Goal
        </Typography>
        
        <Box display="flex" style={{ gap: '16px' }} mb={2}>
          <TextField
            label="Target Position"
            type="number"
            value={newTargetPosition}
            onChange={(e) => setNewTargetPosition(e.target.value)}
            className={classes.textField}
            fullWidth
            inputProps={{ min: 1, max: currentStats?.position || 1000 }}
          />
          
          <FormControl className={classes.textField} fullWidth>
            <InputLabel>Time Frame</InputLabel>
            <Select
              value={targetDays}
              onChange={(e) => setTargetDays(e.target.value as string)}
            >
              <MenuItem value="7">1 Week</MenuItem>
              <MenuItem value="14">2 Weeks</MenuItem>
              <MenuItem value="30">1 Month</MenuItem>
              <MenuItem value="60">2 Months</MenuItem>
              <MenuItem value="90">3 Months</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box display="flex" style={{ gap: '8px' }} justifyContent="flex-end">
          <Button
            onClick={() => setShowCreateForm(false)}
            className={classes.secondaryButton}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGoal}
            className={classes.button}
            disabled={!newTargetPosition || parseInt(newTargetPosition) <= 0}
          >
            Create Goal
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={classes.dialog}
    >
      <DialogTitle className={classes.dialogTitle}>
        🎯 Goal Tracker & Predictions
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" style={{ marginBottom: 16, color: '#8b7355' }}>
          Set target positions and track your progress with AI-powered predictions.
        </Typography>

        {currentStats && (
          <Box mb={2} p={2} style={{ backgroundColor: '#e8f5e8', borderRadius: 8 }}>
            <Typography variant="body2" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
              Current Position: #{currentStats.position} • Score: {currentStats.score}
            </Typography>
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" style={{ color: '#8b7355' }}>
            Your Goals ({goals.length})
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
            className={classes.button}
            size="small"
          >
            New Goal
          </Button>
        </Box>

        {showCreateForm && renderCreateForm()}

        {goals.length === 0 && !showCreateForm ? (
          <Box textAlign="center" py={4}>
            <TargetIcon style={{ fontSize: 48, color: '#d4c4a8', marginBottom: 16 }} />
            <Typography variant="body1" style={{ color: '#8b7355' }}>
              No goals set yet. Create your first goal to start tracking progress!
            </Typography>
          </Box>
        ) : (
          goals.map(renderGoalCard)
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} className={classes.button}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
