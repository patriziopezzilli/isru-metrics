import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Collapse, Paper, LinearProgress, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Close as CloseIcon, Launch as LaunchIcon, Warning as WarningIcon } from '@material-ui/icons';
import MigrationService from '../services/migrationService';
import { fetchScoreDistribution } from '../apiService';
import OfflineService from '../services/offlineService';
import { ScoreDistributionResponse } from '../types';

const useStyles = makeStyles((theme) => ({
  // Loader styles
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#fefdfb',
    color: '#333333',
    padding: theme.spacing(3),
  },
  logo: {
    width: '120px',
    height: 'auto',
    marginBottom: theme.spacing(4),
    filter: 'brightness(1)',
  },
  title: {
    fontFamily: '"Courier New", monospace',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    color: '#8b7355',
  },
  subtitle: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.9rem',
    marginBottom: theme.spacing(3),
    textAlign: 'center',
    color: '#666666',
    maxWidth: '400px',
    lineHeight: '1.5',
  },
  progressContainer: {
    width: '300px',
    marginBottom: theme.spacing(3),
  },
  migrationText: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.85rem',
    color: '#c4a07a',
    textAlign: 'center',
    marginTop: theme.spacing(2),
    animation: '$pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 0.6,
    },
    '50%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0.6,
    },
  },
  statusText: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.8rem',
    color: '#8b7355',
    textAlign: 'center',
    marginTop: theme.spacing(1),
  },
  progressBar: {
    backgroundColor: '#8b7355',
  },
  migrationProgressBar: {
    backgroundColor: '#c4a07a',
  },
  // Warning styles
  warningContainer: {
    margin: theme.spacing(5, 3, 2, 3),
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(3, 2, 1, 2),
    },
  },
  alert: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    borderRadius: '12px',
    fontFamily: '"Courier New", monospace',
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    position: 'relative',
  },
  warningText: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    color: '#e65100',
    marginBottom: theme.spacing(1),
  },
  linkText: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#1976d2',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  closeButton: {
    color: '#ff9800',
    padding: '4px',
  },
}));

interface DomainMigrationWarningProps {
  onLoadComplete?: (data: ScoreDistributionResponse | null, username: string) => void;
  showAsLoader?: boolean;
}

