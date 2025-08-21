import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Close as CloseIcon, Info as InfoIcon, Share as ShareIcon, Image as ImageIcon, Speed as SpeedIcon, BugReport as BugIcon, Assignment as AssignmentIcon } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  changelogContainer: {
    margin: theme.spacing(5, 3, 2, 3),
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(3, 2, 1, 2),
    },
  },
  alert: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    border: '1px solid rgba(14, 165, 233, 0.3)',
    borderRadius: '12px',
    fontFamily: '"Courier New", monospace',
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    position: 'relative',
  },
  changelogText: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    color: '#0369a1',
    marginBottom: theme.spacing(1),
  },
  changelogTitle: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: '4px',
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  featureChip: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: '0.75rem',
    fontWeight: 600,
    height: '24px',
    border: '1px solid #0ea5e9',
    fontFamily: '"Courier New", monospace',
    '& .MuiChip-icon': {
      color: '#0369a1',
      fontSize: '16px',
    },
  },
  closeButton: {
    color: '#0ea5e9',
    padding: '4px',
    position: 'absolute',
    top: '8px',
    right: '8px',
    '&:hover': {
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
    },
  },
}));

interface ChangelogNotificationProps {
  version?: string;
}

const ChangelogNotification: React.FC<ChangelogNotificationProps> = ({ version = "v2.1.0" }) => {
  const classes = useStyles();
  const [isVisible, setIsVisible] = useState(false);
  
  const STORAGE_KEY = `changelog-notification-dismissed-${version}`;

  useEffect(() => {
    // Check if user has already dismissed this version's changelog
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    
    if (!isDismissed) {
      // Show notification after a small delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [STORAGE_KEY]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  const features = [
    { icon: <ShareIcon />, text: "Share League" },
    { icon: <ImageIcon />, text: "Export Profiles" },
    { icon: <AssignmentIcon />, text: "Daily Activities" },
    { icon: <SpeedIcon />, text: "Performance+" },
    { icon: <BugIcon />, text: "Bug Fixes" },
  ];

  return (
    <Box className={classes.changelogContainer}>
      <Box className={classes.alert}>
        <InfoIcon style={{ color: '#0ea5e9', marginTop: '2px', fontSize: '20px' }} />
        
        <Box style={{ flex: 1 }}>
          <Typography className={classes.changelogTitle}>
            🎉 New Features Available!
          </Typography>
          
          <Typography className={classes.changelogText}>
            Discover the latest I.S.R.U League features: share your stats and profile with one click!
          </Typography>
          
          <Box className={classes.featuresList}>
            {features.map((feature, index) => (
              <Chip
                key={index}
                icon={feature.icon}
                label={feature.text}
                className={classes.featureChip}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        <IconButton
          onClick={handleDismiss}
          className={classes.closeButton}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChangelogNotification;
