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
  Snackbar
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  loginPaper: {
    padding: theme.spacing(4),
    maxWidth: 400,
    margin: '0 auto',
    marginTop: theme.spacing(8),
  },
  dashboardPaper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  statCard: {
    textAlign: 'center',
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  statIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(1),
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  tableContainer: {
    maxHeight: 400,
  },
  auditEntry: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[50],
    borderRadius: 4,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  headerIcon: {
    marginRight: theme.spacing(1),
    fontSize: '2rem',
  },
}));

interface AuditData {
  id: string;
  timestamp: string;
  userAgent: string;
  url: string;
  localStorageSize: number;
  localStorageKeys: string[];
  sessionStorageSize: number;
  cookiesCount: number;
  viewportSize: string;
  language: string;
  timezone: string;
}

interface AuditStats {
  totalEntries: number;
  uniqueUsers: number;
  avgLocalStorageSize: number;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  topPages: Array<{ url: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  languageDistribution: Array<{ language: string; count: number }>;
  avgSessionTime: number;
}

const AdminDashboard: React.FC = () => {
  const classes = useStyles();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      console.log('🔄 Loading audit data...');
      
      // Fetch list of audit files
      const listResponse = await fetch('/api/audit-list');
      if (!listResponse.ok) {
        throw new Error(`Failed to fetch audit list: ${listResponse.status}`);
      }
      
      const auditFiles = await listResponse.json();
      console.log('📁 Found audit files:', auditFiles);
      
      // Fetch details for each file (limit to last 50 for performance)
      const allAuditData: AuditData[] = [];
      const filesToProcess = auditFiles.slice(0, 50);
      
      for (const file of filesToProcess) {
        try {
          const detailsResponse = await fetch(`/api/audit-details?filename=${encodeURIComponent(file.name)}`);
          if (detailsResponse.ok) {
            const details = await detailsResponse.json();
            if (details.data) {
              allAuditData.push({
                id: file.name,
                timestamp: details.data.timestamp || new Date().toISOString(),
                userAgent: details.data.userAgent || 'Unknown',
                url: details.data.url || 'Unknown',
                localStorageSize: details.data.localStorageSize || 0,
                localStorageKeys: details.data.localStorageKeys || [],
                sessionStorageSize: details.data.sessionStorageSize || 0,
                cookiesCount: details.data.cookiesCount || 0,
                viewportSize: details.data.viewportSize || 'Unknown',
                language: details.data.language || 'Unknown',
                timezone: details.data.timezone || 'Unknown',
              });
            }
          }
        } catch (err) {
          console.warn('Failed to load details for file:', file.name, err);
        }
      }
      
      setAuditData(allAuditData);
      generateStats(allAuditData);
      
    } catch (err) {
      console.error('Error loading audit data:', err);
      setError('Errore durante il caricamento dei dati di audit');
    } finally {
      setLoading(false);
    }
  };

  const generateStats = (data: AuditData[]): void => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    // Calculate statistics
    const userAgentCounts = new Map<string, number>();
    const urlCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();
    const dailyCounts = new Map<string, number>();
    
    let totalLocalStorageSize = 0;
    const uniqueUserAgents = new Set<string>();

    data.forEach(entry => {
      // User agents
      const shortUserAgent = entry.userAgent.split(' ')[0] || 'Unknown';
      userAgentCounts.set(shortUserAgent, (userAgentCounts.get(shortUserAgent) || 0) + 1);
      uniqueUserAgents.add(entry.userAgent);
      
      // URLs
      urlCounts.set(entry.url, (urlCounts.get(entry.url) || 0) + 1);
      
      // Languages
      languageCounts.set(entry.language, (languageCounts.get(entry.language) || 0) + 1);
      
      // Daily counts
      const date = entry.timestamp.split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
      
      // Storage size
      totalLocalStorageSize += entry.localStorageSize;
    });

    const stats: AuditStats = {
      totalEntries: data.length,
      uniqueUsers: uniqueUserAgents.size,
      avgLocalStorageSize: Math.round(totalLocalStorageSize / data.length),
      topUserAgents: Array.from(userAgentCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userAgent, count]) => ({ userAgent, count })),
      topPages: Array.from(urlCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([url, count]) => ({ url, count })),
      dailyStats: Array.from(dailyCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count })),
      languageDistribution: Array.from(languageCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([language, count]) => ({ language, count })),
      avgSessionTime: 0, // Placeholder for now
    };

    setStats(stats);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Paper className={classes.loginPaper}>
          <Box textAlign="center" mb={3}>
            <SecurityIcon className={classes.headerIcon} color="primary" />
            <Typography variant="h4" component="h1">
              Admin Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Accesso riservato agli amministratori
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            
            {loginError && (
              <Alert severity="error" style={{ marginTop: 16 }}>
                {loginError}
              </Alert>
            )}
            
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              style={{ marginTop: 24 }}
              size="large"
            >
              Accedi
            </Button>
          </Box>
          
          <Box mt={2} textAlign="center">
            <Typography variant="caption" color="textSecondary">
              Utilizza: admin / admin
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className={classes.container}>
      <Box className={classes.header}>
        <DashboardIcon className={classes.headerIcon} color="primary" />
        <Typography variant="h4" component="h1">
          Admin Dashboard - Audit Analytics
        </Typography>
      </Box>

      {loading && (
        <Paper className={classes.dashboardPaper}>
          <Box display="flex" alignItems="center" justifyContent="center" p={4}>
            <CircularProgress />
            <Typography variant="body1" style={{ marginLeft: 16 }}>
              Caricamento dati di audit...
            </Typography>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} style={{ marginBottom: 24 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.statCard}>
                <CardContent>
                  <StorageIcon className={classes.statIcon} />
                  <Typography className={classes.statValue}>
                    {stats.totalEntries}
                  </Typography>
                  <Typography variant="h6">
                    Audit Totali
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.statCard}>
                <CardContent>
                  <PeopleIcon className={classes.statIcon} />
                  <Typography className={classes.statValue}>
                    {stats.uniqueUsers}
                  </Typography>
                  <Typography variant="h6">
                    Utenti Unici
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.statCard}>
                <CardContent>
                  <TimelineIcon className={classes.statIcon} />
                  <Typography className={classes.statValue}>
                    {Math.round(stats.avgLocalStorageSize / 1024)}KB
                  </Typography>
                  <Typography variant="h6">
                    Storage Medio
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.statCard}>
                <CardContent>
                  <DashboardIcon className={classes.statIcon} />
                  <Typography className={classes.statValue}>
                    {stats.dailyStats.length}
                  </Typography>
                  <Typography variant="h6">
                    Giorni Attivi
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Tables */}
          <Grid container spacing={3}>
            {/* Top User Agents */}
            <Grid item xs={12} md={6}>
              <Paper className={classes.dashboardPaper}>
                <Typography variant="h6" gutterBottom>
                  Browser più utilizzati
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Browser</TableCell>
                        <TableCell align="right">Utilizzi</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topUserAgents.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.userAgent}</TableCell>
                          <TableCell align="right">{item.count}</TableCell>
                          <TableCell align="right">
                            {Math.round((item.count / stats.totalEntries) * 100)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Top Pages */}
            <Grid item xs={12} md={6}>
              <Paper className={classes.dashboardPaper}>
                <Typography variant="h6" gutterBottom>
                  Pagine più visitate
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>URL</TableCell>
                        <TableCell align="right">Visite</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topPages.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.url}
                          </TableCell>
                          <TableCell align="right">{item.count}</TableCell>
                          <TableCell align="right">
                            {Math.round((item.count / stats.totalEntries) * 100)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Language Distribution */}
            <Grid item xs={12} md={6}>
              <Paper className={classes.dashboardPaper}>
                <Typography variant="h6" gutterBottom>
                  Distribuzione linguistica
                </Typography>
                {stats.languageDistribution.map((item, index) => (
                  <Box key={index} mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{item.language}</Typography>
                      <Chip 
                        label={`${item.count} (${Math.round((item.count / stats.totalEntries) * 100)}%)`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(item.count / stats.totalEntries) * 100}
                      style={{ marginTop: 4 }}
                    />
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Daily Activity */}
            <Grid item xs={12} md={6}>
              <Paper className={classes.dashboardPaper}>
                <Typography variant="h6" gutterBottom>
                  Attività giornaliera
                </Typography>
                <TableContainer className={classes.tableContainer}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell align="right">Audit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.dailyStats.slice(-10).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell align="right">
                            <Chip label={item.count} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Raw Data Table */}
          <Paper className={classes.dashboardPaper} style={{ marginTop: 24 }}>
            <Typography variant="h6" gutterBottom>
              Dati grezzi (ultimi 20)
            </Typography>
            <TableContainer className={classes.tableContainer}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Storage (KB)</TableCell>
                    <TableCell>Viewport</TableCell>
                    <TableCell>Lingua</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditData.slice(0, 20).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(item.timestamp).toLocaleString('it-IT')}
                      </TableCell>
                      <TableCell style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.url}
                      </TableCell>
                      <TableCell>{Math.round(item.localStorageSize / 1024)}</TableCell>
                      <TableCell>{item.viewportSize}</TableCell>
                      <TableCell>{item.language}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box mt={3} textAlign="center">
            <Button 
              variant="outlined" 
              onClick={loadAuditData}
              disabled={loading}
            >
              Aggiorna Dati
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default AdminDashboard;
