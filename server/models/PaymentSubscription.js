const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  },
  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'stripe', 'paypal', 'other'],
    default: 'other',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  transactionId: String,
  notes: String,
}, {
  timestamps: true,
});

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
    default: 'active',
  },
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  trialEnd: Date,
}, {
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { Payment, Subscription };
