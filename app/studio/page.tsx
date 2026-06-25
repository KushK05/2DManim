'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import MovieCreationRoundedIcon from '@mui/icons-material/MovieCreationRounded';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ModelSelector from '@/components/ModelSelector';
import VideoPlayer from '@/components/VideoPlayer';
import CodeViewer from '@/components/CodeViewer';
import { apiFetch, type Generation, type Message } from '@/lib/clientApi';
import { useAuth } from '@/components/AuthProvider';

const EXAMPLE_PROMPTS = [
  'Animate a tangent line moving across a parabola while the slope updates live.',
  'Explain matrix multiplication with transforming colored vectors on a grid.',
  'Show Euler’s formula on the complex plane with rotating vectors and labels.',
];

type Model = {
  key: string;
  name?: string;
  provider?: string;
};

const terminalStatuses = new Set(['COMPLETED', 'FAILED_PERMANENT', 'DEAD_LETTER_QUEUE', 'CANCELLED']);

export default function StudioPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [renderVideo, setRenderVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Generation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const pollTimeoutRef = useRef<number | null>(null);
  const { user, loading: authLoading } = useAuth();

  const trimmedPrompt = prompt.trim();
  const promptSuggestion = useMemo(() => (
    EXAMPLE_PROMPTS.find((example) => (
      !trimmedPrompt
        ? example === EXAMPLE_PROMPTS[0]
        : example.toLowerCase().startsWith(trimmedPrompt.toLowerCase()) && example !== trimmedPrompt
    )) || ''
  ), [trimmedPrompt]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, router, user]);

  useEffect(() => () => {
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        const data = await apiFetch<{ models: Model[] }>('/api/models');
        if (mounted) {
          setModels(data.models);
          setModel(data.models[0]?.key || 'gemini-2.5-flash');
        }
      } catch {
        if (mounted) {
          setModels([]);
          setModel('gemini-2.5-flash');
        }
      }
    };

    loadModels();
    return () => {
      mounted = false;
    };
  }, []);

  const pollJob = async (jobId: string) => {
    const data = await apiFetch<{ generation: Generation; messages: Message[] }>(`/api/jobs/${jobId}`);
    setResult(data.generation);
    setMessages(data.messages);
    setStatus(`Job status: ${data.generation.status}`);

    if (!terminalStatuses.has(data.generation.status)) {
      pollTimeoutRef.current = window.setTimeout(() => {
        pollJob(jobId).catch((err) => {
          setError(err instanceof Error ? err.message : 'Could not refresh job status');
          setLoading(false);
        });
      }, 1100);
      return;
    }

    setLoading(false);
    if (data.generation.status === 'COMPLETED') {
      toast.success('Generation complete!');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !model) return;

    setLoading(true);
    setError('');
    setResult(null);
    setMessages([]);
    setStatus('Creating queued generation job...');
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    try {
      const data = await apiFetch<{ jobId: string; status: string; assistantMessageId: string }>('/api/generations', {
        method: 'POST',
        body: JSON.stringify({ prompt, model, renderVideo }),
      });
      setStatus(`Job status: ${data.status}`);
      toast.success('Job queued');
      await pollJob(data.jobId);
    } catch (err) {
      const summary = err instanceof Error ? err.message : 'Generation failed';
      setError(summary);
      toast.error(summary);
      setLoading(false);
    }
  };

  const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab' && promptSuggestion) {
      event.preventDefault();
      setPrompt(promptSuggestion);
    }
  };

  if (authLoading || !user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
      <Box
        className="fade-in"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1.35fr 0.9fr' },
          gap: 3,
          mb: 4,
        }}
      >
        <Card sx={{ overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Chip
              label="Creative studio"
              sx={{
                mb: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
                color: 'text.primary',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <Typography variant="h2" sx={{ maxWidth: 760, mb: 1.5 }}>
              Generate sharper 2D math animations from a single prompt.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mb: 3 }}>
              Describe the concept, pick the model, and create an asynchronous generation job with trackable progress.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} flexWrap="wrap" useFlexGap>
              {EXAMPLE_PROMPTS.map((example) => (
                <Chip
                  key={example}
                  label={example}
                  onClick={() => setPrompt(example)}
                  icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    maxWidth: '100%',
                    justifyContent: 'flex-start',
                    px: 1,
                    py: 2.25,
                    height: 'auto',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                    },
                  }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {[
            {
              label: 'Credits left',
              value: `${user?.credits ?? 0}`,
              icon: <BoltRoundedIcon fontSize="small" />,
            },
            {
              label: 'Active plan',
              value: (user?.plan || 'free').toUpperCase(),
              icon: <AutoAwesomeRoundedIcon fontSize="small" />,
            },
            {
              label: 'Output mode',
              value: renderVideo ? 'Queued render' : 'Code-ready job',
              icon: <MovieCreationRoundedIcon fontSize="small" />,
            },
          ].map((item) => (
            <Grid item xs={12} sm={4} xl={12} key={item.label}>
              <Card className="float-slow">
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'primary.main' }}>
                    {item.icon}
                    <Typography variant="overline" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="h4">{item.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} lg={8}>
          <Card className="fade-in">
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4" sx={{ mb: 0.5 }}>
                    Prompt workspace
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Include subject, camera flow, labels, and the sequence of visual beats you want animated.
                  </Typography>
                </Box>
                <Chip label={`${prompt.length}/2000`} />
              </Box>

              <TextField
                fullWidth
                multiline
                minRows={8}
                label="Describe your animation"
                placeholder="Show the Pythagorean theorem with a right triangle, animated squares on each side, and a final area equality reveal."
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handlePromptKeyDown}
                inputProps={{ maxLength: 2000 }}
                helperText={promptSuggestion
                  ? `Press Tab to accept the suggestion: ${promptSuggestion}`
                  : 'Write your own prompt, or choose an example chip above to fill the editor.'}
              />

              {promptSuggestion && (
                <Box
                  sx={{
                    mt: 1.5,
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 2,
                    border: '1px dashed rgba(255,255,255,0.14)',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 1.5,
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Suggested completion
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Press Tab to fill the prompt with the suggested text.
                    </Typography>
                  </Box>
                  <Chip label="Use suggestion" clickable onClick={() => setPrompt(promptSuggestion)} />
                </Box>
              )}

              <Box
                sx={{
                  mt: 3,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 1fr) auto auto' },
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                <ModelSelector value={model} onChange={setModel} models={models} />
                <FormControlLabel
                  control={<Switch checked={renderVideo} onChange={(event) => setRenderVideo(event.target.checked)} />}
                  label="Render video"
                />
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim() || !model}
                >
                  {loading ? 'Generating...' : 'Generate Scene'}
                </Button>
              </Box>

              {status && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  {status}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card className="fade-in">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Better prompts, better scenes
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    'State the core math concept and the audience level.',
                    'Mention the order of reveals, transforms, or highlights.',
                    'Call out labels, color emphasis, and whether narration timing matters.',
                  ].map((tip) => (
                    <Box key={tip} sx={{ display: 'flex', gap: 1.25 }}>
                      <Chip label="Tip" size="small" color="secondary" />
                      <Typography variant="body2" color="text.secondary">
                        {tip}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card className="fade-in">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Current setup
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Model
                    </Typography>
                    <Typography variant="body1">{model}</Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Delivery
                    </Typography>
                    <Typography variant="body1">
                      {renderVideo ? 'Queued render plus Manim code' : 'Code-first output for faster iteration'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      {messages.length > 0 && (
        <Card sx={{ mt: 4 }} className="fade-in">
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Chat transcript
            </Typography>
            <Stack spacing={1.5}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: message.role === 'USER' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <Typography variant="overline" color="text.secondary">{message.role}</Typography>
                  <Typography variant="body2">{message.content}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card sx={{ mt: 4 }} className="fade-in">
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" sx={{ mb: 0.75 }}>
              Generated output
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review the rendered result, copy the Manim code, and iterate with a tighter follow-up prompt if needed.
            </Typography>
            {result.videoUrl && <VideoPlayer url={result.videoUrl} />}
            <CodeViewer code={result.manimCode} />
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
