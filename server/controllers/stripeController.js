const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { Subscription } = require('../models/PaymentSubscription');

const PLANS = {
  pro: {
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: ['100 invoices/month', 'Email invoices', 'PDF export', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 49,
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    features: ['Unlimited invoices', 'Multi-currency', 'Team members', 'API access', '24/7 support'],
  },
};

// @desc    Get plans
// @route   GET /api/stripe/plans
exports.getPlans = async (req, res) => {
  res.json({ success: true, plans: PLANS });
};

// @desc    Create checkout session
// @route   POST /api/stripe/checkout
exports.createCheckout = async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, message: 'Invalid plan.' });
  }

  try {
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(req.user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription`,
      metadata: { userId: req.user._id.toString(), plan },
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ success: false, message: 'Error creating checkout session.' });
  }
};

// @desc    Create portal session
// @route   POST /api/stripe/portal
exports.createPortal = async (req, res) => {
  try {
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No Stripe customer found.' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/subscription`,
    });
    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating portal session.' });
  }
};

// @desc    Stripe webhook
// @route   POST /api/stripe/webhook
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan } = session.metadata;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        await User.findByIdAndUpdate(userId, {
          subscriptionPlan: plan,
          subscriptionStatus: 'active',
          stripeSubscriptionId: session.subscription,
        });
        
        await Subscription.findOneAndUpdate(
          { userId },
          {
            plan,
            status: 'active',
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          { upsert: true }
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata.userId;
        
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: subscription.status,
        });
        
        await Subscription.findOneAndUpdate(
          { userId },
          {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata.userId;
        
        await User.findByIdAndUpdate(userId, {
          subscriptionPlan: 'free',
          subscriptionStatus: 'inactive',
          stripeSubscriptionId: null,
        });
        
        await Subscription.findOneAndUpdate({ userId }, { plan: 'free', status: 'cancelled' });
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
};
