import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import Dashboard from './components/Dashboard';
import UserSearch from './components/UserSearch';
import { UserProfile } from './components/UserProfile';
import { UserProfileIcon } from './components/UserProfileIcon';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MarsYardCountdown } from './components/MarsYardCountdown';
// import { ChangelogDisclaimer } from './components/ChangelogDisclaimer';
import PositionFinder from './components/PositionFinder';
import AppLoader from './components/AppLoader';
import OnlineUserCounter from './components/OnlineUserCounter';
import CollapsibleFeedback from './components/CollapsibleFeedback';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import AdminDashboard from './components/AdminDashboard';
import ActivityLeague from './components/ActivityLeague';
import { activityTracker } from './services/activityTracker';
import { useViewportFix } from './hooks/useViewportFix';
import { fetchScoreDistribution, calculateUserStats } from './apiService';
import { ScoreDistributionResponse, UserStats } from './types';
import OfflineService from './services/offlineService';
import AuditService from './services/auditService';

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

// Component to check if we're on admin route
const useAdminRoute = () => {
  const location = useLocation();
  return location.pathname === '/admin';
};

const MainApp = () => {
  const isAdminRoute = useAdminRoute();
  const [appLoaded, setAppLoaded] = useState(false);
  const [data, setData] = useState<ScoreDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState<string>('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Fix per layout mobile con tastiera
  useViewportFix();

  useEffect(() => {
    // I dati vengono ora caricati direttamente da AppLoader
    // Questo useEffect non è più necessario

    // Invia audit localStorage asincrono quando l'app è caricata
    if (appLoaded) {
      console.log('📊 App loaded, starting localStorage audit...');

      // Track initial page view
      activityTracker.trackPageView('I.S.R.U League - Main App');

      AuditService.auditLocalStorage({
        includeAllKeys: false, // Solo chiavi ISRU
        maxDataSize: 50000,    // Max 50KB
        onSuccess: () => {
          console.log('✅ localStorage audit completed successfully');
        },
        onError: (error) => {
          console.warn('⚠️ localStorage audit failed:', error);
        }
      });
    }
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
    setActiveTab(newValue as 0 | 1 | 2 | 3);
  };

  return (
    <>
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
            activeTab={activeTab as 0 | 1 | 2 | 3}
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
        </>
      )}
    </>
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
  activeTab: 0 | 1 | 2 | 3;
  onTabChange: (event: React.ChangeEvent<{}>, newValue: number) => void;
  onLoadData: () => void;
  username: string;
  profileDialogOpen: boolean;
  onProfileDialogOpen: () => void;
  onProfileDialogClose: () => void;
  onUsernameSet: (newUsername: string) => void;
}) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const materialTheme = useTheme();
  const isMobile = useMediaQuery(materialTheme.breakpoints.down('sm'));
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Debug wrapper per tab change
  const handleTabChangeWithDebug = (event: React.ChangeEvent<{}>, newValue: number) => {
    console.log('🎯 Tab change:', { from: activeTab, to: newValue, isMobile, hasUsername: !!username });

    // Track tab change activity
    const tabNames = ['Dashboard', 'User Search', 'Profile', 'Activity League'];
    activityTracker.trackTabChange(tabNames[newValue] || `Tab ${newValue}`);

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
        <Paper elevation={3} style={{ padding: 32, textAlign: 'center', marginTop: 64 }}>
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
      </>
    );
  }

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        style={{
          background: '#E5E4CF',
          paddingTop: '16px',
          width: '100%',
          maxWidth: '100vw',
          margin: 0,
          padding: 0
        }}
      >
        {/* Header con logo principale centrato */}
        <Toolbar
          style={{
            padding: isMobile ? '16px' : '24px',
            minHeight: isMobile ? 120 : 140,
            position: 'relative',
            width: '100%',
            maxWidth: '100vw',
            margin: 0,
            boxSizing: 'border-box'
          }}
        >
          <Box
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          >
            {React.createElement('img', {
              src: "/main-logo-new.jpg",
              alt: "Main Logo",
              style: {
                height: isMobile ? 100 : 120,
                maxWidth: '100%',
                objectFit: 'contain' as const,
                marginTop: isMobile ? 8 : 16,
              }
            })}
          </Box>
          <Box
            style={{
              position: 'absolute',
              right: isMobile ? 8 : 24,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
            }}
          >
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
          </Box>
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
        
        {/* Sezione feedback collapsabile */}
        <Box display="flex" justifyContent="center" alignItems="center" style={{ paddingBottom: '12px' }}>
          <CollapsibleFeedback onSent={() => setFeedbackSent(true)} />
        </Box>
        <Snackbar open={feedbackSent} autoHideDuration={2500} onClose={() => setFeedbackSent(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <MuiAlert elevation={6} variant="filled" onClose={() => setFeedbackSent(false)} severity="success">
            Feedback sent! Thank you 🙏
          </MuiAlert>
        </Snackbar>
        
        {/* Seconda riga - Controlli sempre su riga separata */}
        <Box
          style={{
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            width: '100%',
            maxWidth: '100vw',
            margin: 0,
            padding: 0
          }}
        >
          <Toolbar
            style={{
              padding: isMobile ? '8px 16px' : '12px 24px',
              minHeight: isMobile ? 48 : 56,
              justifyContent: 'center',
              width: '100%',
              maxWidth: '100vw',
              margin: 0,
              boxSizing: 'border-box'
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChangeWithDebug}
              indicatorColor="primary"
              variant="fullWidth"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 12,
                padding: isMobile ? '2px' : '4px',
                maxWidth: isMobile ? 320 : 400,
                minWidth: isMobile ? 320 : 400,
                margin: '0 auto',
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
              <Tab
                icon={<EmojiEventsIcon />}
                label={!isMobile ? "Activity League" : undefined}
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
      <Box style={{ marginBottom: isMobile ? 16 : 24 }}>
        <MarsYardCountdown />
      </Box>

      {/* Changelog Disclaimer */}

      <Box
        style={{
          marginTop: 0,
          marginBottom: 32,
          paddingLeft: isMobile ? 8 : 24,
          paddingRight: isMobile ? 8 : 24,
          maxWidth: '100vw',
          overflowX: 'hidden',
          position: 'relative',
          width: '100%',
          minHeight: isMobile ? 'calc(100vh - 200px)' : 'auto'
        }}
      >
        {console.log('🎭 Rendering content for activeTab:', activeTab, { isMobile, hasUsername: !!username })}
        {activeTab === 0 && (
          <>
            <Box style={{ marginBottom: isMobile ? 16 : 24 }}>
              <PositionFinder currentUsername={username} />
            </Box>
            <Dashboard scoreDistribution={scoreDistribution} currentUsername={username} />
          </>
        )}
        
        {activeTab === 1 && (
          <UserSearch scoreDistribution={scoreDistribution} />
        )}

        {activeTab === 2 && (
          <ActivityLeague currentUsername={username} />
        )}

        {activeTab === 3 && isMobile && (
          <UserProfile
            open={true}
            onClose={onProfileDialogClose}
            username={username}
            onUsernameSet={onUsernameSet}
            inline={true}
          />
        )}
  </Box>

      <UserProfile
        open={profileDialogOpen}
        onClose={onProfileDialogClose}
        username={username}
        onUsernameSet={onUsernameSet}
      />

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
            🚀 Official Tom Sachs I.S.R.U Summer Camp Leaderboard • 📊 Data from isrucamp.com
          </Typography>
          <Typography variant="caption" color="textSecondary" align="center" style={{ marginTop: '8px', display: 'block' }}>
            Inspired by Tom Sachs Studio • NikeCraft Mars Training Activities • Space Resource Utilization Rankings
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

// Main App component with routing
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Router>
      <Analytics />
    </ThemeProvider>
  );
};

export default App;
