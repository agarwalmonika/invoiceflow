const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

// @desc    Create client
// @route   POST /api/clients
exports.createClient = async (req, res) => {
  try {
    const { name, email, phone, company, address, taxId, notes } = req.body;

    const existing = await Client.findOne({ userId: req.user._id, email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Client with this email already exists.' });
    }

    const client = await Client.create({
      userId: req.user._id,
      name,
      email,
      phone,
      company,
      address,
      taxId,
      notes,
    });

    res.status(201).json({ success: true, message: 'Client added!', client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ success: false, message: 'Error creating client.' });
  }
};

// @desc    Get all clients
// @route   GET /api/clients
exports.getClients = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id, isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Client.countDocuments(filter),
    ]);

    res.json({ success: true, clients, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching clients.' });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }
    const invoices = await Invoice.find({ clientId: req.params.id, userId: req.user._id })
      .sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, client, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching client.' });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }
    res.json({ success: true, message: 'Client updated!', client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating client.' });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const invoiceCount = await Invoice.countDocuments({ clientId: req.params.id, userId: req.user._id });
    if (invoiceCount > 0) {
      await Client.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isActive: false }
      );
      return res.json({ success: true, message: 'Client archived (has existing invoices).' });
    }
    await Client.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Client deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting client.' });
  }
};
