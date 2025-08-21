import React from 'react';
import { Button, Paper, Typography, Box } from '@material-ui/core';
import { testDirectApiCall } from '../apiService';

const ApiTest: React.FC = () => {
  const handleTest = async () => {
    console.log('🚀 Starting Direct API Test...');
    await testDirectApiCall();
  };

  return (
    <Paper style={{ padding: 16, margin: 16 }}>
      <Typography variant="h6" gutterBottom>
        🧪 API Direct Call Test
      </Typography>
      <Typography variant="body2" style={{ marginBottom: 16 }}>
        Questo test verifica se possiamo chiamare l'API I.S.R.U direttamente senza proxy.
        Apri la Console del Browser (F12) per vedere i risultati.
      </Typography>
      <Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleTest}
          style={{ marginRight: 8 }}
        >
          🔬 Esegui Test Diretto
        </Button>
        <Typography variant="caption" display="block" style={{ marginTop: 8 }}>
          I risultati appariranno nella console del browser
        </Typography>
      </Box>
    </Paper>
  );
};

export default ApiTest;
