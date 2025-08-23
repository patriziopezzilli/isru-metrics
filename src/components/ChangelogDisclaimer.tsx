import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Fade,
  useMediaQuery,
  useTheme,
  makeStyles
} from '@material-ui/core';
import { 
  Close as CloseIcon,
  Announcement as AnnouncementIcon,
  Whatshot as StreakIcon,
  TrendingUp as TrendingUpIcon
} from '@material-ui/icons';
import DisclaimerService from '../services/disclaimerService';

const useStyles = makeStyles((theme) => ({
  changelogCard: {
    background: '#fff8f0',
    border: '1px solid #e8ddd0',
    borderRadius: '8px',
    marginTop: '24px',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: '#ff7043',
    },
    [theme.breakpoints.down('sm')]: {
      borderRadius: '6px',
      marginTop: '20px',
      marginBottom: '16px',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  headerIcon: {
    color: '#ff7043',
    marginRight: '8px',
    fontSize: '1.2rem',
  },
  closeButton: {
    color: '#8b7355',
    padding: '6px',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '10px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  featureIcon: {
    marginRight: '10px',
    marginTop: '2px',
    fontSize: '1rem',
  },
}));

interface ChangelogDisclaimerProps {
  className?: string;
}

const CHANGELOG_VERSION = 'v2.1_streak_update'; // Identificativo unico per questo changelog

export const ChangelogDisclaimer: React.FC<ChangelogDisclaimerProps> = ({ className }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Controlla se questo changelog è già stato chiuso
    const isDismissed = DisclaimerService.isDismissed(CHANGELOG_VERSION);
    setVisible(!isDismissed);
  }, []);

  const handleClose = () => {
    // Marca come chiuso e nascondi
    DisclaimerService.dismiss(CHANGELOG_VERSION);
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <Fade in={visible} timeout={500}>
      <Card className={`${classes.changelogCard} ${className || ''}`} elevation={0}>
        <Box style={{ padding: isMobile ? '18px' : '22px' }}>
          <Box className={classes.header}>
            <Box display="flex" alignItems="center">
              <AnnouncementIcon className={classes.headerIcon} />
              <Typography 
                variant={isMobile ? 'body2' : 'body1'} 
                style={{ color: '#8b7355', fontWeight: 'bold' }}
              >
                What's New
              </Typography>
            </Box>
            <IconButton 
              className={classes.closeButton}
              onClick={handleClose}
              size="small"
              title="Close and don't show again"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography 
            variant="caption" 
            style={{ 
              color: '#8b7355', 
              marginBottom: '14px', 
              display: 'block',
              fontStyle: 'italic'
            }}
          >
            🎉 Major update! We've enhanced the streak tracking system
          </Typography>

          <Box>
            <Box className={classes.featureItem}>
              <StreakIcon style={{ color: '#ff7043' }} className={classes.featureIcon} />
              <Typography variant="caption" style={{ color: '#8b7355', lineHeight: 1.5 }}>
                <strong>Real-time streak data</strong> - Now showing live streak counts from the ISRU API
              </Typography>
            </Box>

            <Box className={classes.featureItem}>
              <TrendingUpIcon style={{ color: '#4caf50' }} className={classes.featureIcon} />
              <Typography variant="caption" style={{ color: '#8b7355', lineHeight: 1.5 }}>
                <strong>Progress tracking</strong> - Visual progress bars toward levels 7, 30, 90, and 360 days
              </Typography>
            </Box>

            <Box className={classes.featureItem}>
              <AnnouncementIcon style={{ color: '#ffcc02' }} className={classes.featureIcon} />
              <Typography variant="caption" style={{ color: '#8b7355', lineHeight: 1.5 }}>
                <strong>Improved layout</strong> - Collapsible streak section in Daily Progress for better organization
              </Typography>
            </Box>
          </Box>

          <Typography 
            variant="caption" 
            style={{ 
              color: '#999', 
              marginTop: '14px', 
              display: 'block',
              textAlign: 'center',
              fontSize: '0.65rem'
            }}
          >
            Track your consistency and build lasting habits! 🔥
          </Typography>
        </Box>
      </Card>
    </Fade>
  );
};

export default ChangelogDisclaimer;
