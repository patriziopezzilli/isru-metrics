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
import Dashboard from './components/Dashboard';
import UserSearch from './components/UserSearch';
import { UserProfile } from './components/UserProfile';
import { UserProfileIcon } from './components/UserProfileIcon';
import { fetchScoreDistribution } from './apiService';
import { ScoreDistributionResponse } from './types';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8b7355', // Marrone caldo dalla foto
      light: '#a0916c',
      dark: '#6b5d4a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d4c4a8', // Beige dalla foto
      light: '#e6ddd4',
      dark: '#a0916c',
      contrastText: '#3c3530',
    },
    background: {
      default: '#f5f1eb', // Avorio dalla foto
      paper: '#fefdfb',
    },
    text: {
      primary: '#3c3530', // Marrone scuro
      secondary: '#6b5d52', // Marrone medio
    },
    // Sovrascriviamo tutti i colori di default
    info: {
      main: '#8b7355',
      light: '#a0916c',
      dark: '#6b5d4a',
    },
    success: {
      main: '#6b7d5a', // Verde terra
      light: '#8a9b77',
      dark: '#4d5c3f',
    },
    warning: {
      main: '#b8965a', // Oro terroso
      light: '#d4b377',
      dark: '#9c7f42',
    },
    error: {
      main: '#a55c52', // Rosso terroso
      light: '#c2796f',
      dark: '#8a453c',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16, // Bordi più arrotondati
  },
  overrides: {
    MuiCard: {
      root: {
        borderRadius: 16,
        boxShadow: '0 4px 6px -1px rgba(139, 115, 85, 0.1), 0 2px 4px -1px rgba(139, 115, 85, 0.06)',
      },
    },
    MuiButton: {
      root: {
        borderRadius: 12,
        textTransform: 'none' as const,
        fontWeight: 500,
      },
      containedPrimary: {
        backgroundColor: '#8b7355',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: '#6b5d4a',
        },
      },
      containedSecondary: {
        backgroundColor: '#d4c4a8',
        color: '#3c3530',
        '&:hover': {
          backgroundColor: '#a0916c',
        },
      },
    },
    MuiTab: {
      root: {
        textTransform: 'none' as const,
        '&.Mui-selected': {
          color: '#ffffff',
        },
      },
    },
    MuiTabs: {
      indicator: {
        backgroundColor: '#ffffff',
        height: 3,
        borderRadius: 2,
      },
    },
    MuiCircularProgress: {
      root: {
        color: '#8b7355',
      },
    },
    MuiLinearProgress: {
      root: {
        backgroundColor: 'rgba(139, 115, 85, 0.1)',
      },
      bar: {
        backgroundColor: '#8b7355',
      },
    },
    MuiTextField: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          '& fieldset': {
            borderColor: 'rgba(139, 115, 85, 0.3)',
          },
          '&:hover fieldset': {
            borderColor: '#8b7355',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#8b7355',
          },
        },
      },
    },
    MuiPaper: {
      rounded: {
        borderRadius: 16,
      },
      elevation1: {
        boxShadow: '0 1px 3px 0 rgba(139, 115, 85, 0.1), 0 1px 2px 0 rgba(139, 115, 85, 0.06)',
      },
      elevation3: {
        boxShadow: '0 4px 6px -1px rgba(139, 115, 85, 0.1), 0 2px 4px -1px rgba(139, 115, 85, 0.06)',
      },
    },
    MuiChip: {
      root: {
        borderRadius: 8,
        backgroundColor: 'rgba(139, 115, 85, 0.1)',
        color: '#3c3530',
      },
    },
  },
});

const App = () => {
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [username, setUsername] = useState<string>('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
    // Load username from localStorage
    const savedUsername = localStorage.getItem('isru-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchScoreDistribution();
      setScoreDistribution(data);
    } catch (err) {
      setError('Error loading data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue as 0 | 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent 
        loading={loading}
        error={error}
        scoreDistribution={scoreDistribution}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLoadData={loadData}
        username={username}
        profileDialogOpen={profileDialogOpen}
        onProfileDialogOpen={() => setProfileDialogOpen(true)}
        onProfileDialogClose={() => setProfileDialogOpen(false)}
        onUsernameSet={(newUsername) => {
          setUsername(newUsername);
          if (newUsername) {
            localStorage.setItem('isru-username', newUsername);
          } else {
            localStorage.removeItem('isru-username');
          }
        }}
      />
      <Analytics />
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
  activeTab: 0 | 1;
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

  if (loading) {
    return (
      <>
        <Container maxWidth="sm" style={{ marginTop: 64, textAlign: 'center' }}>
          <CircularProgress size={60} style={{ marginBottom: 16 }} />
          <Typography variant="h4" gutterBottom>
            Loading ISRU Data...
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Please wait while we fetch the latest metrics
          </Typography>
        </Container>
      </>
    );
  }

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
      <AppBar position="static" elevation={0} style={{ background: '#e0dfca' }}>
        {/* Header con logo principale centrato */}
        <Toolbar style={{ padding: isMobile ? '16px' : '24px', minHeight: isMobile ? 120 : 140, justifyContent: 'center' }}>
          {React.createElement('img', {
            src: "/main-logo.png",
            alt: "Main Logo",
            style: {
              height: isMobile ? 100 : 120,
              maxWidth: '100%',
              objectFit: 'contain' as const,
            }
          })}
        </Toolbar>
        
        {/* Seconda riga - Controlli sempre su riga separata */}
        <Box style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
          <Toolbar style={{ padding: isMobile ? '8px 16px' : '12px 24px', minHeight: isMobile ? 48 : 56, justifyContent: 'space-between' }}>
            <Button
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={onLoadData}
              size={isMobile ? "small" : "medium"}
              style={{ 
                borderRadius: 12, 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                color: '#333',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
              }}
            >
              Refresh
            </Button>
            <Tabs
              value={activeTab}
              onChange={onTabChange}
              indicatorColor="primary"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 12,
                padding: isMobile ? '2px' : '4px',
                maxWidth: isMobile ? 200 : 300,
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
            </Tabs>
            
            <UserProfileIcon
              hasProfile={!!username}
              onClick={onProfileDialogOpen}
            />
          </Toolbar>
        </Box>
      </AppBar>
      
      <Container maxWidth="lg" style={{ marginTop: 32, marginBottom: 32 }}>
        {activeTab === 0 && (
          <Dashboard scoreDistribution={scoreDistribution} />
        )}
        
        {activeTab === 1 && (
          <UserSearch scoreDistribution={scoreDistribution} />
        )}
      </Container>

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
            📱 Mobile Optimized • 📊 Data from isrucamp.com • 🎯 Estimated Stock: 1500 pieces
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default App;
