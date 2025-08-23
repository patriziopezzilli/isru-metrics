import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { Analytics } from "@vercel/analytics/react"
import { 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs, 
  Tab, 
  Container,
  CircularProgress,
  Box,
  Button,
  Paper,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import DashboardIcon from '@material-ui/icons/Dashboard';
import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import SportsSoccerIcon from '@material-ui/icons/SportsSoccer';
import Dashboard from './components/Dashboard';
import UserSearch from './components/UserSearch';
import { UserProfile } from './components/UserProfile';
import { UserProfileIcon } from './components/UserProfileIcon';
import { GoalTracker } from './components/GoalTracker';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MarsYardCountdown } from './components/MarsYardCountdown';
import { ChangelogDisclaimer } from './components/ChangelogDisclaimer';
import AppLoader from './components/AppLoader';
import OnlineUserCounter from './components/OnlineUserCounter';
import { fetchScoreDistribution, calculateUserStats } from './apiService';
import { ScoreDistributionResponse, UserStats } from './types';
import OfflineService from './services/offlineService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8b7355',  
    },
    secondary: {
      main: '#c4a07a',
    },
    background: {
      default: '#fefdfb',
    },
  },
  typography: {
    fontFamily: '"Courier New", "Courier", monospace',
    h1: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
    h2: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
    h3: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
    h4: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
    h5: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
    h6: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
    body1: {
      fontFamily: '"Courier New", "Courier", monospace',
    },
    body2: {
      fontFamily: '"Courier New", "Courier", monospace',
    },
    button: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
    caption: {
      fontFamily: '"Courier New", "Courier", monospace',
    },
    overline: {
      fontFamily: '"Courier New", "Courier", monospace',
      fontWeight: 'bold',
    },
  },
});

const App = () => {
  const [appLoaded, setAppLoaded] = useState(false);
  const [data, setData] = useState<ScoreDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState<string>('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    // I dati vengono ora caricati direttamente da AppLoader
    // Questo useEffect non è più necessario
  }, [appLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const scoreDistribution = await fetchScoreDistribution();
      setData(scoreDistribution);
      
      // Save to offline storage
      OfflineService.saveOfflineData(scoreDistribution, undefined);
    } catch (err) {
      setError('Error loading data');
      console.error('Error:', err);
      
      // Try to load offline data as fallback
      const offlineData = OfflineService.loadOfflineData();
      if (offlineData) {
        setData(offlineData.scoreDistribution);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue as 0 | 1 | 2);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!appLoaded ? (
        <AppLoader 
          onLoadComplete={(data, loadedUsername) => {
            setData(data);
            setUsername(loadedUsername);
            setLoading(false);
            setAppLoaded(true);
          }} 
        />
      ) : (
        <>
          <AppContent 
            loading={loading}
            error={error}
            scoreDistribution={data}
            activeTab={activeTab as 0 | 1 | 2}
            onTabChange={handleTabChange}
            onLoadData={loadData}
            username={username}
            profileDialogOpen={profileDialogOpen}
            onProfileDialogOpen={() => setProfileDialogOpen(true)}
            onProfileDialogClose={() => setProfileDialogOpen(false)}
            onUsernameSet={(newUsername) => {
              console.log('🔄 App: onUsernameSet called with:', newUsername);
              setUsername(newUsername);
              if (newUsername) {
                console.log('💾 App: Saving to localStorage:', newUsername);
                localStorage.setItem('isru-username', newUsername);
              } else {
                console.log('🗑️ App: Removing from localStorage');
                localStorage.removeItem('isru-username');
              }
              console.log('✅ App: localStorage after operation:', localStorage.getItem('isru-username'));
            }}
          />
          <Analytics />
        </>
      )}
    </ThemeProvider>
  );
};

