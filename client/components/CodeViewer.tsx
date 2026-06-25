'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import toast from 'react-hot-toast';

export default function CodeViewer({ code }: { code: string | null }) {
  if (!code) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
        <Typography variant="h6">Manim code</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContentCopyRoundedIcon />}
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            toast.success('Code copied');
          }}
        >
          Copy
        </Button>
      </Stack>
      <Box
        component="pre"
        sx={{
          overflow: 'auto',
          m: 0,
          p: 2,
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(0,0,0,0.35)',
          color: '#dbeafe',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 13,
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}
      >
        {code}
      </Box>
    </Box>
  );
}
