export const PLANS = {
  free: {
    name: 'Free',
    credits: 5,
    price: 0,
    description: 'For explorers and hobbyists getting started with animation.',
    features: ['Core Manim engine', 'Community support', 'Watermarked exports'],
    resolution: '1080p',
    exportFormats: 'MP4',
    cloudStorage: '1GB',
    priorityQueue: false,
    collaborationTools: false,
  },
  pro: {
    name: 'Pro',
    credits: 100,
    price: 29,
    description: 'For professionals and content creators who need power.',
    features: ['Everything in Free', 'No watermarks', 'Priority rendering', 'Premium assets'],
    resolution: '4K UHD',
    exportFormats: 'All Formats',
    cloudStorage: '100GB',
    priorityQueue: true,
    collaborationTools: false,
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    credits: 1000000,
    price: 99,
    description: 'For agencies and studios requiring high-volume scale.',
    features: ['Custom integrations', 'Team management', 'Dedicated account manager', 'SLA & Security'],
    resolution: '8K+',
    exportFormats: 'All Formats',
    cloudStorage: 'Unlimited',
    priorityQueue: true,
    collaborationTools: true,
  },
};

export async function activatePlanForUser(user, plan) {
  if (!PLANS[plan]) {
    throw new Error('Invalid plan');
  }

  user.plan = plan;
  user.credits = PLANS[plan].credits;
  user.creditsResetAt = new Date();
  await user.save();

  return user;
}
