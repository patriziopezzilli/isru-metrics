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
  searchContainer: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  searchField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      height: '40px',
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
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: '#f8f6f3',
    borderRadius: '8px',
  },
  userCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2),
    border: '2px solid transparent',
    boxShadow: '0 6px 20px rgba(139, 115, 85, 0.12)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 30px rgba(139, 115, 85, 0.2)',
      borderColor: 'rgba(139, 115, 85, 0.3)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #8b7355 0%, #c4a07a 100%)',
    },
  },
  userCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
  },
  userCardBody: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    backgroundColor: '#f8f6f3',
    borderRadius: '12px',
  },
  userCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing(1),
    borderTop: '1px solid rgba(139, 115, 85, 0.1)',
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
    fontSize: '1.1rem',
    fontFamily: '"Courier New", monospace',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  userInfoSection: {
    textAlign: 'center',
    minWidth: '80px',
  },
  userInfoLabel: {
    fontSize: '0.65rem',
    color: '#8b7355',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: theme.spacing(0.5),
    fontFamily: '"Courier New", monospace',
  },
  userInfoValue: {
    fontSize: '0.8rem',
    color: '#333',
    fontFamily: '"Courier New", monospace',
  },
  lastSeenText: {
    fontSize: '0.75rem',
    color: '#666',
    fontFamily: '"Courier New", monospace',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'right',
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

// Cookie helpers
function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}
function getCookie(name: string) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
}
function removeCookie(name: string) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Check auth cookie on mount
  useEffect(() => {
    if (getCookie('adminAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Filter and pagination logic
  const filteredUsers = userSummaries.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      setLoginError('');
      setCookie('adminAuth', 'true', 30); // Sessione valida 30 giorni
      loadAuditData();
    } else {
      setLoginError('Credenziali non valide');
    }
  };

  const loadAuditData = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Loading audit data from MongoDB Atlas...');

      // Fetch audit data from MongoDB with pagination
      const allAuditData: AuditData[] = [];
      let currentPage = 1;
      let hasMoreData = true;
      const pageSize = 100; // Load 100 records per page

      while (hasMoreData) {
        try {
          console.log(`📄 Loading page ${currentPage}...`);

          const response = await fetch(`/api/audit-list-mongodb?page=${currentPage}&limit=${pageSize}`);

          if (!response.ok) {
            if (response.status === 404) {
              console.log('📭 No more audit data available');
              break;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          if (!result.success || !result.data || !result.data.audits) {
            console.warn('⚠️ Invalid response format from MongoDB API');
            break;
          }

          const pageAudits = result.data.audits;
          console.log(`📊 Page ${currentPage}: loaded ${pageAudits.length} audits`);

          // Convert MongoDB format to AdminDashboard format
          for (const mongoAudit of pageAudits) {
            if (mongoAudit.username) { // Only include audits with username
              allAuditData.push({
                audit_id: mongoAudit.audit_id,
                username: mongoAudit.username,
                timestamp: mongoAudit.timestamp,
                server_timestamp: mongoAudit.server_timestamp,
                localStorage_data: mongoAudit.localStorage_data || {},
                localStorage_size: mongoAudit.localStorage_size || 0,
                url: mongoAudit.url || 'Unknown',
                userAgent: mongoAudit.user_agent || 'Unknown',
                client_ip: mongoAudit.client_ip || 'Unknown',
                app_version: mongoAudit.app_version
              });
            }
          }

          // Check if there are more pages
          hasMoreData = result.data.has_more;
          currentPage++;

          // Safety limit to prevent infinite loops
          if (currentPage > 100) {
            console.warn('⚠️ Reached page limit (100), stopping load');
            break;
          }

        } catch (pageError) {
          console.error(`❌ Error loading page ${currentPage}:`, pageError);
          break;
        }
      }

      console.log(`✅ Total audit data loaded: ${allAuditData.length} entries from MongoDB`);
      setAuditData(allAuditData);

      // Generate user summaries
      generateUserSummaries(allAuditData);

    } catch (err) {
      console.error('❌ Error loading audit data from MongoDB:', err);
      setError('Errore durante il caricamento dei dati di audit da MongoDB');
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
                🔑 Enter your admin credentials
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
              🔄 Loading audit data from MongoDB Atlas...
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
                🧑‍🚀 Mars Colonists ({filteredUsers.length} of {userSummaries.length})
              </Typography>

              {/* Search Bar */}
              <Box className={classes.searchContainer}>
                <TextField
                  className={classes.searchField}
                  placeholder="🔍 Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  variant="outlined"
                  size="small"
                />
                <Typography variant="caption" style={{ color: '#666', minWidth: '60px', textAlign: 'right' }}>
                  Page {currentPage}/{totalPages}
                </Typography>
              </Box>

              {paginatedUsers.map((user, index) => (
                <Box key={index} className={classes.userCard}>
                  {/* Header with username and last seen */}
                  <Box className={classes.userCardHeader}>
                    <Typography className={classes.usernameText}>
                      {user.username.includes('anonymous') ? '👻' : '👤'} {user.username}
                    </Typography>
                    <Box className={classes.lastSeenText}>
                      <Typography variant="caption" style={{ fontSize: '0.65rem', color: '#8b7355', fontWeight: 'bold' }}>
                        LAST SEEN
                      </Typography>
                      <Typography variant="caption" style={{ fontSize: '0.7rem', color: '#666' }}>
                        {new Date(user.lastSeen).toLocaleDateString('it-IT')}
                      </Typography>
                      <Typography variant="caption" style={{ fontSize: '0.65rem', color: '#999' }}>
                        {new Date(user.lastSeen).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Body with key info */}
                  <Box className={classes.userCardBody}>
                    <Box className={classes.userInfoSection}>
                      <Typography className={classes.userInfoLabel}>🔑 ISRU ID</Typography>
                      {user.hasIsruUsername ? (
                        <Chip label="✓ Present" size="small" className={`${classes.chip} ${classes.primaryChip}`} />
                      ) : (
                        <Chip label="✗ Missing" size="small" className={`${classes.chip} ${classes.defaultChip}`} />
                      )}
                    </Box>
                    <Box className={classes.userInfoSection}>
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
                    <Typography variant="caption" style={{ color: '#8b7355', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      Mars Colonist #{startIndex + index + 1}
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
                      🔍 View Data
                    </Button>
                  </Box>
                </Box>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <Box className={classes.paginationContainer}>
                  <Button
                    size="small"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={classes.actionButton}
                  >
                    ← Prev
                  </Button>

                  <Typography variant="body2" style={{ color: '#8b7355', fontWeight: 'bold' }}>
                    {currentPage} of {totalPages}
                  </Typography>

                  <Button
                    size="small"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={classes.actionButton}
                  >
                    Next →
                  </Button>
                </Box>
              )}
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
