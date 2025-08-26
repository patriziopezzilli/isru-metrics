import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton, TextField, Button, Paper } from '@material-ui/core';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, MailOutline as MailIcon } from '@material-ui/icons';
import { Dialog, DialogContent, DialogTitle, Tooltip } from '@material-ui/core';

interface Props {
  onSent?: () => void;
}

const CollapsibleFeedback: React.FC<Props> = ({ onSent }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        setSent(true);
        setOpen(false);
        if (onSent) onSent();
        setTimeout(() => {
          setSent(false);
          setMessage('');
        }, 2000);
      } else {
        alert('Error sending feedback. Please try again later.');
      }
    } catch (err) {
      alert('Network error. Please try again later.');
    }
  };

  return (
    <>
      <Tooltip title="Send feedback" placement="bottom">
        <IconButton size="small" style={{ color: '#8b7355', padding: 2, marginLeft: 6 }} onClick={() => setOpen(true)}>
          <MailIcon style={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontSize: '1rem', padding: '12px 16px', textAlign: 'center', color: '#8b7355' }}>
          Feedback & Suggestions
        </DialogTitle>
        <DialogContent style={{ padding: '8px 16px', minWidth: 220 }}>
          <Typography variant="body2" style={{ color: '#3c3530', marginBottom: 6, fontSize: '0.82rem', lineHeight: 1.2, textAlign: 'center' }}>
            Want to suggest a feature or improvement?<br />Your message will be sent to <b>patriziopezzilli@gmail.com</b>
          </Typography>
          <TextField
            multiline
            rows={2}
            variant="outlined"
            fullWidth
            placeholder="Type your suggestion..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ marginBottom: 8, fontSize: '0.82rem' }}
            InputProps={{ style: { fontSize: '0.82rem', padding: '4px 8px' } }}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            disabled={!message || sent}
            onClick={handleSend}
            style={{ backgroundColor: '#8b7355', color: 'white', borderRadius: 8, fontSize: '0.82rem', minWidth: 60, padding: '2px 10px', display: 'block', margin: '0 auto' }}
          >
            Send
          </Button>
          {sent && (
            <Typography variant="caption" style={{ color: '#6b7d5a', marginTop: 6, display: 'block', fontSize: '0.8rem', textAlign: 'center' }}>
              Message sent! Thank you for your feedback 🙏
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CollapsibleFeedback;