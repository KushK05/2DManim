import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import toast from 'react-hot-toast';

export default function CodeViewer({ code }) {
  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 2 }}>
        <Box>
          <Typography variant="subtitle1">Manim Code</Typography>
          <Typography variant="body2" color="text.secondary">
            Copy and adapt the generated scene locally.
          </Typography>
        </Box>
        <Tooltip title="Copy code">
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{ border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.03)' }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Chip label="Python / Manim" size="small" sx={{ mb: 1.5 }} />
      <Box
        component="pre"
        sx={{
          p: 2.5,
          borderRadius: 4,
          bgcolor: '#09131c',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'auto',
          maxHeight: 400,
          fontSize: '0.85rem',
          lineHeight: 1.6,
          fontFamily: '"IBM Plex Mono", "SFMono-Regular", monospace',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <code>{code}</code>
      </Box>
    </Box>
  );
}
