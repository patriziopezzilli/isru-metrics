import React from 'react';
import { Box } from '@material-ui/core';

interface ISRULogoProps {
  width?: number;
  height?: number;
  className?: string;
  animated?: boolean;
}

export const ISRULogo: React.FC<ISRULogoProps> = ({ 
  width = 200, 
  height = 120, 
  className,
  animated = true 
}) => {
  const gradientStyle = {
    fontFamily: "'Rocket Sharpie Bold', 'Arial Black', monospace",
    fontSize: width < 250 ? '32px' : '48px',
    fontWeight: 'bold' as const,
    letterSpacing: '4px',
    color: '#cc4a26',
    textShadow: '0 0 15px rgba(204, 74, 38, 0.4), 0 0 30px rgba(204, 74, 38, 0.2)',
    marginTop: '16px',
    marginBottom: '8px'
  };

  return (
    <Box 
      className={className} 
      style={{ 
        position: 'relative',
        width: width,
        height: height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      {/* Main ISRU Text */}
      <Box style={gradientStyle}>
        I.S.R.U
      </Box>

      {/* League Subtitle */}
      <Box
        style={{
          fontFamily: "'Arial', sans-serif",
          fontSize: width < 250 ? '12px' : '16px',
          fontWeight: '600',
          letterSpacing: '3px',
          color: '#b8860b',
          textShadow: '0 0 8px rgba(184, 134, 11, 0.4)',
          opacity: 0.9
        }}
      >
        LEAGUE
      </Box>
    </Box>
  );
};

export default ISRULogo;
