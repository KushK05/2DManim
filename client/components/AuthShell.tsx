'use client';

import {
  Box,
  Card,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded';
import type { ReactNode } from 'react';

const HIGHLIGHTS = [
  {
    icon: <AutoAwesomeRoundedIcon fontSize="small" />,
    title: 'Prompt with intent',
    description: 'Describe the scene, pacing, and visual style to get more usable outputs on the first pass.',
  },
  {
    icon: <FunctionsRoundedIcon fontSize="small" />,
    title: 'Code stays editable',
    description: 'Every result includes Manim code, so you can refine the math, timing, and composition afterward.',
  },
  {
    icon: <PlayCircleOutlineRoundedIcon fontSize="small" />,
    title: 'Preview faster',
    description: 'Switch between code-only and rendered video depending on whether you want iteration speed or a final cut.',
  },
];

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          minHeight: { xs: 'auto', md: 'calc(100vh - 48px)' },
          display: 'grid',
          gap: 3,
          alignItems: 'center',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
        }}
      >
        <Box sx={{ maxWidth: 560 }} className="fade-in">
          <Chip
            label="2DManim Studio"
            sx={{
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.03)',
              color: 'text.primary',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <Typography variant="h1" sx={{ maxWidth: 520, mb: 2 }}>
            Turn math prompts into clean motion design.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
            Build explainers, visual proofs, and classroom demos with AI-generated Manim scenes that still feel like yours.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
            {[
              { label: 'Prompt to scene', value: 'Minutes' },
              { label: 'Rendered output', value: 'Video + code' },
              { label: 'Best for', value: 'Education' },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="float-slow"
                sx={{
                  flex: 1,
                  p: 2.25,
                  background: 'linear-gradient(180deg, rgba(17, 22, 32, 0.96), rgba(10, 13, 19, 0.96))',
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h5">{stat.value}</Typography>
              </Card>
            ))}
          </Stack>

          <Stack spacing={1.5} sx={{ mt: 4 }}>
            {HIGHLIGHTS.map((item) => (
              <Box
                key={item.title}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                  p: 2,
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(14, 17, 23, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '14px',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'text.primary',
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        <Card sx={{ p: { xs: 3, md: 4 }, maxWidth: 520, width: '100%', justifySelf: 'end' }} className="fade-in">
          <Chip
            label={eyebrow}
            sx={{
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
              color: 'text.primary',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <Typography variant="h3" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />
          <Typography variant="body2" color="text.secondary">
            {footer}
          </Typography>
        </Card>
      </Box>
    </Container>
  );
}
