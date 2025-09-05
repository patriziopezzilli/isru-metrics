import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  useMediaQuery, 
  useTheme,
  Card,
  CardContent,
  Chip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  FlightTakeoff as RocketIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  statusContainer: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a1a0a 100%)',
    borderBottom: '2px solid #ff6b35',
    borderTop: '1px solid rgba(255, 107, 53, 0.3)',
    padding: theme.spacing(3),
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.1), transparent)',
      animation: '$sweep 4s ease-in-out infinite',
    },
  },
  '@keyframes sweep': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' },
  },
  title: {
    color: '#ff6b35',
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
    marginBottom: theme.spacing(3),
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1rem',
      letterSpacing: '1px',
      marginBottom: theme.spacing(2),
    },
  },
  statusGrid: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: theme.spacing(1),
    flexWrap: 'nowrap',
    width: '100%',
    maxWidth: '640px',
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(0.8),
      maxWidth: '100%',
    },
  },
  statusButton: {
    flex: '1',
    minWidth: '140px',
    aspectRatio: '1',
    minHeight: '0',
    maxWidth: 'none',
    borderRadius: '12px',
    border: '2px solid #ff6b35',
    background: 'rgba(255, 107, 53, 0.1)',
    backdropFilter: 'blur(10px)',
    color: '#ffffff',
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
    fontSize: '1rem',
    textTransform: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(1.2),
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    boxShadow: '0 4px 15px rgba(255, 107, 53, 0.2)',
    boxSizing: 'border-box',
    '&:hover': {
      background: 'rgba(255, 107, 53, 0.2)',
      border: '2px solid #ff8a5b',
      boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)',
    },
    '&.completed': {
      background: 'rgba(76, 175, 80, 0.15)',
      border: '2px solid #4caf50',
      color: '#4caf50',
      cursor: 'default',
      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)',
      '&:hover': {
        background: 'rgba(76, 175, 80, 0.15)',
        border: '2px solid #4caf50',
        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)',
      },
    },
    '&:disabled': {
      opacity: 0.6,
      background: 'rgba(150, 150, 150, 0.1)',
      border: '2px solid rgba(150, 150, 150, 0.4)',
      color: 'rgba(255, 255, 255, 0.6)',
      cursor: 'not-allowed',
      '&:hover': {
        background: 'rgba(150, 150, 150, 0.1)',
        border: '2px solid rgba(150, 150, 150, 0.4)',
        boxShadow: '0 4px 15px rgba(150, 150, 150, 0.1)',
      },
    },
    [theme.breakpoints.down('sm')]: {
      minWidth: '85px',
      maxWidth: '85px',
      minHeight: '85px',
      maxHeight: '85px',
      fontSize: '0.8rem',
      gap: theme.spacing(0.8),
      borderRadius: '8px',
      padding: theme.spacing(1),
    },
  },
  statusLabel: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.3,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
    letterSpacing: '0.5px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8rem',
      letterSpacing: '0.2px',
    },
  },
  completedChip: {
    backgroundColor: '#4caf50',
    color: 'white',
    fontSize: '0.7rem',
    height: '20px',
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  confirmDialog: {
    '& .MuiDialog-paper': {
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      border: '2px solid #ff6b35',
      borderRadius: '16px',
    },
  },
  dialogTitle: {
    color: '#ff6b35',
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dialogContent: {
    color: '#ffffff',
    fontFamily: '"Courier New", monospace',
    textAlign: 'center',
    padding: theme.spacing(3),
  },
  confirmButton: {
    backgroundColor: '#ff6b35',
    color: '#ffffff',
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#e55a2b',
    },
  },
  cancelButton: {
    color: '#ff6b35',
    fontFamily: '"Courier New", monospace',
    fontWeight: 'bold',
  },
  missionInfo: {
    color: '#cccccc',
    fontFamily: '"Courier New", monospace',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginTop: theme.spacing(3),
    opacity: 0.8,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
      marginTop: theme.spacing(2.5),
    },
  },
}));

interface MarsYardStatus {
  waitingRoom: boolean;
  checkoutReceived: boolean;
  orderShipped: boolean;
  orderReceived: boolean;
}

interface StatusButtonProps {
  label: string;
  completed: boolean;
  onClick: () => void;
  disabled?: boolean;
  count?: number;
}

