import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, LinearProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MigrationService from '../services/migrationService';
import { fetchScoreDistribution } from '../apiService';
import OfflineService from '../services/offlineService';

const useStyles = makeStyles((theme) => ({
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#fefdfb', // Stesso sfondo dell'app principale
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
    fontFamily: '"Rocket Sharpie Bold", "Courier New", monospace !important',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    color: '#8b7355', // Colore primario dell'app
    letterSpacing: '0.1em', // Aggiunge un po' di spaziatura tra le lettere
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
    color: '#c4a07a', // Colore secondario dell'app
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
    backgroundColor: '#8b7355', // Colore primario
  },
  migrationProgressBar: {
    backgroundColor: '#c4a07a', // Colore secondario per migrazione
  },
}));

interface AppLoaderProps {
  onLoadComplete: (data: any, username: string) => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ onLoadComplete }) => {
  const classes = useStyles();
  const [loadingStage, setLoadingStage] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing I.S.R.U League...');

  useEffect(() => {
    const performStartupSequence = async () => {
      try {
        // Stage 1: Check for migration need
        setLoadingStage('checking');
        setStatusMessage('Checking for data migration...');
        setProgress(20);
        
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('🔍 AppLoader: Checking for migration import...');
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 SessionStorage keys:', Object.keys(sessionStorage));
        console.log('🔍 Migration data in sessionStorage:', sessionStorage.getItem('migration-data-full') ? 'FOUND' : 'NOT FOUND');

        // Controlla se sul nuovo dominio dobbiamo importare dati
        const migrationImported = MigrationService.importMigratedData();
        console.log('🔍 Migration import result:', migrationImported);
        
        if (migrationImported) {
          setLoadingStage('importing');
          setStatusMessage('Importing your data from old domain...');
          setProgress(60);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setStatusMessage('Migration completed successfully! 🎉');
          setProgress(80);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          MigrationService.showMigrationSuccess();
        }

        console.log('🔍 AppLoader: Checking if should migrate...');
        console.log('🔍 Should migrate:', MigrationService.shouldMigrate());

        // Controlla se dobbiamo migrare verso il nuovo dominio
        if (MigrationService.shouldMigrate()) {
          console.log('🔍 AppLoader: Starting migration process...');
          setLoadingStage('migrating');
          setStatusMessage('Preparing data for migration...');
          setProgress(40);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (MigrationService.isLocalEnvironment()) {
            setStatusMessage('Simulating migration (local environment)...');
          } else {
            setStatusMessage('Redirecting to new domain...');
          }
          setProgress(70);
          await new Promise(resolve => setTimeout(resolve, 800));
          
          console.log('🔍 AppLoader: Calling performMigration...');
          // Esegue la migrazione (in locale simula, altrimenti reindirizza)
          await MigrationService.performMigration();
          
          // Se siamo in locale, continua il caricamento normale
          if (!MigrationService.isLocalEnvironment()) {
            console.log('🔍 AppLoader: Not local environment, should redirect now');
            return; // Non continua perché verrà reindirizzato
          }
          
          // Solo per locale: mostra messaggio di successo
          setStatusMessage('Migration simulation completed! 🧪');
          setProgress(85);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Stage 2: Normal startup
        setLoadingStage('loading');
        setStatusMessage('Loading application components...');
        setProgress(60);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Stage 3: Load application data
        setLoadingStage('loading-data');
        setStatusMessage('Loading I.S.R.U League data...');
        setProgress(70);
        
        let scoreDistribution = null;
        let username = '';
        
        try {
          // Carica i dati dell'app
          scoreDistribution = await fetchScoreDistribution();
          
          // Carica username salvato
          username = localStorage.getItem('isru-username') || '';
          
          // Salva offline data
          OfflineService.saveOfflineData(scoreDistribution, undefined);
          
          setProgress(85);
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error('Error loading data:', error);
          // Prova a caricare i dati offline
          const offlineData = OfflineService.loadOfflineData();
          if (offlineData) {
            scoreDistribution = offlineData.scoreDistribution;
          }
        }

        // Stage 4: Finalizing
        setLoadingStage('finalizing');
        setStatusMessage('Preparing user interface...');
        setProgress(90);
        await new Promise(resolve => setTimeout(resolve, 800));

        setStatusMessage('Ready to launch! 🚀');
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Completa il caricamento con i dati
        onLoadComplete(scoreDistribution, username);

      } catch (error) {
        console.error('Startup sequence failed:', error);
        // In caso di errore, continua comunque con dati vuoti
        setStatusMessage('Loading complete');
        setProgress(100);
        setTimeout(() => onLoadComplete(null, ''), 1000);
      }
    };

    performStartupSequence();
  }, [onLoadComplete]);

  const isMigrating = loadingStage === 'migrating' || loadingStage === 'importing';

  return (
    <Box className={classes.loaderContainer}>
      <img 
        src="/main-logo-new.jpg" 
        alt="I.S.R.U League" 
        className={classes.logo}
      />
      
      <Typography 
        className={classes.title}
        style={{
          fontFamily: '"Rocket Sharpie Bold", "Courier New", monospace !important'
        }}
      >
        I.S.R.U LEAGUE
      </Typography>
      
      <Typography className={classes.subtitle}>
        Mars Resource Utilization Training Program
      </Typography>

      <Box className={classes.progressContainer}>
        <LinearProgress 
          variant="determinate" 
          value={progress}
          style={{
            backgroundColor: 'rgba(139, 115, 85, 0.1)', // Sfondo più leggero con il colore primario
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
            color: '#8b7355', // Colore primario dell'app
            marginTop: '16px' 
          }} 
        />
      )}
    </Box>
  );
};

export default AppLoader;
