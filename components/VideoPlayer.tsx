'use client';

import { Box } from '@mui/material';

export default function VideoPlayer({ url }: { url: string }) {
  return (
    <Box
      component="video"
      src={url}
      controls
      sx={{
        width: '100%',
        maxHeight: 520,
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        bgcolor: 'black',
      }}
    />
  );
}
