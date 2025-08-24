import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  LinearProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #8b7355 0%, #c4a07a 50%, #d4c4a8 100%)',
    padding: 0,
  },
  contentWrapper: {
    backgroundColor: '#fefdfb',
    minHeight: '100vh',
    padding: theme.spacing(3),
  },
  loginCard: {
    maxWidth: 450,
    margin: '0 auto',
    marginTop: theme.spacing(8),
    padding: theme.spacing(4),
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(139, 115, 85, 0.15)',
    border: '1px solid rgba(139, 115, 85, 0.1)',
  },
  loginTitle: {
    fontFamily: '"Rocket Sharpie Bold", "Courier New", monospace !important',
    color: '#8b7355',
    textAlign: 'center',
    marginBottom: theme.spacing(3),
    fontSize: '2rem',
    letterSpacing: '0.05em',
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      '& fieldset': {
        borderColor: '#d4c4a8',
      },
      '&:hover fieldset': {
        borderColor: '#8b7355',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#8b7355',
      },
    },
  },
  loginButton: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    borderRadius: '12px',
    padding: theme.spacing(1.5),
    fontSize: '1.1rem',
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#6d5a42',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(139, 115, 85, 0.3)',
    },
    transition: 'all 0.3s ease',
  },
  dashboardHeader: {
    background: 'linear-gradient(135deg, #8b7355 0%, #c4a07a 100%)',
    color: 'white',
    borderRadius: '12px',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    boxShadow: '0 8px 20px rgba(139, 115, 85, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
  },
  headerTitle: {
    fontFamily: '"Rocket Sharpie Bold", "Courier New", monospace !important',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: '0.8rem',
    opacity: 0.9,
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
  },
  statsGrid: {
    marginBottom: theme.spacing(2),
  },
  statCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f6f3 100%)',
    borderRadius: '12px',
    padding: theme.spacing(1.5),
    textAlign: 'center',
    border: '1px solid rgba(139, 115, 85, 0.1)',
    boxShadow: '0 4px 12px rgba(139, 115, 85, 0.08)',
    transition: 'all 0.3s ease',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: theme.spacing(0.5),
    color: '#8b7355',
  },
  statValue: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#8b7355',
    fontFamily: '"Courier New", monospace',
    lineHeight: 1,
  },
  statLabel: {
    color: '#666',
    fontSize: '0.7rem',
    marginTop: theme.spacing(0.3),
    lineHeight: 1.2,
  },
  usersTable: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f6f3 100%)',
    borderRadius: '12px',
    padding: theme.spacing(2),
    border: '1px solid rgba(139, 115, 85, 0.1)',
    boxShadow: '0 8px 20px rgba(139, 115, 85, 0.1)',
  },
  tableTitle: {
    fontFamily: '"Rocket Sharpie Bold", "Courier New", monospace !important',
    color: '#8b7355',
    fontSize: '1.2rem',
    marginBottom: theme.spacing(2),
    textAlign: 'center',
  },
  userCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #faf9f7 100%)',
    borderRadius: '12px',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    border: '1px solid rgba(139, 115, 85, 0.1)',
    boxShadow: '0 4px 12px rgba(139, 115, 85, 0.08)',
  },
  userCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  userCardBody: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  userCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(139, 115, 85, 0.1)',
  },
  tableHeader: {
    backgroundColor: '#8b7355',
    '& .MuiTableCell-head': {
      color: 'white',
      fontWeight: 'bold',
      fontSize: '1rem',
      fontFamily: '"Courier New", monospace',
    },
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      backgroundColor: '#faf9f7',
    },
    '&:hover': {
      backgroundColor: '#f0ede6',
      transform: 'scale(1.01)',
      boxShadow: '0 4px 15px rgba(139, 115, 85, 0.1)',
    },
    transition: 'all 0.2s ease',
  },
  usernameText: {
    fontWeight: 'bold',
    color: '#8b7355',
    fontSize: '1rem',
  },
  userInfoLabel: {
    fontSize: '0.7rem',
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  userInfoValue: {
    fontSize: '0.8rem',
    color: '#333',
    fontFamily: '"Courier New", monospace',
  },
  actionButton: {
    backgroundColor: '#c4a07a',
    color: 'white',
    borderRadius: '8px',
    fontSize: '0.75rem',
    padding: theme.spacing(0.5, 1),
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: '#b8956d',
    },
    transition: 'all 0.2s ease',
  },
  refreshButton: {
    background: 'linear-gradient(135deg, #8b7355 0%, #c4a07a 100%)',
    color: 'white',
    borderRadius: '12px',
    padding: theme.spacing(1, 2),
    fontSize: '0.9rem',
    fontWeight: 'bold',
    width: '100%',
    marginTop: theme.spacing(2),
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)',
    },
    transition: 'all 0.3s ease',
  },
  chip: {
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
  },
  successChip: {
    backgroundColor: '#4caf50',
    color: 'white',
  },
  primaryChip: {
    backgroundColor: '#8b7355',
    color: 'white',
  },
  defaultChip: {
    backgroundColor: '#e0e0e0',
    color: '#666',
  },
  userDataModal: {
    '& .MuiDialog-paper': {
      backgroundColor: '#fefdfb',
      borderRadius: '12px',
      maxWidth: '95vw',
      width: '95%',
      maxHeight: '90vh',
      margin: theme.spacing(1),
    },
  },
  modalTitle: {
    background: 'linear-gradient(135deg, #8b7355 0%, #c4a07a 100%)',
    color: 'white',
    fontFamily: '"Rocket Sharpie Bold", "Courier New", monospace !important',
    fontSize: '1.1rem',
    padding: theme.spacing(2),
    textAlign: 'center',
  },
  modalContent: {
    padding: theme.spacing(2),
  },
  dataSection: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    backgroundColor: '#f8f6f3',
    borderRadius: '8px',
    border: '1px solid rgba(139, 115, 85, 0.1)',
  },
  dataSectionTitle: {
    color: '#8b7355',
    marginBottom: theme.spacing(1),
    fontFamily: '"Courier New", monospace',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  dataKey: {
    fontWeight: 'bold',
    color: '#8b7355',
    fontFamily: '"Courier New", monospace',
    fontSize: '0.75rem',
  },
  dataValue: {
    fontFamily: '"Courier New", monospace',
    fontSize: '0.7rem',
    color: '#333',
    backgroundColor: '#ffffff',
    padding: theme.spacing(0.5),
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    marginTop: theme.spacing(0.3),
    wordBreak: 'break-all',
  },
  jsonViewer: {
    backgroundColor: '#2d3748',
    color: '#e2e8f0',
    padding: theme.spacing(1),
    borderRadius: '6px',
    fontFamily: '"Courier New", monospace',
    fontSize: '0.65rem',
    maxHeight: '200px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

interface AuditData {
  audit_id: string;
  username: string;
  timestamp: string;
  server_timestamp: string;
  localStorage_data: Record<string, any>;
  localStorage_size: number;
  url: string;
  userAgent: string;
  client_ip: string;
  app_version?: string;
}

interface UserAuditSummary {
  username: string;
  auditCount: number;
  lastSeen: string;
  firstSeen: string;
  avgStorageSize: number;
  localStorageData: Record<string, any>;
  hasIsruUsername: boolean;
  hasFriendsLeague: boolean;
  recentAudits: AuditData[];
}

const AdminDashboard: React.FC = () => {
  const classes = useStyles();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserAuditSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAuditSummary | null>(null);
  const [userDataModalOpen, setUserDataModalOpen] = useState(false);

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      setLoginError('');
      loadAuditData();
    } else {
      setLoginError('Credenziali non valide');
    }
  };

  const loadAuditData = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Loading audit data from multiple days...');

      // Fetch audit files from the last 7 days for better coverage
      const allAuditFiles: any[] = [];
      const daysToLoad = 7; // Load last 7 days

      for (let i = 0; i < daysToLoad; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD

        try {
          const listResponse = await fetch(`/api/audit-list?date=${dateStr}`);
          if (listResponse.ok) {
            const auditFilesResponse = await listResponse.json();
            const dayFiles = Array.isArray(auditFilesResponse.audits) ? auditFilesResponse.audits : [];
            allAuditFiles.push(...dayFiles);
            console.log(`📁 Found ${dayFiles.length} files for ${dateStr}`);
          }
        } catch (err) {
          console.warn(`Failed to load audit files for ${dateStr}:`, err);
        }
      }

      console.log(`📊 Total audit files found: ${allAuditFiles.length}`);
      const allAuditData: AuditData[] = [];

      // Process up to 300 files for much better coverage
      const filesToProcess = allAuditFiles.slice(0, 300);

      for (const file of filesToProcess) {
        try {
          const detailsResponse = await fetch(`/api/audit-details?url=${encodeURIComponent(file.url)}`);
          if (detailsResponse.ok) {
            const details = await detailsResponse.json();

            if (details && typeof details === 'object' && details.username) {
              allAuditData.push({
                audit_id: details.audit_id || file.pathname,
                username: details.username,
                timestamp: details.timestamp || new Date().toISOString(),
                server_timestamp: details.server_timestamp || details.timestamp,
                localStorage_data: details.localStorage_data || {},
                localStorage_size: details.localStorage_size || 0,
                url: details.url || 'Unknown',
                userAgent: details.user_agent || details.userAgent || 'Unknown',
                client_ip: details.client_ip || 'Unknown',
                app_version: details.app_version
              });
            }
          }
        } catch (err) {
          console.warn('Failed to load details for file:', file.pathname, err);
        }
      }

      setAuditData(allAuditData);
      console.log('📊 Loaded audit data:', allAuditData.length, 'entries');

      // Generate user summaries
      generateUserSummaries(allAuditData);

    } catch (err) {
      console.error('Error loading audit data:', err);
      setError('Errore durante il caricamento dei dati di audit');
    } finally {
      setLoading(false);
    }
  };

  const generateUserSummaries = (data: AuditData[]): void => {
    if (data.length === 0) {
      setUserSummaries([]);
      return;
    }

    // Group data by username
    const userGroups = new Map<string, AuditData[]>();

    data.forEach(entry => {
      if (!userGroups.has(entry.username)) {
        userGroups.set(entry.username, []);
      }
      userGroups.get(entry.username)!.push(entry);
    });

    // Generate summaries for each user
    const summaries: UserAuditSummary[] = Array.from(userGroups.entries()).map(([username, userAudits]) => {
      // Sort by timestamp (most recent first)
      userAudits.sort((a, b) => new Date(b.server_timestamp).getTime() - new Date(a.server_timestamp).getTime());

      const mostRecentAudit = userAudits[0];
      const oldestAudit = userAudits[userAudits.length - 1];

      // Calculate average storage size
      const avgStorageSize = userAudits.reduce((sum, audit) => sum + audit.localStorage_size, 0) / userAudits.length;

      // Check for specific localStorage keys
      const hasIsruUsername = !!mostRecentAudit.localStorage_data['isru-username'];

      // Check if friends-league exists AND has content (not empty array)
      const friendsLeagueData = mostRecentAudit.localStorage_data['friends-league'];
      const hasFriendsLeague = !!(friendsLeagueData &&
        Array.isArray(friendsLeagueData) &&
        friendsLeagueData.length > 0);

      return {
        username,
        auditCount: userAudits.length,
        lastSeen: mostRecentAudit.server_timestamp,
        firstSeen: oldestAudit.server_timestamp,
        avgStorageSize: Math.round(avgStorageSize),
        localStorageData: mostRecentAudit.localStorage_data,
        hasIsruUsername,
        hasFriendsLeague,
        recentAudits: userAudits.slice(0, 5) // Keep only 5 most recent
      };
    });

    // Sort by last seen (most recent first)
    summaries.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    setUserSummaries(summaries);
    console.log('👥 Generated user summaries:', summaries.length, 'users');
  };

  if (!isAuthenticated) {
    return (
      <Box className={classes.container}>
        <Container maxWidth="sm" className={classes.contentWrapper}>
          <Paper className={classes.loginCard}>
            <Box textAlign="center" mb={3}>
              <SecurityIcon style={{ fontSize: '3rem', color: '#8b7355', marginBottom: '16px' }} />
              <Typography className={classes.loginTitle}>
                🚀 I.S.R.U ADMIN
              </Typography>
              <Typography variant="body1" style={{ color: '#666', marginBottom: '24px' }}>
                Mars Resource Utilization Control Center
              </Typography>
            </Box>

            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <TextField
                fullWidth
                label="Admin Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                variant="outlined"
                className={classes.textField}
                placeholder="Enter admin username..."
              />
              <TextField
                fullWidth
                label="Access Code"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                variant="outlined"
                className={classes.textField}
                placeholder="Enter admin access code..."
              />

              {loginError && (
                <Alert
                  severity="error"
                  style={{
                    marginTop: 16,
                    borderRadius: '12px',
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336'
                  }}
                >
                  {loginError}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                type="submit"
                className={classes.loginButton}
                style={{ marginTop: 24 }}
                size="large"
              >
                🔓 Access Control Center
              </Button>
            </Box>

            <Box mt={2} textAlign="center">
              <Typography variant="caption" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                🔑 Default: admin / admin
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Container maxWidth="lg" className={classes.contentWrapper}>
        {/* Header */}
        <Box className={classes.dashboardHeader}>
          <Typography className={classes.headerTitle}>
            🚀 I.S.R.U ADMIN CENTER
          </Typography>
          <Typography className={classes.headerSubtitle}>
            Mars Resource Utilization - Audit Analytics & User Management
          </Typography>
        </Box>

        {loading && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={6}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f6f3 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(139, 115, 85, 0.1)',
              boxShadow: '0 15px 35px rgba(139, 115, 85, 0.1)',
            }}
          >
            <CircularProgress style={{ color: '#8b7355' }} />
            <Typography variant="h6" style={{ marginLeft: 24, color: '#8b7355', fontFamily: '"Courier New", monospace' }}>
              🔄 Loading audit data from Mars servers...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            style={{
              marginBottom: 24,
              borderRadius: '12px',
              backgroundColor: '#ffebee',
              border: '1px solid #f44336'
            }}
          >
            {error}
          </Alert>
        )}

        {userSummaries.length > 0 && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} className={classes.statsGrid}>
              <Grid item xs={6}>
                <Card className={classes.statCard}>
                  <CardContent>
                    <PeopleIcon className={classes.statIcon} />
                    <Typography className={classes.statValue}>
                      {userSummaries.length}
                    </Typography>
                    <Typography className={classes.statLabel}>
                      🧑‍🚀 Total Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card className={classes.statCard}>
                  <CardContent>
                    <TimelineIcon className={classes.statIcon} />
                    <Typography className={classes.statValue}>
                      {userSummaries.filter(u => u.hasIsruUsername).length}
                    </Typography>
                    <Typography className={classes.statLabel}>
                      🔑 With ISRU ID
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card className={classes.statCard}>
                  <CardContent>
                    <DashboardIcon className={classes.statIcon} />
                    <Typography className={classes.statValue}>
                      {userSummaries.filter(u => u.hasFriendsLeague).length}
                    </Typography>
                    <Typography className={classes.statLabel}>
                      👥 Active in League (with friends data)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Users Cards - Mobile Optimized */}
            <Paper className={classes.usersTable}>
              <Typography className={classes.tableTitle}>
                🧑‍🚀 Mars Colonists ({userSummaries.length})
              </Typography>

              {userSummaries.map((user, index) => (
                <Box key={index} className={classes.userCard}>
                  {/* Header with username */}
                  <Box className={classes.userCardHeader}>
                    <Typography className={classes.usernameText}>
                      👤 {user.username}
                    </Typography>
                    <Typography variant="caption" style={{ color: '#666', fontSize: '0.7rem' }}>
                      {new Date(user.lastSeen).toLocaleDateString('it-IT')}
                    </Typography>
                  </Box>

                  {/* Body with key info */}
                  <Box className={classes.userCardBody}>
                    <Box>
                      <Typography className={classes.userInfoLabel}>🔑 ISRU ID</Typography>
                      {user.hasIsruUsername ? (
                        <Chip label="✓ Yes" size="small" className={`${classes.chip} ${classes.primaryChip}`} />
                      ) : (
                        <Chip label="✗ No" size="small" className={`${classes.chip} ${classes.defaultChip}`} />
                      )}
                    </Box>
                    <Box>
                      <Typography className={classes.userInfoLabel}>👥 League</Typography>
                      {user.hasFriendsLeague ? (
                        <Chip label="✓ Active" size="small" className={`${classes.chip} ${classes.primaryChip}`} />
                      ) : (
                        <Chip label="✗ Empty" size="small" className={`${classes.chip} ${classes.defaultChip}`} />
                      )}
                    </Box>
                  </Box>

                  {/* Footer with action button */}
                  <Box className={classes.userCardFooter}>
                    <Typography variant="caption" style={{ color: '#666', fontSize: '0.7rem' }}>
                      {new Date(user.lastSeen).toLocaleTimeString('it-IT')}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      className={classes.actionButton}
                      onClick={() => {
                        setSelectedUser(user);
                        setUserDataModalOpen(true);
                      }}
                    >
                      🔍 View
                    </Button>
                  </Box>
                </Box>
              ))}
            </Paper>
            <Box mt={4} display="flex" justifyContent="center">
              <Button
                variant="contained"
                onClick={loadAuditData}
                disabled={loading}
                className={classes.refreshButton}
                startIcon={<RefreshIcon />}
              >
                🔄 Refresh Mars Data
              </Button>
            </Box>
          </>
        )}

        {/* User Data Modal */}
        <Dialog
          open={userDataModalOpen}
          onClose={() => setUserDataModalOpen(false)}
          className={classes.userDataModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle className={classes.modalTitle}>
            🧑‍🚀 Mars Colonist Data: {selectedUser?.username}
          </DialogTitle>
          <DialogContent className={classes.modalContent}>
            {selectedUser && (
              <Box>
                {/* User Summary */}
                <Box className={classes.dataSection}>
                  <Typography className={classes.dataSectionTitle}>
                    📊 Summary
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography className={classes.dataKey}>Username:</Typography>
                      <Typography className={classes.dataValue}>{selectedUser.username}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className={classes.dataKey}>Last Seen:</Typography>
                      <Typography className={classes.dataValue}>
                        {new Date(selectedUser.lastSeen).toLocaleDateString('it-IT')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className={classes.dataKey}>ISRU ID:</Typography>
                      <Typography className={classes.dataValue}>
                        {selectedUser.hasIsruUsername ? '✓ Present' : '✗ Missing'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className={classes.dataKey}>League:</Typography>
                      <Typography className={classes.dataValue}>
                        {selectedUser.hasFriendsLeague ? '✓ Active' : '✗ Empty'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* LocalStorage Data */}
                <Box className={classes.dataSection}>
                  <Typography className={classes.dataSectionTitle}>
                    💾 LocalStorage ({Object.keys(selectedUser.localStorageData).length} keys)
                  </Typography>
                  {Object.keys(selectedUser.localStorageData).length > 0 ? (
                    <Box>
                      {Object.entries(selectedUser.localStorageData).slice(0, 5).map(([key, value]) => (
                        <Box key={key} mb={1}>
                          <Typography className={classes.dataKey}>
                            🔑 {key}
                          </Typography>
                          <Typography className={classes.dataValue}>
                            {typeof value === 'object'
                              ? JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                              : String(value).substring(0, 100) + (String(value).length > 100 ? '...' : '')
                            }
                          </Typography>
                        </Box>
                      ))}
                      {Object.keys(selectedUser.localStorageData).length > 5 && (
                        <Typography style={{ color: '#666', fontStyle: 'italic', fontSize: '0.7rem' }}>
                          ... and {Object.keys(selectedUser.localStorageData).length - 5} more keys
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography style={{ color: '#666', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      No localStorage data available
                    </Typography>
                  )}
                </Box>

                {/* Raw JSON Data */}
                <Box className={classes.dataSection}>
                  <Typography className={classes.dataSectionTitle}>
                    🔧 Raw JSON
                  </Typography>
                  <Box className={classes.jsonViewer}>
                    {JSON.stringify(selectedUser.localStorageData, null, 1)}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions style={{ padding: '12px 16px', gap: '8px' }}>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(selectedUser?.localStorageData, null, 2));
                alert('📋 Copied!');
              }}
              className={classes.actionButton}
              size="small"
              fullWidth
            >
              📋 Copy
            </Button>
            <Button
              onClick={() => setUserDataModalOpen(false)}
              className={classes.actionButton}
              size="small"
              fullWidth
              style={{ backgroundColor: '#8b7355' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
