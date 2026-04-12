import { Router } from 'express';
import auth from '../middleware/auth.js';
import env from '../config/env.js';
import { PLANS, activatePlanForUser } from '../services/billing.js';

const router = Router();

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS, paymentProvider: 'disabled' });
});

router.post('/checkout', auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    await activatePlanForUser(req.user, plan);

    res.json({
      url: `${env.clientUrl}/billing?success=true&local=1`,
      local: true,
      plan: req.user.plan,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update local plan' });
  }
});

router.post('/portal', auth, async (req, res) => {
  res.json({
    url: `${env.clientUrl}/billing?local=1`,
    local: true,
    message: 'Payment portal is disabled in local prototype mode',
  });
});

router.post('/webhook', (req, res) => {
  res.status(410).json({ error: 'Billing webhooks are disabled in local prototype mode' });
});

export default router;
