const Invoice = require('../models/Invoice');
const { Payment, Subscription } = require('../models/PaymentSubscription');
const User = require('../models/User');

// =================== PAYMENT CONTROLLER ===================

// @desc    Mark invoice as paid
// @route   PUT /api/payments/:invoiceId
exports.markPaid = async (req, res) => {
  try {
    const { method, notes, paymentDate } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.invoiceId, userId: req.user._id });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already marked as paid.' });
    }

    invoice.status = 'paid';
    invoice.paidDate = paymentDate || new Date();
    await invoice.save();

    await Payment.create({
      invoiceId: invoice._id,
      userId: req.user._id,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      status: 'completed',
      method: method || 'other',
      paymentDate: paymentDate || new Date(),
      notes,
    });

    res.json({ success: true, message: 'Invoice marked as paid!', invoice });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: 'Error recording payment.' });
  }
};

// @desc    Mark invoice as unpaid
// @route   PUT /api/payments/:invoiceId/unpaid
exports.markUnpaid = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.invoiceId, userId: req.user._id });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    invoice.status = 'sent';
    invoice.paidDate = undefined;
    await invoice.save();
    await Payment.deleteMany({ invoiceId: invoice._id });
    res.json({ success: true, message: 'Invoice marked as unpaid.', invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating payment status.' });
  }
};

// @desc    Get payment history
// @route   GET /api/payments
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('invoiceId', 'invoiceNumber totalAmount currency')
      .sort({ paymentDate: -1 })
      .limit(50);
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payments.' });
  }
};

// =================== ADMIN CONTROLLER ===================

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (plan) filter.subscriptionPlan = plan;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, proUsers, enterpriseUsers,
      totalInvoices, paidInvoices,
      monthlySignups, monthlyRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ subscriptionPlan: 'pro' }),
      User.countDocuments({ subscriptionPlan: 'enterprise' }),
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'paid' }),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Payment.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const platformRevenue = proUsers * 19 + enterpriseUsers * 49; // estimated MRR

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers, pro: proUsers, enterprise: enterpriseUsers },
        invoices: { total: totalInvoices, paid: paidInvoices },
        mrr: platformRevenue,
        monthlySignups,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching admin stats.' });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin.' });
    
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user.' });
  }
};

// @desc    Update user plan (admin)
// @route   PUT /api/admin/users/:id/plan
exports.updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { subscriptionPlan: plan }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'Plan updated.', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating plan.' });
  }
};