const AppContent = ({ 
  loading, 
  error, 
  scoreDistribution, 
  activeTab, 
  onTabChange, 
  onLoadData,
  username,
  profileDialogOpen,
  onProfileDialogOpen,
  onProfileDialogClose,
  onUsernameSet
}: {
  loading: boolean;
  error: string | null;
  scoreDistribution: ScoreDistributionResponse | null;
  activeTab: 0 | 1 | 2;
  onTabChange: (event: React.ChangeEvent<{}>, newValue: number) => void;
  onLoadData: () => void;
  username: string;
  profileDialogOpen: boolean;
  onProfileDialogOpen: () => void;
  onProfileDialogClose: () => void;
  onUsernameSet: (username: string) => void;
}) => {
  const materialTheme = useTheme();
  const isMobile = useMediaQuery(materialTheme.breakpoints.down('sm'));
  const [showGoalTracker, setShowGoalTracker] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Debug wrapper per tab change
  const handleTabChangeWithDebug = (event: React.ChangeEvent<{}>, newValue: number) => {
    console.log('🎯 Tab change:', { from: activeTab, to: newValue, isMobile, hasUsername: !!username });
    onTabChange(event, newValue);
  };

  // Load user stats when username changes
  useEffect(() => {
    const loadUserStats = async () => {
      if (username && scoreDistribution) {
        try {
          const stats = calculateUserStats(username, scoreDistribution);
          setUserStats(stats);
        } catch (error) {
          console.error('Error loading user stats:', error);
        }
      }
    };
    loadUserStats();
  }, [username, scoreDistribution]);

  // Rimosso il loading screen separato perché ora AppLoader gestisce tutto il loading

  if (error || !scoreDistribution) {
    return (
      <>
        <Container maxWidth="sm" style={{ marginTop: 64 }}>
          <Paper elevation={3} style={{ padding: 32, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Loading Error
            </Typography>
            <Typography variant="body2" style={{ marginBottom: 24 }}>
              {error || 'Unable to load data'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onLoadData}
              size="large"
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="static" elevation={0} style={{ background: '#E5E4CF', paddingTop: '16px' }}>
        {/* Header con logo principale centrato */}
        <Toolbar style={{ padding: isMobile ? '16px' : '24px', minHeight: isMobile ? 120 : 140, justifyContent: 'center' }}>
          {React.createElement('img', {
            src: "/main-logo-new.jpg",
            alt: "Main Logo",
            style: {
              height: isMobile ? 100 : 120,
              maxWidth: '100%',
              objectFit: 'contain' as const,
            }
          })}
        </Toolbar>
        
        {/* Disclaimer S/N tra logo e counter */}
        <Box display="flex" justifyContent="center" style={{ paddingTop: '0px', paddingBottom: '8px' }}>
          <Typography 
            variant="caption" 
            style={{ 
              fontFamily: '"Courier New", monospace',
              fontSize: '0.7rem',
              color: 'rgba(139, 115, 85, 0.7)',
              letterSpacing: '0.5px',
              fontWeight: 'bold'
            }}
          >
            S/N: 2025.063.03452
          </Typography>
        </Box>
        
        {/* Online Users Counter sotto il disclaimer */}
        <Box display="flex" justifyContent="center" alignItems="center" style={{ paddingBottom: '12px' }}>
          <OnlineUserCounter />
        </Box>
        
        {/* Seconda riga - Controlli sempre su riga separata */}
        <Box style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
          <Toolbar style={{ padding: isMobile ? '8px 16px' : '12px 24px', minHeight: isMobile ? 48 : 56, justifyContent: 'space-between' }}>
            <Box display="flex" alignItems="center" style={{ gap: '8px' }}>
              <Button
                color="inherit"
                onClick={onLoadData}
                size={isMobile ? "small" : "medium"}
                style={{ 
                  borderRadius: '50%',
                  backgroundColor: 'rgba(139, 115, 85, 0.1)',
                  color: '#8b7355',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  minWidth: isMobile ? 40 : 48,
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  padding: 0,
                }}
              >
                <RefreshIcon fontSize={isMobile ? "small" : "medium"} />
              </Button>
              
              {/* Debug button removed for Safari */}
            </Box>
            <Tabs
              value={activeTab}
              onChange={handleTabChangeWithDebug}
              indicatorColor="primary"
              variant="fullWidth"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 12,
                padding: isMobile ? '2px' : '4px',
                maxWidth: isMobile ? 280 : 300,
                minWidth: isMobile ? 280 : 300,
              }}
            >
              <Tab 
                icon={<DashboardIcon />} 
                label={!isMobile ? "Dashboard" : undefined}
                style={{ 
                  borderRadius: 8, 
                  minHeight: isMobile ? 40 : 48,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  color: '#333',
                }}
              />
              <Tab 
                icon={<SearchIcon />} 
                label={!isMobile ? "User Search" : undefined}
                style={{ 
                  borderRadius: 8, 
                  minHeight: isMobile ? 40 : 48,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  color: '#333',
                }}
              />
              {isMobile && (
                <Tab 
                  icon={<PersonIcon />} 
                  label={undefined}
                  style={{ 
                    borderRadius: 8, 
                    minHeight: 40,
                    fontSize: '0.8rem',
                    color: '#333',
                  }}
                />
              )}
            </Tabs>
            
            {/* UserProfileIcon solo su desktop, su mobile c'è sempre il tab Profile */}
            {!isMobile && (
              <UserProfileIcon
                hasProfile={!!username}
                onClick={onProfileDialogOpen}
                isMobile={isMobile}
              />
            )}
          </Toolbar>
        </Box>
      </AppBar>
      
      {/* Mars Yard 3.0 Countdown */}
      <MarsYardCountdown />
      
      {/* Changelog Disclaimer */}
      <Container maxWidth="lg" style={{ paddingLeft: isMobile ? 16 : 24, paddingRight: isMobile ? 16 : 24 }}>
        <ChangelogDisclaimer />
      </Container>
      
      <Container 
        maxWidth="lg" 
        style={{ 
          marginTop: 32, 
          marginBottom: 32,
          paddingLeft: isMobile ? 16 : 24,
          paddingRight: isMobile ? 16 : 24,
          maxWidth: '100vw',
          overflowX: 'hidden'
        }}
      >
        {console.log('🎭 Rendering content for activeTab:', activeTab, { isMobile, hasUsername: !!username })}
        {activeTab === 0 && (
          <Dashboard scoreDistribution={scoreDistribution} currentUsername={username} />
        )}
        
        {activeTab === 1 && (
          <UserSearch scoreDistribution={scoreDistribution} />
        )}
        
        {activeTab === 2 && isMobile && (
          <UserProfile
            open={true}
            onClose={onProfileDialogClose}
            username={username}
            onUsernameSet={onUsernameSet}
            inline={true}
          />
        )}
      </Container>

      {/* Goal Tracker Dialog */}
      {username && (
        <GoalTracker
          open={showGoalTracker}
          onClose={() => setShowGoalTracker(false)}
          username={username}
          currentStats={userStats || undefined}
        />
      )}

      <UserProfile
        open={profileDialogOpen}
        onClose={onProfileDialogClose}
        username={username}
        onUsernameSet={onUsernameSet}
      />

      {/* Goal Tracker Button - Moved to bottom */}
      {username && (
        <Box style={{ marginTop: 32, marginBottom: 32, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowGoalTracker(true)}
            startIcon={<SportsSoccerIcon />}
            style={{ marginRight: 8 }}
          >
            Open Goal Tracker
          </Button>
        </Box>
      )}

      <Box
        component="footer"
        style={{
          paddingTop: 32,
          paddingBottom: 32,
          paddingLeft: 24,
          paddingRight: 24,
          marginTop: 'auto',
          backgroundColor: '#fefdfb',
          borderTop: '1px solid #e6ddd4',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="textSecondary" align="center" style={{ fontWeight: 500 }}>
            📱 Mobile Optimized • 📊 Data from isrucamp.com
          </Typography>
          
          {/* Connection Status nel footer */}
          <Box display="flex" justifyContent="center" alignItems="center" style={{ marginTop: '16px' }}>
            <OfflineIndicator />
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default App;
