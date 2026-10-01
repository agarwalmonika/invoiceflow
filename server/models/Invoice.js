const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be greater than 0'],
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative'],
  },
  amount: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paidDate: Date,
  notes: String,
  terms: String,
  template: {
    type: String,
    enum: ['modern', 'classic', 'minimal'],
    default: 'modern',
  },
  sentAt: Date,
}, {
  timestamps: true,
});

// Auto-increment invoice count
invoiceSchema.post('save', async function () {
  if (this.isNew) {
    await mongoose.model('User').findByIdAndUpdate(
      this.userId,
      { $inc: { invoiceCount: 1 } }
    );
  }
});

// Update client totals
invoiceSchema.post('save', async function () {
  const Client = mongoose.model('Client');
  const Invoice = mongoose.model('Invoice');
  
  const stats = await Invoice.aggregate([
    { $match: { clientId: this.clientId, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: null,
        totalInvoiced: { $sum: '$totalAmount' },
        totalPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] }
        }
      }
    }
  ]);

  if (stats.length > 0) {
    await Client.findByIdAndUpdate(this.clientId, {
      totalInvoiced: stats[0].totalInvoiced,
      totalPaid: stats[0].totalPaid,
    });
  }
});

invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
