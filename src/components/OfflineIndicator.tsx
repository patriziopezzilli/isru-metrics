import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@material-ui/core';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import OfflineService from '../services/offlineService';

const useStyles = makeStyles(() => ({
  offlineChip: {
    backgroundColor: '#f44336',
    color: 'white',
    fontWeight: 'bold',
  },
  onlineChip: {
    backgroundColor: '#4caf50',
    color: 'white',
    fontWeight: 'bold',
  },
  slowChip: {
    backgroundColor: '#ff9800',
    color: 'white',
    fontWeight: 'bold',
  },
  dialog: {
    '& .MuiDialog-paper': {
      backgroundColor: '#f5f1eb',
      borderRadius: '12px',
    },
  },
  dialogTitle: {
    backgroundColor: '#e0dfca',
    color: '#8b7355',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#8b7355',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#6d5a42',
    },
    borderRadius: '8px',
  },
  secondaryButton: {
    color: '#8b7355',
    borderColor: '#8b7355',
    '&:hover': {
      backgroundColor: '#f5f1eb',
    },
    borderRadius: '8px',
  },
}));

interface OfflineIndicatorProps {
  onSync?: () => Promise<void>;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSync }) => {
  const classes = useStyles();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [offlineData, setOfflineData] = useState<any>(null);
  const [dataSize, setDataSize] = useState({ localStorage: 0, sessionStorage: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Setup offline/online listeners
    const cleanup = OfflineService.setupOfflineListeners(
      () => {
        setIsOnline(true);
        handleAutoSync();
      },
      () => setIsOnline(false)
    );

    // Update connection info periodically
    const interval = setInterval(updateConnectionInfo, 5000);
    updateConnectionInfo();

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const updateConnectionInfo = () => {
    const status = OfflineService.getConnectionStatus();
    setConnectionInfo(status);
    setIsOnline(status.isOnline);

    // Update offline data info
    const data = OfflineService.loadOfflineData();
    setOfflineData(data);

    const size = OfflineService.getOfflineDataSize();
    setDataSize(size);
  };

  const handleAutoSync = async () => {
    if (onSync && isOnline) {
      setIsSyncing(true);
      try {
        await OfflineService.syncData(onSync);
      } catch (error) {
        console.error('Auto-sync failed:', error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleManualSync = async () => {
    if (onSync) {
      setIsSyncing(true);
      try {
        await onSync();
        updateConnectionInfo();
      } catch (error) {
        console.error('Manual sync failed:', error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleClearCache = () => {
    OfflineService.clearOfflineData();
    updateConnectionInfo();
  };

  const handleExportData = () => {
    const data = OfflineService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isru-league-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConnectionText = () => {
    if (!isOnline) return 'Offline';
    
    if (OfflineService.shouldUseOfflineData()) {
      return 'Slow Connection';
    }
    
    if (connectionInfo?.effectiveType) {
      return `Online (${connectionInfo.effectiveType.toUpperCase()})`;
    }
    
    return 'Online';
  };

  const getConnectionIcon = () => {
    return isOnline ? <OnlineIcon fontSize="small" /> : <OfflineIcon fontSize="small" />;
  };

  const getChipClass = () => {
    if (!isOnline) return classes.offlineChip;
    if (OfflineService.shouldUseOfflineData()) return classes.slowChip;
    return classes.onlineChip;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderDetailsDialog = () => (
    <Dialog
      open={showDetails}
      onClose={() => setShowDetails(false)}
      className={classes.dialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className={classes.dialogTitle}>
        📶 Connection & Offline Mode
      </DialogTitle>
      
      <DialogContent>
        <List>
          <ListItem>
            <ListItemIcon>
              {getConnectionIcon()}
            </ListItemIcon>
            <ListItemText
              primary="Connection Status"
              secondary={getConnectionText()}
            />
          </ListItem>

          {connectionInfo && connectionInfo.rtt && (
            <ListItem>
              <ListItemIcon>
                <SyncIcon />
              </ListItemIcon>
              <ListItemText
                primary="Network Latency"
                secondary={`${connectionInfo.rtt}ms`}
              />
            </ListItem>
          )}

          {connectionInfo && connectionInfo.downlink && (
            <ListItem>
              <ListItemIcon>
                <DownloadIcon />
              </ListItemIcon>
              <ListItemText
                primary="Download Speed"
                secondary={`${connectionInfo.downlink} Mbps`}
              />
            </ListItem>
          )}

          <Divider />

          <ListItem>
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText
              primary="Offline Data Size"
              secondary={`Local: ${formatBytes(dataSize.localStorage)} • Session: ${formatBytes(dataSize.sessionStorage)}`}
            />
          </ListItem>

          {offlineData && (
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText
                primary="Last Update"
                secondary={new Date(offlineData.lastUpdate).toLocaleString()}
              />
            </ListItem>
          )}
        </List>

        <Box mt={2}>
          <Typography variant="h6" style={{ color: '#8b7355', marginBottom: 8 }}>
            Actions
          </Typography>
          
          <Box display="flex" flexDirection="column" style={{ gap: '8px' }}>
            <Button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
              className={classes.button}
              startIcon={<SyncIcon />}
              fullWidth
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            
            <Button
              onClick={handleExportData}
              disabled={!offlineData}
              className={classes.secondaryButton}
              variant="outlined"
              startIcon={<DownloadIcon />}
              fullWidth
            >
              Export Backup
            </Button>
            
            <Button
              onClick={handleClearCache}
              disabled={!offlineData}
              style={{ color: '#f44336', borderColor: '#f44336' }}
              variant="outlined"
              startIcon={<DeleteIcon />}
              fullWidth
            >
              Clear Offline Data
            </Button>
          </Box>
        </Box>

        <Box mt={2} p={2} style={{ backgroundColor: '#e3f2fd', borderRadius: 8 }}>
          <Typography variant="body2" style={{ color: '#1976d2', fontSize: '0.85rem' }}>
            💡 <strong>Offline Mode:</strong> When offline or on slow connections, 
            the app automatically uses cached data. Data is synced when connection improves.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setShowDetails(false)} className={classes.button}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <Tooltip title="Click for connection details">
        <Chip
          icon={getConnectionIcon()}
          label={getConnectionText()}
          onClick={() => setShowDetails(true)}
          className={getChipClass()}
          size="small"
          style={{ cursor: 'pointer' }}
        />
      </Tooltip>
      
      {renderDetailsDialog()}
    </Box>
  );
};