const DomainMigrationWarning: React.FC<DomainMigrationWarningProps> = ({ 
  onLoadComplete, 
  showAsLoader = false 
}) => {
  const classes = useStyles();
  const [isVisible, setIsVisible] = useState(true);
  const [loadingStage, setLoadingStage] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing ISRU League...');
  const STORAGE_KEY = 'domain-migration-warning-dismissed';

  useEffect(() => {
    if (showAsLoader) {
      performStartupSequence();
    } else {
      // Check if user has already dismissed the warning
      const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
      if (isDismissed) {
        setIsVisible(false);
        return;
      }

      // Show warning in these cases:
      // 1. On old domain (not isru-league.com)
      // 2. If migration was recently completed (migration-completed exists)
      const currentDomain = window.location.hostname;
      const isNewDomain = currentDomain.includes('isru-league.com');
      const migrationCompleted = localStorage.getItem('migration-completed') !== null;
      const isLocalEnv = MigrationService.isLocalEnvironment();
      
      // Show if on old domain OR if migration was recently completed OR in local for testing
      const shouldShow = !isNewDomain || migrationCompleted || isLocalEnv;
      
      setIsVisible(shouldShow);
    }
  }, [showAsLoader]);

  const performStartupSequence = async () => {
    try {
      let scoreData: ScoreDistributionResponse | null = null;
      let loadedUsername = '';

      // Stage 1: Check for migration need
      setLoadingStage('checking');
      setStatusMessage('Checking for data migration...');
      setProgress(10);
      
      await new Promise(resolve => setTimeout(resolve, 800));

      // Controlla se sul nuovo dominio dobbiamo importare dati
      const migrationImported = MigrationService.importMigratedData();
      if (migrationImported) {
        setLoadingStage('importing');
        setStatusMessage('Importing your data from old domain...');
        setProgress(30);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setStatusMessage('Migration completed successfully! 🎉');
        setProgress(40);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        MigrationService.showMigrationSuccess();
      }

      // Controlla se dobbiamo migrare verso il nuovo dominio
      if (MigrationService.shouldMigrate()) {
        setLoadingStage('migrating');
        setStatusMessage('Preparing data for migration...');
        setProgress(25);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (MigrationService.isLocalEnvironment()) {
          setStatusMessage('Simulating migration (local environment)...');
        } else {
          setStatusMessage('Redirecting to new domain...');
        }
        setProgress(35);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Esegue la migrazione (in locale simula, altrimenti reindirizza)
        await MigrationService.performMigration();
        
        // Se siamo in locale, continua il caricamento normale
        if (!MigrationService.isLocalEnvironment()) {
          return; // Non continua perché verrà reindirizzato
        }
        
        // Solo per locale: mostra messaggio di successo
        setStatusMessage('Migration simulation completed! 🧪');
        setProgress(45);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Stage 2: Load user data
      setLoadingStage('loading');
      setStatusMessage('Loading user profile...');
      setProgress(50);
      
      // Carica username dal localStorage
      const savedUsername = localStorage.getItem('isru-username');
      if (savedUsername) {
        loadedUsername = savedUsername;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 3: Fetch API data
      setStatusMessage('Fetching score distribution data...');
      setProgress(70);
      
      try {
        scoreData = await fetchScoreDistribution();
        
        // Save to offline storage
        OfflineService.saveOfflineData(scoreData, undefined);
        
        setStatusMessage('Data loaded successfully! ✅');
        setProgress(85);
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Failed to fetch data, loading offline data:', error);
        
        setStatusMessage('Loading offline data...');
        const offlineData = OfflineService.loadOfflineData();
        if (offlineData?.scoreDistribution) {
          scoreData = offlineData.scoreDistribution;
          setStatusMessage('Offline data loaded 📱');
        } else {
          setStatusMessage('No data available');
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Stage 4: Finalizing
      setLoadingStage('finalizing');
      setStatusMessage('Preparing user interface...');
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 600));

      setStatusMessage('Ready to launch! 🚀');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Completa il caricamento con i dati
      if (onLoadComplete) {
        onLoadComplete(scoreData, loadedUsername);
      }

    } catch (error) {
      console.error('Startup sequence failed:', error);
      // In caso di errore, continua comunque
      setStatusMessage('Loading complete');
      setProgress(100);
      setTimeout(() => {
        if (onLoadComplete) {
          onLoadComplete(null, '');
        }
      }, 1000);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Se è in modalità loader, mostra il loader
  if (showAsLoader) {
    const isMigrating = loadingStage === 'migrating' || loadingStage === 'importing';

    return (
      <Box className={classes.loaderContainer}>
        <img 
          src="/main-logo-new.jpg" 
          alt="ISRU League" 
          className={classes.logo}
        />
        
        <Typography className={classes.title}>
          ISRU LEAGUE
        </Typography>
        
        <Typography className={classes.subtitle}>
          Mars Resource Utilization Training Program
        </Typography>

        <Box className={classes.progressContainer}>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            style={{
              backgroundColor: 'rgba(139, 115, 85, 0.1)',
              borderRadius: '4px',
            }}
            classes={{
              bar: isMigrating ? classes.migrationProgressBar : classes.progressBar,
            }}
          />
        </Box>

        {isMigrating && (
          <Typography className={classes.migrationText}>
            🚀 Migrating to new domain: www.isru-league.com
          </Typography>
        )}

        <Typography className={classes.statusText}>
          {statusMessage}
        </Typography>

        {loadingStage === 'loading' && (
          <CircularProgress 
            size={24} 
            style={{ 
              color: '#8b7355',
              marginTop: '16px' 
            }} 
          />
        )}
      </Box>
    );
  }

  // Modalità warning normale
  if (!isVisible) {
    return null;
  }

  // Determina il messaggio in base al contesto
  const currentDomain = window.location.hostname;
  const isNewDomain = currentDomain.includes('isru-league.com');
  const migrationCompleted = localStorage.getItem('migration-completed') !== null;

  return (
    <Box className={classes.warningContainer}>
      <Collapse in={isVisible}>
        <Paper 
          elevation={0}
          className={classes.alert}
        >
          <WarningIcon style={{ color: '#ff9800', marginTop: '2px' }} />
          <Box style={{ flex: 1 }}>
            {isNewDomain ? (
              // Su nuovo dominio - mostra successo migrazione
              <>
                <Typography className={classes.warningText}>
                  ✅ <strong>MIGRATION SUCCESSFUL:</strong> Welcome to the new domain{' '}
                  <strong>www.isru-league.com</strong>! Your data has been automatically transferred.
                </Typography>
                <Typography className={classes.warningText}>
                  🎉 <strong>ALL DATA PRESERVED:</strong> Your leagues, goals, and settings are all here and working perfectly.
                </Typography>
              </>
            ) : (
              // Su vecchio dominio - invita a migrare
              <>
                <Typography className={classes.warningText}>
                  🚀 <strong>NEW DOMAIN AVAILABLE:</strong> We have launched{' '}
                  <a 
                    href="https://www.isru-league.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={classes.linkText}
                  >
                    www.isru-league.com
                    <LaunchIcon fontSize="small" />
                  </a>
                </Typography>
                <Typography className={classes.warningText}>
                  🔄 <strong>AUTOMATIC MIGRATION:</strong> Your data will be automatically transferred when you visit the new domain. 
                  All your leagues, goals, and settings will be preserved.
                </Typography>
              </>
            )}
          </Box>
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
            className={classes.closeButton}
            style={{ position: 'absolute', top: '8px', right: '8px' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default DomainMigrationWarning;
