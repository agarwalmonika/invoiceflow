const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  businessName: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'active',
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  invoiceCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  avatar: String,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Plan limits
userSchema.methods.canCreateInvoice = function () {
  const limits = { free: 5, pro: 100, enterprise: Infinity };
  return this.invoiceCount < (limits[this.subscriptionPlan] || 5);
};

module.exports = mongoose.model('User', userSchema);
