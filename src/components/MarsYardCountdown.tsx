import React, { useState, useEffect } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { CountdownTime } from '../types';

const useStyles = makeStyles((theme) => ({
  countdownContainer: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a1a0a 100%)',
    borderBottom: '2px solid #ff6b35',
    borderTop: '1px solid rgba(255, 107, 53, 0.3)',
    padding: theme.spacing(2),
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
      animation: '$sweep 3s ease-in-out infinite',
    },
  },
  '@keyframes sweep': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' },
  },
  title: {
    color: '#ff6b35',
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
    marginBottom: theme.spacing(1),
  },
  countdownGrid: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
  timeUnit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '60px',
    padding: theme.spacing(1),
    background: 'rgba(255, 107, 53, 0.1)',
    border: '1px solid rgba(255, 107, 53, 0.3)',
    borderRadius: '8px',
    backdropFilter: 'blur(5px)',
  },
  timeValue: {
    color: '#ffffff',
    fontFamily: '"Courier New", monospace',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
  },
  timeLabel: {
    color: '#ff6b35',
    fontFamily: '"Courier New", monospace',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: theme.spacing(0.5),
  },
  missionInfo: {
    color: '#cccccc',
    fontFamily: '"Courier New", monospace',
    fontSize: '0.8rem',
    textAlign: 'center',
    marginTop: theme.spacing(1),
    opacity: 0.8,
  },
  expired: {
    background: 'linear-gradient(135deg, #1a0a0a 0%, #2a1a1a 50%, #0a2a0a 100%)',
    borderBottom: '2px solid #4caf50',
  },
  expiredTitle: {
    color: '#4caf50',
    textShadow: '0 0 10px rgba(76, 175, 80, 0.5)',
  },
  launchedMessage: {
    color: '#4caf50',
    fontFamily: '"Courier New", monospace',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadow: '0 0 10px rgba(76, 175, 80, 0.5)',
    animation: '$pulse 2s ease-in-out infinite',
  },
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.7 },
  },
}));

export const MarsYardCountdown: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    isExpired: false,
  });

  const calculateCountdown = (): CountdownTime => {
    // Target date: Mezzanotte del 5 settembre 2025 (UTC)
    const targetDate = new Date('2025-09-05T00:00:00.000Z');
    const now = new Date();
    const totalMs = targetDate.getTime() - now.getTime();

    if (totalMs <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isExpired: true,
      };
    }

    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs,
      isExpired: false,
    };
  };

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(calculateCountdown());
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  if (countdown.isExpired) {
    return (
      <Box className={`${classes.countdownContainer} ${classes.expired}`}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          className={`${classes.title} ${classes.expiredTitle}`}
          align="center"
        >
          🚀 Mars Yard 3.0 - Mission Launched! 🚀
        </Typography>
        <Typography className={classes.launchedMessage}>
          *** MISSION ACTIVE - EXPLORE THE RED PLANET ***
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={classes.countdownContainer}>
      <Typography 
        variant={isMobile ? "body1" : "h6"} 
        className={classes.title}
        align="center"
      >
        🚀 Mars Yard 3.0 Launch Countdown 🚀
      </Typography>
      
      <Box className={classes.countdownGrid}>
        <Box className={classes.timeUnit}>
          <Typography className={classes.timeValue}>
            {formatNumber(countdown.days)}
          </Typography>
          <Typography className={classes.timeLabel}>
            Days
          </Typography>
        </Box>
        
        <Typography 
          style={{ 
            color: '#ff6b35', 
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontFamily: '"Courier New", monospace',
          }}
        >
          :
        </Typography>
        
        <Box className={classes.timeUnit}>
          <Typography className={classes.timeValue}>
            {formatNumber(countdown.hours)}
          </Typography>
          <Typography className={classes.timeLabel}>
            Hours
          </Typography>
        </Box>
        
        <Typography 
          style={{ 
            color: '#ff6b35', 
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontFamily: '"Courier New", monospace',
          }}
        >
          :
        </Typography>
        
        <Box className={classes.timeUnit}>
          <Typography className={classes.timeValue}>
            {formatNumber(countdown.minutes)}
          </Typography>
          <Typography className={classes.timeLabel}>
            Minutes
          </Typography>
        </Box>
        
        <Typography 
          style={{ 
            color: '#ff6b35', 
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontFamily: '"Courier New", monospace',
          }}
        >
          :
        </Typography>
        
        <Box className={classes.timeUnit}>
          <Typography className={classes.timeValue}>
            {formatNumber(countdown.seconds)}
          </Typography>
          <Typography className={classes.timeLabel}>
            Seconds
          </Typography>
        </Box>
      </Box>
      
      <Typography className={classes.missionInfo}>
        T-minus {countdown.days} days until Mars exploration begins
      </Typography>
    </Box>
  );
};
