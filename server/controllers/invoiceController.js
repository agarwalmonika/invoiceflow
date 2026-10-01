const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// Generate unique invoice number
const generateInvoiceNumber = async (userId) => {
  const user = await User.findById(userId);
  const count = user.invoiceCount + 1;
  const year = new Date().getFullYear();
  const prefix = user.businessName
    ? user.businessName.slice(0, 3).toUpperCase()
    : 'INV';
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
};

// @desc    Create invoice
// @route   POST /api/invoices
exports.createInvoice = async (req, res) => {
  try {
    const { clientId, items, discount, notes, terms, dueDate, template, currency } = req.body;

    const client = await Client.findOne({ _id: clientId, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = items.reduce((sum, item) => {
      const itemAmount = item.quantity * item.rate;
      return sum + (itemAmount * (item.taxRate || 0)) / 100;
    }, 0);
    const totalAmount = subtotal + taxAmount - (discount || 0);

    const processedItems = items.map((item) => ({
      ...item,
      amount: item.quantity * item.rate,
    }));

    const invoiceNumber = await generateInvoiceNumber(req.user._id);

    const invoice = await Invoice.create({
      userId: req.user._id,
      clientId,
      invoiceNumber,
      items: processedItems,
      subtotal,
      taxAmount,
      discount: discount || 0,
      totalAmount,
      dueDate,
      notes,
      terms,
      template: template || 'modern',
      currency: currency || req.user.currency || 'USD',
    });

    await invoice.populate('clientId', 'name email company');

    res.status(201).json({ success: true, message: 'Invoice created!', invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ success: false, message: 'Error creating invoice.' });
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const { status, clientId, page = 1, limit = 20, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = { userId: req.user._id };
    if (status && status !== 'all') filter.status = status;
    if (clientId) filter.clientId = clientId;

    // Check for overdue
    await Invoice.updateMany(
      { userId: req.user._id, status: 'sent', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('clientId', 'name email company')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices.' });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('clientId')
      .populate('userId', 'name email businessName address phone currency');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching invoice.' });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot edit a paid invoice.' });
    }

    const { items, discount, notes, terms, dueDate, status, template, currency } = req.body;

    if (items) {
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
      const taxAmount = items.reduce((sum, item) => {
        const itemAmount = item.quantity * item.rate;
        return sum + (itemAmount * (item.taxRate || 0)) / 100;
      }, 0);
      const totalAmount = subtotal + taxAmount - (discount || invoice.discount || 0);

      invoice.items = items.map((item) => ({ ...item, amount: item.quantity * item.rate }));
      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.totalAmount = totalAmount;
    }

    if (discount !== undefined) invoice.discount = discount;
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;
    if (dueDate) invoice.dueDate = dueDate;
    if (status) invoice.status = status;
    if (template) invoice.template = template;
    if (currency) invoice.currency = currency;

    await invoice.save();
    await invoice.populate('clientId', 'name email company');

    res.json({ success: true, message: 'Invoice updated!', invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ success: false, message: 'Error updating invoice.' });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    await User.findByIdAndUpdate(req.user._id, { $inc: { invoiceCount: -1 } });
    res.json({ success: true, message: 'Invoice deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting invoice.' });
  }
};

// @desc    Download invoice as PDF
// @route   GET /api/invoices/:id/pdf
exports.downloadPDF = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('clientId')
      .populate('userId', 'name email businessName address phone');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(11).font('Helvetica').fillColor('#666');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 50, 90);
    doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, 105);
    doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 120);

    // Business info (right side)
    const user = invoice.userId;
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000');
    doc.text(user.businessName || user.name, 350, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#444');
    doc.text(user.email, 350, 70, { align: 'right' });
    if (user.phone) doc.text(user.phone, 350, 85, { align: 'right' });
    if (user.address) {
      const addr = user.address;
      if (addr.street) doc.text(addr.street, 350, 100, { align: 'right' });
      if (addr.city) doc.text(`${addr.city}, ${addr.state || ''} ${addr.zipCode || ''}`, 350, 115, { align: 'right' });
      if (addr.country) doc.text(addr.country, 350, 130, { align: 'right' });
    }

    // Divider
    doc.moveTo(50, 155).lineTo(545, 155).stroke('#E5E7EB');

    // Bill To
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#666').text('BILL TO', 50, 170);
    const client = invoice.clientId;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text(client.name, 50, 185);
    doc.fontSize(10).font('Helvetica').fillColor('#444');
    if (client.company) doc.text(client.company, 50, 200);
    doc.text(client.email, 50, client.company ? 215 : 200);
    if (client.phone) doc.text(client.phone, 50, client.company ? 230 : 215);
    if (client.address) {
      const cAddr = client.address;
      let yPos = client.company ? 245 : 230;
      if (cAddr.street) { doc.text(cAddr.street, 50, yPos); yPos += 15; }
      if (cAddr.city) { doc.text(`${cAddr.city}, ${cAddr.state || ''} ${cAddr.zipCode || ''}`, 50, yPos); }
    }

    // Status badge
    const statusColors = { paid: '#10B981', overdue: '#EF4444', sent: '#3B82F6', draft: '#6B7280' };
    const statusColor = statusColors[invoice.status] || '#6B7280';
    doc.roundedRect(410, 175, 80, 25, 5).fill(statusColor);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff')
      .text(invoice.status.toUpperCase(), 410, 183, { width: 80, align: 'center' });

    // Items table
    const tableTop = 290;
    doc.fillColor('#F3F4F6').rect(50, tableTop, 495, 25).fill();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
    doc.text('DESCRIPTION', 60, tableTop + 8);
    doc.text('QTY', 320, tableTop + 8);
    doc.text('RATE', 370, tableTop + 8);
    doc.text('TAX%', 420, tableTop + 8);
    doc.text('AMOUNT', 480, tableTop + 8);

    let y = tableTop + 35;
    doc.font('Helvetica').fontSize(10).fillColor('#374151');

    invoice.items.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.fillColor('#FAFAFA').rect(50, y - 5, 495, 22).fill();
      }
      doc.fillColor('#374151');
      doc.text(item.description, 60, y, { width: 250 });
      doc.text(String(item.quantity), 320, y);
      doc.text(`${invoice.currency} ${item.rate.toFixed(2)}`, 355, y);
      doc.text(`${item.taxRate || 0}%`, 425, y);
      doc.text(`${invoice.currency} ${item.amount.toFixed(2)}`, 465, y);
      y += 25;
    });

    // Totals
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).stroke('#E5E7EB');
    y += 10;

    doc.fontSize(10).fillColor('#666');
    doc.text('Subtotal:', 380, y);
    doc.fillColor('#000').text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 460, y);
    y += 18;

    if (invoice.taxAmount > 0) {
      doc.fillColor('#666').text('Tax:', 380, y);
      doc.fillColor('#000').text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, 460, y);
      y += 18;
    }
    if (invoice.discount > 0) {
      doc.fillColor('#666').text('Discount:', 380, y);
      doc.fillColor('#E44').text(`-${invoice.currency} ${invoice.discount.toFixed(2)}`, 460, y);
      y += 18;
    }

    doc.moveTo(350, y).lineTo(545, y).stroke('#374151');
    y += 10;
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000');
    doc.text('TOTAL:', 360, y);
    doc.text(`${invoice.currency} ${invoice.totalAmount.toFixed(2)}`, 445, y);

    // Notes
    if (invoice.notes) {
      y += 50;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#666').text('NOTES', 50, y);
      y += 15;
      doc.font('Helvetica').fillColor('#444').text(invoice.notes, 50, y, { width: 300 });
    }

    if (invoice.terms) {
      y = invoice.notes ? y + 40 : y + 50;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#666').text('TERMS & CONDITIONS', 50, y);
      y += 15;
      doc.font('Helvetica').fillColor('#444').text(invoice.terms, 50, y, { width: 300 });
    }

    // Footer
    doc.fontSize(9).fillColor('#9CA3AF').text('Thank you for your business!', 50, 750, { align: 'center', width: 495 });

    doc.end();
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ success: false, message: 'Error generating PDF.' });
  }
};

// @desc    Get invoice stats/summary
// @route   GET /api/invoices/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totals, monthlyData, recentInvoices] = await Promise.all([
      Invoice.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
      Invoice.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] } },
            invoices: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Invoice.find({ userId }).sort({ createdAt: -1 }).limit(5).populate('clientId', 'name'),
    ]);

    const statsMap = {};
    totals.forEach((t) => { statsMap[t._id] = t; });

    const summary = {
      total: totals.reduce((s, t) => s + t.count, 0),
      totalRevenue: (statsMap.paid?.total || 0),
      paid: { count: statsMap.paid?.count || 0, amount: statsMap.paid?.total || 0 },
      pending: { count: (statsMap.draft?.count || 0) + (statsMap.sent?.count || 0), amount: (statsMap.draft?.total || 0) + (statsMap.sent?.total || 0) },
      overdue: { count: statsMap.overdue?.count || 0, amount: statsMap.overdue?.total || 0 },
    };

    res.json({ success: true, summary, monthlyData, recentInvoices });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats.' });
  }
};
