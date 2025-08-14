import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { Person, PersonAdd } from '@material-ui/icons';

interface UserProfileIconProps {
  hasProfile: boolean;
  onClick: () => void;
}

export const UserProfileIcon: React.FC<UserProfileIconProps> = ({
  hasProfile,
  onClick,
}) => {
  return (
    <Tooltip title={hasProfile ? "View Profile" : "Create Profile"}>
      <IconButton
        onClick={onClick}
        style={{
          color: '#8b7355',
          backgroundColor: 'rgba(139, 115, 85, 0.1)',
          marginLeft: '8px',
        }}
      >
        {hasProfile ? <Person /> : <PersonAdd />}
      </IconButton>
    </Tooltip>
  );
};
