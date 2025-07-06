import React from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function SenderReceiverCell({ sender, receiver }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>{sender}</span>
      <ArrowForwardIcon fontSize="small" style={{ opacity: 0.7 }} />
      <span>{receiver}</span>
    </span>
  );
}