const StatusButton: React.FC<StatusButtonProps> = ({ label, completed, onClick, disabled = false, count = 0 }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Dividi il label in due righe se contiene uno spazio
  const labelParts = label.includes(' ') ? label.split(' ') : [label];
  
  return (
    <Box position="relative">
      <Button
        className={`${classes.statusButton} ${completed ? 'completed' : ''}`}
        onClick={onClick}
        disabled={disabled || completed}
      >
        <Box className={classes.statusLabel}>
          <Box style={{ 
            height: isMobile ? '45px' : '60px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {labelParts.map((part, index) => (
              <Typography key={index} component="div" style={{ 
                fontSize: 'inherit', 
                fontWeight: 'inherit',
                marginBottom: index < labelParts.length - 1 ? '2px' : '0'
              }}>
                {part}
              </Typography>
            ))}
          </Box>
          <Typography component="div" style={{ 
            fontSize: isMobile ? '0.75rem' : '0.9rem', 
            fontWeight: 'bold', 
            opacity: 1, 
            marginTop: isMobile ? '6px' : '10px',
            color: completed ? '#4caf50' : '#ffcc02',
            lineHeight: 1.2,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)'
          }}>
            {count} users
          </Typography>
        </Box>
      </Button>
      {completed && (
        <Chip
          label="✓"
          className={classes.completedChip}
          size="small"
        />
      )}
    </Box>
  );
};

export const MarsYardStatusTracker: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [status, setStatus] = useState<MarsYardStatus>({
    waitingRoom: false,
    checkoutReceived: false,
    orderShipped: false,
    orderReceived: false,
  });

  const [stats, setStats] = useState({
    waitingRoom: 0,
    checkoutReceived: 0,
    orderShipped: 0,
    orderReceived: 0,
    totalUsers: 0,
  });
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: keyof MarsYardStatus | null;
    title: string;
    message: string;
  }>({
    open: false,
    action: null,
    title: '',
    message: '',
  });

  // Carica lo stato dal sessionStorage
  useEffect(() => {
    console.log('🚀 MarsYardStatusTracker useEffect triggered');
    
    const savedStatus = sessionStorage.getItem('marsYardStatus');
    console.log('📱 Saved status from sessionStorage:', savedStatus);
    
    if (savedStatus) {
      try {
        const parsedStatus = JSON.parse(savedStatus);
        console.log('📱 Parsed status:', parsedStatus);
        setStatus(parsedStatus);
      } catch (error) {
        console.error('❌ Error loading Mars Yard status:', error);
      }
    }
    
    // Carica le statistiche
    console.log('📊 Calling fetchStats...');
    fetchStats();
    
    // Sincronizza i dati con MongoDB se necessario
    console.log('🔄 Calling syncUserDataIfNeeded...');
    syncUserDataIfNeeded();
  }, []);

  // Funzione per sincronizzare i dati utente se non esistono su MongoDB
  const syncUserDataIfNeeded = async () => {
    const username = localStorage.getItem('isru-username');
    const savedStatus = sessionStorage.getItem('marsYardStatus');
    
    console.log('🔄 Sync check - username:', username, 'savedStatus exists:', !!savedStatus);
    
    if (!username || username === 'anonymous' || !savedStatus) {
      console.log('⏭️ Skipping sync - no username or saved status');
      return; // Niente da sincronizzare
    }

    try {
      console.log('🔍 Checking if user has existing data on MongoDB...');
      // Verifica se l'utente ha già dati su MongoDB
      const checkResponse = await fetch(`/api/mars-yard-user-status?username=${encodeURIComponent(username)}`);
      console.log('🔍 User status check response:', checkResponse.status);
      
      if (checkResponse.status === 404) {
        // L'utente non ha dati su MongoDB, sincronizza dal sessionStorage
        console.log('📤 User data not found on MongoDB, syncing from sessionStorage...');
        
        const localStatus = JSON.parse(savedStatus);
        console.log('📤 Local status to sync:', localStatus);
        
        await saveStatusToMongoDB(localStatus);
        
        console.log('✅ User data synced successfully');
      } else if (checkResponse.ok) {
        console.log('✅ User data already exists on MongoDB');
      } else {
        console.error('❌ Error checking user status:', checkResponse.status, checkResponse.statusText);
        const errorText = await checkResponse.text();
        console.error('❌ Error response body:', errorText);
      }
    } catch (error) {
      console.error('❌ Error syncing user data:', error);
    }
  };

  // Funzione per recuperare le statistiche
  const fetchStats = async () => {
    try {
      console.log('🔄 Fetching Mars Yard statistics...');
      const response = await fetch('/api/mars-yard-stats');
      console.log('📊 Stats API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats API response data:', data);
        
        if (data.success) {
          setStats(data.stats);
          console.log('✅ Stats updated successfully:', data.stats);
        } else {
          console.error('❌ Stats API returned success: false');
        }
      } else {
        console.error('❌ Stats API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching Mars Yard stats:', error);
    }
  };

  // Funzione separata per salvare su MongoDB
  const saveStatusToMongoDB = async (statusToSave: MarsYardStatus) => {
    const username = localStorage.getItem('isru-username') || 'anonymous';
    const payload = {
      username,
      status: statusToSave,
      timestamp: new Date().toISOString(),
    };
    
    console.log('💾 Sending Mars Yard status with username:', username);
    console.log('💾 Full payload:', payload);
    
    const response = await fetch('/api/mars-yard-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to save Mars Yard status to MongoDB:', response.status, errorData);
      throw new Error(`Failed to save status: ${response.status}`);
    } else {
      console.log('Mars Yard status saved successfully');
    }
  };

  // Salva lo stato nel sessionStorage e invia a MongoDB
  const updateStatus = async (newStatus: MarsYardStatus) => {
    setStatus(newStatus);
    sessionStorage.setItem('marsYardStatus', JSON.stringify(newStatus));
    
    // Invia a MongoDB
    try {
      await saveStatusToMongoDB(newStatus);
      // Ricarica le statistiche dopo aver salvato
      fetchStats();
    } catch (error) {
      console.error('Error saving Mars Yard status:', error);
    }
  };

  const handleStatusClick = (action: keyof MarsYardStatus) => {
    if (status[action]) return; // Già completato
    
    const titles = {
      waitingRoom: 'Confirm Waiting Room',
      checkoutReceived: 'Confirm Checkout Link Received',
      orderShipped: 'Confirm Order Shipped',
      orderReceived: 'Confirm Order Received',
    };
    
    const messages = {
      waitingRoom: 'Are you in the waiting room for Mars Yard 3.0? :)',
      checkoutReceived: 'Have you received the checkout link for Mars Yard 3.0?',
      orderShipped: 'Has your Mars Yard 3.0 order been shipped?',
      orderReceived: 'Have you received your Mars Yard 3.0 order?',
    };
    
    setConfirmDialog({
      open: true,
      action,
      title: titles[action],
      message: messages[action],
    });
  };

  const handleConfirm = () => {
    if (confirmDialog.action) {
      const newStatus = {
        ...status,
        [confirmDialog.action]: true,
      };
      updateStatus(newStatus);
    }
    setConfirmDialog({ open: false, action: null, title: '', message: '' });
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false, action: null, title: '', message: '' });
  };

  const getCompletedCount = () => {
    return Object.values(status).filter(Boolean).length;
  };

  return (
    <Box className={classes.statusContainer}>
      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        className={classes.title}
      >
        🚀 Mars Yard 3.0 Mission Status 🚀
      </Typography>
      
      <Box className={classes.statusGrid}>
        <StatusButton
          label="WAITING ROOM"
          completed={status.waitingRoom}
          onClick={() => handleStatusClick('waitingRoom')}
          count={stats.waitingRoom}
        />
        
        <StatusButton
          label="CHECKOUT LINK"
          completed={status.checkoutReceived}
          onClick={() => handleStatusClick('checkoutReceived')}
          disabled={!status.waitingRoom}
          count={stats.checkoutReceived}
        />
        
        <StatusButton
          label="SHIPPED"
          completed={status.orderShipped}
          onClick={() => handleStatusClick('orderShipped')}
          disabled={!status.checkoutReceived}
          count={stats.orderShipped}
        />
        
        <StatusButton
          label="RECEIVED"
          completed={status.orderReceived}
          onClick={() => handleStatusClick('orderReceived')}
          disabled={!status.orderShipped}
          count={stats.orderReceived}
        />
      </Box>
      
      <Typography className={classes.missionInfo}>
        Mission Progress: {getCompletedCount()}/4 milestones completed
        {getCompletedCount() === 4 && ' - 🎉 MISSION COMPLETE! 🎉'}
      </Typography>

      {/* Dialog di conferma */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancel}
        className={classes.confirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className={classes.dialogTitle}>
          <RocketIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <Typography>
            {confirmDialog.message}
          </Typography>
          <Typography style={{ marginTop: 16, fontSize: '0.8rem', opacity: 0.7 }}>
            ⚠️ This action cannot be undone
          </Typography>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center', padding: 16 }}>
          <Button onClick={handleCancel} className={classes.cancelButton}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className={classes.confirmButton} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarsYardStatusTracker;
