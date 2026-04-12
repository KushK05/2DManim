import { Box, Typography } from '@mui/material';

export default function VideoPlayer({ url }) {
  if (!url) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Rendered Video
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Review the motion, pacing, and readability before exporting.
      </Typography>
      <Box
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          bgcolor: '#000',
          boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
        }}
      >
        <video
          controls
          autoPlay
          style={{ width: '100%', display: 'block' }}
          src={url}
        />
      </Box>
    </Box>
  );
}
