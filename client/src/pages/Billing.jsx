import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { billingAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    features: ['5 generations/month', 'All AI models', 'Code export'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 29,
    features: ['100 generations/month', 'All AI models', 'Code export', 'Priority rendering'],
    popular: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: ['Unlimited generations', 'All AI models', 'Code export', 'Priority rendering', 'Priority support'],
  },
];

export default function Billing() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState('');
  const [searchParams] = useSearchParams();

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const currentPlan = user?.plan || 'free';

  useEffect(() => {
    if (success) {
      refreshUser().catch(() => {
        // Ignore refresh failures here and keep the page usable.
      });
    }
  }, [success, refreshUser]);

  const handleCheckout = async (plan) => {
    setLoading(plan);
    try {
      const { data } = await billingAPI.checkout(plan);
      window.location.href = data.url;
    } catch {
      toast.error('Failed to start checkout');
    } finally {
      setLoading('');
    }
  };

  const handlePortal = async () => {
    try {
      const { data } = await billingAPI.portal();
      window.location.href = data.url;
    } catch {
      toast.error('Failed to open billing portal');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card className="fade-in">
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Chip label="Plans" sx={{ mb: 2 }} />
              <Typography variant="h3" sx={{ mb: 1 }}>
                Upgrade when you need more generation capacity.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                Choose the plan that fits your volume. All tiers keep the core workflow the same: prompt, inspect, render, and export code.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card className="fade-in" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Current workspace
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {currentPlan.toUpperCase()} plan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {user?.credits ?? 0} credits remaining
              </Typography>
              {user?.stripeCustomerId && (
                <Button variant="outlined" sx={{ mt: 3 }} onClick={handlePortal}>
                  Manage in Stripe
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {success && <Alert severity="success" sx={{ mb: 3 }}>Subscription activated! Your credits have been updated.</Alert>}
      {canceled && <Alert severity="info" sx={{ mb: 3 }}>Checkout was canceled.</Alert>}

      <Grid container spacing={3}>
        {PLANS.map((plan) => (
          <Grid item xs={12} md={4} key={plan.key}>
            <Card
              sx={{
                height: '100%',
                border: plan.popular ? '2px solid' : '1px solid',
                borderColor: plan.popular ? 'primary.main' : 'rgba(255,255,255,0.1)',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <Chip
                  label="Popular"
                  color="primary"
                  size="small"
                  sx={{ position: 'absolute', top: 12, right: 12 }}
                />
              )}
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" fontWeight={600}>{plan.name}</Typography>
                <Box sx={{ my: 2 }}>
                  <Typography variant="h3" fontWeight={700} component="span">
                    ${plan.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="span">
                    /month
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={1.25}>
                    {plan.features.map((f) => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <CheckIcon fontSize="small" color="success" />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                {plan.key === 'free' ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled={currentPlan === 'free'}
                    sx={{ mt: 2 }}
                  >
                    {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                  </Button>
                ) : (
                  <Button
                    variant={currentPlan === plan.key ? 'outlined' : 'contained'}
                    fullWidth
                    disabled={currentPlan === plan.key || loading === plan.key}
                    onClick={() => handleCheckout(plan.key)}
                    sx={{ mt: 2 }}
                    startIcon={loading === plan.key ? <CircularProgress size={18} color="inherit" /> : null}
                  >
                    {currentPlan === plan.key
                      ? 'Current Plan'
                      : loading === plan.key
                        ? 'Redirecting...'
                        : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
