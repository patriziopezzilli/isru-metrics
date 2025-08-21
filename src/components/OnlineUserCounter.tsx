import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { OnlineUserStats } from '../types';
import OnlineUsersService from '../services/onlineUsersService';

const useStyles = makeStyles((theme) => ({
  onlineCounter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1, 2),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '20px',
    margin: theme.spacing(1, 0),
    border: '1px solid #ff6b35',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.1), transparent)',
      animation: '$pulse 3s ease-in-out infinite',
    },
  },
  '@keyframes pulse': {
    '0%': { left: '-100%' },
    '50%': { left: '100%' },
    '100%': { left: '100%' },
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    marginRight: theme.spacing(1),
    animation: '$blink 2s ease-in-out infinite',
    boxShadow: '0 0 6px #4caf50',
  },
  '@keyframes blink': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.3 },
  },
  counterText: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#ff6b35',
    marginRight: theme.spacing(1),
    textShadow: '0 0 4px rgba(255, 107, 53, 0.3)',
  },
  usersText: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.8rem',
    color: '#ffffff',
    opacity: 0.9,
  },
  tooltipContent: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  statsChip: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.7rem',
    marginLeft: theme.spacing(1),
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    color: '#ff6b35',
    border: '1px solid rgba(255, 107, 53, 0.3)',
  },
  // Responsive design
  [theme.breakpoints.down('sm')]: {
    onlineCounter: {
      padding: theme.spacing(0.5, 1.5),
      margin: theme.spacing(0.5, 0),
    },
    counterText: {
      fontSize: '0.8rem',
    },
    usersText: {
      fontSize: '0.7rem',
    },
    statsChip: {
      fontSize: '0.6rem',
      marginLeft: theme.spacing(0.5),
    },
  },
}));

const OnlineUserCounter: React.FC = () => {
  const classes = useStyles();
  const [stats, setStats] = useState<OnlineUserStats>({
    currentOnline: 0,
    peakToday: 0,
    totalVisitsToday: 0,
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onlineService = OnlineUsersService.getInstance();
    
    // Get initial stats
    const initialStats = onlineService.getOnlineStats();
    setStats(initialStats);
    setIsLoading(false);

    // Subscribe to updates
    const unsubscribe = onlineService.subscribe((newStats) => {
      setStats(newStats);
    });

    return unsubscribe;
  }, []);

  const formatTooltipContent = () => (
    <div className={classes.tooltipContent}>
      <div>🚀 Online Now: {stats.currentOnline}</div>
      <div>📈 Peak Today: {stats.peakToday}</div>
      <div>👥 Total Visits: {stats.totalVisitsToday}</div>
      <div>🕐 Updated: {stats.lastUpdated.toLocaleTimeString()}</div>
    </div>
  );

  if (isLoading) {
    return (
      <Box className={classes.onlineCounter}>
        <div className={classes.onlineIndicator} />
        <Typography className={classes.counterText}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Tooltip title={formatTooltipContent()} arrow placement="bottom">
      <Box className={classes.onlineCounter}>
        <div className={classes.onlineIndicator} />
        <Typography className={classes.counterText}>
          {stats.currentOnline}
        </Typography>
        <Typography className={classes.usersText}>
          users online
        </Typography>
        {stats.peakToday > stats.currentOnline && (
          <Chip 
            label={`Peak: ${stats.peakToday}`} 
            size="small" 
            className={classes.statsChip}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default OnlineUserCounter;
