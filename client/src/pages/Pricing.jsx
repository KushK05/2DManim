import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Collapse,
  IconButton,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { billingAPI } from '../api/endpoints';
import toast from 'react-hot-toast';

const FALLBACK_PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    description: 'For explorers and hobbyists getting started with animation.',
    features: ['Core Manim engine', 'Community support', 'Watermarked exports'],
    featureDimmed: [false, false, true],
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
    featureDimmed: [],
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
    featureDimmed: [],
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
    a: 'Yes, you can cancel your subscription at any time from your account settings. You will continue to have access to your plan features until the end of your current billing period.',
  },
  {
    q: 'Do you offer a student discount?',
    a: 'Yes! We offer a 50% discount for verified students. Contact our support team with your student email to get started.',
  },
  {
    q: 'What happens to my watermarked videos if I upgrade?',
    a: 'When you upgrade to Pro or Enterprise, you can re-render any previous animations without watermarks at no additional cost.',
  },
  {
    q: 'Do you have an offline version?',
    a: 'Currently 2DManim is a cloud-based platform. We are exploring offline capabilities for Enterprise customers in a future release.',
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [loading, setLoading] = useState('');
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const localMode = searchParams.get('local') === '1';

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      try {
        const { data } = await billingAPI.plans();
        const apiPlans = data?.plans || {};
        const normalized = FALLBACK_PLANS.map((plan) => {
          const apiPlan = apiPlans[plan.key];
          if (!apiPlan || typeof apiPlan.price !== 'number') {
            return plan;
          }
          const yearlyPrice = apiPlan.price === 0 ? 0 : Math.round(apiPlan.price * 0.8);
          return {
            ...plan,
            price: apiPlan.price,
            yearlyPrice,
          };
        });
        if (mounted) {
          setPlans(normalized);
        }
      } catch {
        if (mounted) {
          setPlans(FALLBACK_PLANS);
        }
      }
    };

    loadPlans();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (success && user) {
      refreshUser().catch(() => {});
    }
  }, [success, user, refreshUser]);

  const handleCheckout = async (planKey) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(planKey);
    try {
      const { data } = await billingAPI.checkout(planKey);
      if (data?.local) {
        await refreshUser();
        toast.success('Plan updated');
        navigate('/pricing?success=true&local=1', { replace: true });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      await refreshUser();
      toast.success('Plan updated');
    } catch {
      toast.error('Failed to start checkout');
    } finally {
      setLoading('');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background gradient */}
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

      {/* Navbar */}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1,
              minHeight: 66,
            }}
          >
            <Box
              onClick={() => navigate('/')}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            >
              <Box
                sx={{
                  width: 17,
                  height: 17,
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #f8fafc, #8ea0b8)',
                }}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontFamily: '"Space Grotesk", "IBM Plex Mono", sans-serif',
                }}
              >
                2DManim
              </Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
              {['Features', 'Pricing', 'Showcase', 'Docs'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{
                    cursor: 'pointer',
                    color: item === 'Pricing' ? 'text.primary' : 'text.secondary',
                    fontWeight: item === 'Pricing' ? 600 : 400,
                    fontSize: '0.64rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    '&:hover': { color: 'text.primary' },
                    transition: 'color 200ms',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate(user ? '/studio' : '/register')}
              sx={{ px: 3, minHeight: 38 }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', pt: { xs: 8, md: 12 }, pb: { xs: 4, md: 6 } }}>
            <Typography
              variant="h1"
              className="fade-in"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem', lg: '4.5rem' },
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                mb: 3,
              }}
            >
              Simple, transparent pricing
            </Typography>
            <Typography
              variant="body1"
              className="fade-in"
              sx={{
                color: 'text.secondary',
                maxWidth: 520,
                mx: 'auto',
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                lineHeight: 1.6,
              }}
            >
              Choose the plan that works best for your creative workflow. Scale as you
              grow from hobbyist to studio professional.
            </Typography>
          </Box>

          {/* Billing Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 5, md: 7 } }} className="fade-in">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                bgcolor: 'rgba(255,255,255,0.06)',
                borderRadius: 999,
                p: 0.5,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {['monthly', 'yearly'].map((period) => (
                <Button
                  key={period}
                  onClick={() => setBilling(period)}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    minHeight: 40,
                    fontWeight: 600,
                    fontSize: '0.68rem',
                    color: billing === period ? '#0a0a0a' : '#8d99ae',
                    bgcolor: billing === period ? '#f8fafc' : 'transparent',
                    boxShadow: billing === period ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    '&:hover': {
                      bgcolor: billing === period ? '#ffffff' : 'rgba(255,255,255,0.06)',
                    },
                  }}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
              <Box
                sx={{
                  ml: 1,
                  mr: 0.5,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.5,
                  display: billing === 'yearly' ? 'block' : { xs: 'none', sm: 'block' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                  SAVE 20%
                </Typography>
              </Box>
            </Box>
          </Box>

          {(success || canceled) && (
            <Box
              sx={{
                maxWidth: 780,
                mx: 'auto',
                mb: 4,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.12)',
                bgcolor: success ? 'rgba(35, 171, 125, 0.18)' : 'rgba(120, 128, 142, 0.2)',
              }}
            >
              <Typography variant="body2" sx={{ color: '#f4f4f5', textAlign: 'center' }}>
                {success
                  ? `Plan update successful${localMode ? ' (local prototype mode)' : ''}.`
                  : 'Checkout cancelled.'}
              </Typography>
            </Box>
          )}

          {/* Pricing Cards */}
          <Box
            className="fade-in"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 3,
              alignItems: 'stretch',
              maxWidth: 1100,
              mx: 'auto',
              mb: { xs: 10, md: 14 },
            }}
          >
            {plans.map((plan) => {
              const price = billing === 'yearly' ? plan.yearlyPrice : plan.price;
              const isCurrentPlan = user?.plan === plan.key;
              return (
                <Box
                  key={plan.key}
                  sx={{
                    position: 'relative',
                    borderRadius: 4,
                    p: { xs: 3, md: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: plan.popular ? 'rgba(18, 23, 34, 0.98)' : 'rgba(14, 17, 23, 0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f4f4f5',
                    order: plan.popular ? { xs: 0, md: 0 } : undefined,
                    transform: plan.popular ? { md: 'scale(1.04)' } : undefined,
                    zIndex: plan.popular ? 2 : 1,
                    boxShadow: plan.popular
                      ? '0 24px 60px rgba(0, 0, 0, 0.4)'
                      : '0 12px 40px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {plan.popular && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: '#f8fafc',
                        color: '#0a0a0a',
                        borderRadius: 999,
                        px: 2.5,
                        py: 0.75,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      Most Popular
                    </Box>
                  )}

                  {/* Plan header */}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: 'text.secondary',
                      mb: 1.5,
                    }}
                  >
                    {plan.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '2.5rem', md: '3rem' },
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      ${price}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                      }}
                    >
                      /mo
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 3,
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.description}
                  </Typography>

                  {/* Features */}
                  <Stack spacing={1.5} sx={{ flex: 1, mb: 3 }}>
                    {plan.features.map((feature, i) => (
                      <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckIcon
                          sx={{
                            fontSize: 18,
                            color: plan.featureDimmed[i] ? 'rgba(141, 153, 174, 0.5)' : '#f4f4f5',
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: plan.featureDimmed[i] ? '#8d99ae' : '#f4f4f5',
                          }}
                        >
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  {/* CTA */}
                  <Button
                    fullWidth
                    variant={plan.popular ? 'contained' : 'outlined'}
                    disabled={isCurrentPlan || loading === plan.key}
                    onClick={() => handleCheckout(plan.key)}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '0.68rem',
                    }}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : loading === plan.key
                        ? 'Redirecting...'
                        : plan.cta}
                  </Button>
                </Box>
              );
            })}
          </Box>

          {/* Comparison Table */}
          <Box sx={{ maxWidth: 900, mx: 'auto', mb: { xs: 10, md: 14 } }} className="fade-in">
            <Typography
              variant="h3"
              sx={{ textAlign: 'center', mb: 5, fontWeight: 700, letterSpacing: '-0.03em' }}
            >
              Compare every feature
            </Typography>
            <Box
              sx={{
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              {/* Table Header */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  px: { xs: 2, md: 3 },
                  py: 2,
                }}
              >
                {['Features', 'Free', 'Pro', 'Enterprise'].map((h) => (
                  <Typography
                    key={h}
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      textAlign: h === 'Features' ? 'left' : 'center',
                    }}
                  >
                    {h}
                  </Typography>
                ))}
              </Box>
              {/* Table Rows */}
              {COMPARISON.map((row, i) => (
                <Box
                  key={row.feature}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    px: { xs: 2, md: 3 },
                    py: 2,
                    borderBottom:
                      i < COMPARISON.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(203, 213, 225, 1)' }}>
                    {row.feature}
                  </Typography>
                  {['free', 'pro', 'unlimited'].map((planKey) => (
                    <Box key={planKey} sx={{ textAlign: 'center' }}>
                      {typeof row[planKey] === 'boolean' ? (
                        row[planKey] ? (
                          <CheckIcon sx={{ fontSize: 18, color: '#f4f4f5' }} />
                        ) : (
                          <Typography variant="body2" sx={{ color: '#8d99ae' }}>
                            &mdash;
                          </Typography>
                        )
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: planKey === 'free' ? 400 : 600,
                            color:
                              planKey === 'free'
                                ? '#8d99ae'
                                : '#f4f4f5',
                          }}
                        >
                          {row[planKey]}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>

          {/* FAQ Section */}
          <Box sx={{ maxWidth: 700, mx: 'auto', mb: { xs: 10, md: 14 } }} className="fade-in">
            <Typography
              variant="h3"
              sx={{ textAlign: 'center', mb: 5, fontWeight: 700, letterSpacing: '-0.03em' }}
            >
              Frequently Asked Questions
            </Typography>
            <Stack spacing={0}>
              {FAQS.map((faq, i) => (
                <Box
                  key={i}
                  sx={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    '&:last-child': { borderBottom: '1px solid rgba(255,255,255,0.08)' },
                  }}
                >
                  <Box
                    onClick={() => setExpandedFaq(expandedFaq === i ? -1 : i)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 2.5,
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {faq.q}
                    </Typography>
                    <IconButton size="small" sx={{ color: 'text.primary', ml: 2, flexShrink: 0 }}>
                      <AddIcon
                        sx={{
                          transition: 'transform 200ms',
                          transform: expandedFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                        }}
                      />
                    </IconButton>
                  </Box>
                  <Collapse in={expandedFaq === i}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        pb: 2.5,
                        lineHeight: 1.6,
                      }}
                    >
                      {faq.a}
                    </Typography>
                  </Collapse>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* CTA Section */}
          <Box
            className="fade-in"
            sx={{
              textAlign: 'center',
              py: { xs: 8, md: 10 },
              mb: 6,
            }}
          >
            <Typography
              variant="h2"
              sx={{ fontWeight: 700, letterSpacing: '-0.04em', mb: 2 }}
            >
              Ready to start animating?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', mb: 4, maxWidth: 500, mx: 'auto' }}
            >
              Join 10,000+ creators and educators making beautiful math visuals today.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate(user ? '/studio' : '/register')}
                sx={{ px: 4, py: 1.5 }}
              >
                Get Started Now
              </Button>
              <Button
                variant="outlined"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.04)' },
                }}
              >
                View Showcase
              </Button>
            </Box>
          </Box>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            py: 4,
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 15,
                    height: 15,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #f8fafc, #8ea0b8)',
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  2DManim
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {['Privacy Policy', 'Terms of Service', 'Cookies', 'Twitter'].map((link) => (
                  <Typography
                    key={link}
                    variant="caption"
                    sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
                  >
                    {link}
                  </Typography>
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                &copy; 2024 2DManim Inc. All rights reserved.
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
