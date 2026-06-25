'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Collapse,
  IconButton,
  Card,
  Chip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const MARKETING_NAV_ITEMS = [
  { label: 'Features', href: '/#core' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Showcase', href: '/#workflow' },
  { label: 'Docs', href: '/#workflow' },
];

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    description: 'For explorers and hobbyists getting started with animation.',
    features: ['Core Manim engine', 'Community support', 'Watermarked exports'],
    cta: 'Start for free',
    variant: 'dark',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 29,
    yearlyPrice: 23,
    description: 'For professionals and content creators who need power.',
    features: ['Everything in Free', 'No watermarks', 'Priority rendering', 'Premium assets'],
    cta: 'Get Pro Now',
    variant: 'light',
    popular: true,
  },
  {
    key: 'unlimited',
    name: 'Enterprise',
    price: 99,
    yearlyPrice: 79,
    description: 'For agencies and studios requiring high-volume scale.',
    features: ['Custom integrations', 'Team management', 'Dedicated account manager', 'SLA & Security'],
    cta: 'Choose Enterprise',
    variant: 'dark',
  },
];

const COMPARISON = [
  { feature: 'Rendering Resolution', free: '1080p', pro: '4K UHD', unlimited: '8K+' },
  { feature: 'Export Formats', free: 'MP4', pro: 'All Formats', unlimited: 'All Formats' },
  { feature: 'Cloud Storage', free: '1GB', pro: '100GB', unlimited: 'Unlimited' },
  { feature: 'Priority Queue', free: false, pro: true, unlimited: true },
  { feature: 'Collaboration Tools', free: false, pro: false, unlimited: true },
];

const FAQS = [
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Billing is outside the MVP, but the future subscription flow should keep self-service cancellation in account settings.',
  },
  {
    q: 'Do you offer a student discount?',
    a: 'The plan model can support education tiers after the core generation pipeline is stable.',
  },
  {
    q: 'What happens to my old renders if I upgrade?',
    a: 'Generation jobs keep their prompt, code, and video metadata, so upgraded rendering can re-use existing history.',
  },
  {
    q: 'Do you have an offline version?',
    a: 'The renderer is Dockerized, so local/offline execution is a natural enterprise extension.',
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.09), transparent 24%), radial-gradient(circle at 90% 6%, rgba(255, 255, 255, 0.07), transparent 24%)',
        }}
      />

      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(6, 8, 12, 0.86)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, minHeight: 66 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Box sx={{ width: 17, height: 17, borderRadius: 999, background: 'linear-gradient(135deg, #f8fafc, #8ea0b8)' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>2DManim</Typography>
            </Link>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
              {MARKETING_NAV_ITEMS.map((item) => (
                <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: item.label === 'Pricing' ? 'text.primary' : 'text.secondary',
                      fontWeight: item.label === 'Pricing' ? 600 : 400,
                      fontSize: '0.64rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      '&:hover': { color: 'text.primary' },
                    }}
                  >
                    {item.label}
                  </Typography>
                </Link>
              ))}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => router.push(user ? '/studio' : '/login')}>Login</Button>
              <Button variant="contained" onClick={() => router.push(user ? '/studio' : '/register')}>Get started</Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 9 } }}>
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="overline" color="text.secondary">Pricing</Typography>
          <Typography variant="h1" sx={{ mt: 1, mb: 2, textTransform: 'uppercase' }}>
            Choose your creative engine
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 620, mx: 'auto' }}>
            Plans are staged for the post-MVP billing layer, while the current Next.js app keeps the same polished marketing surface.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
            <Button variant={billing === 'monthly' ? 'contained' : 'outlined'} onClick={() => setBilling('monthly')}>Monthly</Button>
            <Button variant={billing === 'yearly' ? 'contained' : 'outlined'} onClick={() => setBilling('yearly')}>Yearly</Button>
          </Stack>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {PLANS.map((plan) => {
            const price = billing === 'yearly' ? plan.yearlyPrice : plan.price;
            const light = plan.variant === 'light';
            return (
              <Card
                key={plan.key}
                sx={{
                  p: 3,
                  position: 'relative',
                  background: light ? '#f8fafc' : 'linear-gradient(180deg, rgba(17, 22, 32, 0.95), rgba(10, 13, 19, 0.95))',
                  color: light ? '#0a0a0a' : 'text.primary',
                }}
              >
                {plan.popular && <Chip label="Most popular" sx={{ mb: 2, color: '#0a0a0a', borderColor: 'rgba(0,0,0,0.12)' }} />}
                <Typography variant="h4">{plan.name}</Typography>
                <Typography sx={{ my: 2 }} color={light ? 'rgba(0,0,0,0.62)' : 'text.secondary'}>{plan.description}</Typography>
                <Typography variant="h2" sx={{ mb: 2 }}>
                  ${price}<Typography component="span" color={light ? 'rgba(0,0,0,0.62)' : 'text.secondary'}>/mo</Typography>
                </Typography>
                <Stack spacing={1.25} sx={{ mb: 3 }}>
                  {plan.features.map((feature) => (
                    <Box key={feature} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CheckIcon fontSize="small" />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Button fullWidth variant={light ? 'contained' : 'outlined'} onClick={() => router.push(user ? '/studio' : '/register')}>
                  {plan.cta}
                </Button>
              </Card>
            );
          })}
        </Box>

        <Card sx={{ mt: 6, p: { xs: 2, md: 3 } }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Compare plans</Typography>
          <Stack spacing={1}>
            {COMPARISON.map((row) => (
              <Box
                key={row.feature}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1.4fr repeat(3, 1fr)' },
                  gap: 1,
                  p: 1.5,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Typography>{row.feature}</Typography>
                {(['free', 'pro', 'unlimited'] as const).map((key) => (
                  <Typography key={key} color="text.secondary">
                    {typeof row[key] === 'boolean' ? (row[key] ? 'Yes' : 'No') : row[key]}
                  </Typography>
                ))}
              </Box>
            ))}
          </Stack>
        </Card>

        <Card sx={{ mt: 4, p: { xs: 2, md: 3 } }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Questions</Typography>
          {FAQS.map((faq, index) => (
            <Box key={faq.q} sx={{ borderTop: index ? '1px solid rgba(255,255,255,0.08)' : 0, py: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                <Typography variant="h6">{faq.q}</Typography>
                <IconButton onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}><AddIcon /></IconButton>
              </Box>
              <Collapse in={expandedFaq === index}>
                <Typography color="text.secondary" sx={{ mt: 1 }}>{faq.a}</Typography>
              </Collapse>
            </Box>
          ))}
        </Card>
      </Container>
    </Box>
  );
}
