import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IconButton, Collapse, Box, Button } from '@mui/material';

export default function ExpandableRow({ children, expanded, onToggle, details, onRunAgent }) {
  return (
    <>
      <tr>
        {children}
        <td>
          <IconButton size="small" onClick={onToggle} aria-label="expand row">
            <ExpandMoreIcon style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
          </IconButton>
        </td>
      </tr>
      <tr>
        <td colSpan={children.length + 1} style={{ padding: 0, background: 'var(--bg-main)' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2 }}>
              {details}
              <Button
                variant="contained"
                color="primary"
                onClick={onRunAgent}
                sx={{ mt: 2 }}
              >
                Run Solution Agent
              </Button>
            </Box>
          </Collapse>
        </td>
      </tr>
    </>
  );
}
