import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Box,
  Chip,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { useNavigate } from 'react-router-dom';
import { historyAPI } from '../api/endpoints';
import VideoPlayer from '../components/VideoPlayer';
import CodeViewer from '../components/CodeViewer';

export default function History() {
  const [generations, setGenerations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await historyAPI.list(page, 10);
      setGenerations(data.generations);
      setPagination(data.pagination);
    } catch {
      setError('Could not load generation history right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const statusColor = {
    completed: 'success',
    failed: 'error',
    pending: 'warning',
    generating: 'info',
    rendering: 'info',
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
      <Card sx={{ mb: 3 }} className="fade-in">
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Chip label="History" sx={{ mb: 2 }} />
              <Typography variant="h3" sx={{ mb: 1 }}>
                Every generation in one reviewable feed.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Reopen prompts, inspect Manim code, and compare outputs without losing the context of when each scene was created.
              </Typography>
            </Box>
            <Chip label={`${generations.length} loaded`} />
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : generations.length === 0 ? (
        <Card sx={{ textAlign: 'center' }}>
          <CardContent sx={{ py: 7 }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>
              No generations yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Start with a new prompt and your outputs will show up here for replay and inspection.
            </Typography>
            <Button variant="contained" endIcon={<ArrowOutwardRoundedIcon />} onClick={() => navigate('/studio')}>
              Open generator
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {generations.map((gen) => (
            <Card key={gen._id} sx={{ mb: 2 }} className="fade-in">
              <CardActionArea onClick={() => setSelected(gen)}>
                <CardContent
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: 2,
                    flexDirection: { xs: 'column', md: 'row' },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {gen.prompt}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={gen.model} size="small" />
                      <Chip
                        label={gen.videoUrl ? 'Video available' : 'Code only'}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        {new Date(gen.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Open" size="small" variant="outlined" />
                    <Chip label={gen.status} color={statusColor[gen.status] || 'default'} size="small" />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}

          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(_, page) => fetchHistory(page)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {selected.prompt}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selected.model} · {new Date(selected.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelected(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
              {selected.videoUrl && <VideoPlayer url={selected.videoUrl} />}
              <CodeViewer code={selected.manimCode} />
              {selected.error && (
                <Typography color="error" mt={2}>Error: {selected.error}</Typography>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}
