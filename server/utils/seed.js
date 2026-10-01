require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const { Payment, Subscription } = require('../models/PaymentSubscription');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    Subscription.deleteMany({}),
  ]);

  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@invoiceflow.com',
    password: 'admin123',
    role: 'admin',
    businessName: 'InvoiceFlow',
    subscriptionPlan: 'enterprise',
  });
  await Subscription.create({ userId: admin._id, plan: 'enterprise', status: 'active' });

  // Create demo user
  const user = await User.create({
    name: 'Jane Smith',
    email: 'jane@demo.com',
    password: 'demo123',
    role: 'user',
    businessName: 'Smith Creative Studio',
    phone: '+1 555-0100',
    subscriptionPlan: 'pro',
    address: { street: '123 Main St', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94102' },
    invoiceCount: 8,
  });
  await Subscription.create({ userId: user._id, plan: 'pro', status: 'active' });

  // Create clients
  const clients = await Client.insertMany([
    { userId: user._id, name: 'Acme Corporation', email: 'billing@acme.com', phone: '+1 555-0101', company: 'Acme Corp', address: { city: 'New York', country: 'USA' } },
    { userId: user._id, name: 'TechStart Inc', email: 'accounts@techstart.io', phone: '+1 555-0102', company: 'TechStart Inc', address: { city: 'Austin', country: 'USA' } },
    { userId: user._id, name: 'Green Earth LLC', email: 'finance@greenearth.com', phone: '+1 555-0103', company: 'Green Earth LLC' },
    { userId: user._id, name: 'Nova Digital', email: 'pay@novadigital.co', phone: '+1 555-0104', company: 'Nova Digital' },
    { userId: user._id, name: 'Bright Future Co', email: 'billing@brightfuture.com', phone: '+1 555-0105', company: 'Bright Future Co' },
  ]);

  const now = new Date();
  const months = [-5, -4, -3, -2, -1, 0];

  const invoicesData = [];
  let invCount = 1;

  for (const m of months) {
    const date = new Date(now.getFullYear(), now.getMonth() + m, 15);
    const client = clients[Math.floor(Math.random() * clients.length)];
    const isPaid = m < 0;

    invoicesData.push({
      userId: user._id,
      clientId: client._id,
      invoiceNumber: `SMC-2024-${String(invCount++).padStart(4, '0')}`,
      status: isPaid ? 'paid' : m === 0 ? 'sent' : 'paid',
      items: [
        { description: 'Web Design Services', quantity: 1, rate: 2500, amount: 2500, taxRate: 10 },
        { description: 'Logo & Branding Package', quantity: 1, rate: 800, amount: 800, taxRate: 10 },
      ],
      subtotal: 3300,
      taxAmount: 330,
      discount: 0,
      totalAmount: 3630,
      currency: 'USD',
      issueDate: date,
      dueDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 30),
      paidDate: isPaid ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 15) : undefined,
      notes: 'Thank you for your continued business!',
      terms: 'Payment due within 30 days.',
    });
  }

  // Add a draft and an overdue
  invoicesData.push({
    userId: user._id,
    clientId: clients[1]._id,
    invoiceNumber: `SMC-2024-${String(invCount++).padStart(4, '0')}`,
    status: 'draft',
    items: [{ description: 'UI/UX Consultation (4 hours)', quantity: 4, rate: 150, amount: 600, taxRate: 0 }],
    subtotal: 600, taxAmount: 0, discount: 0, totalAmount: 600, currency: 'USD',
    issueDate: new Date(), dueDate: new Date(Date.now() + 30 * 86400000),
  });
  invoicesData.push({
    userId: user._id,
    clientId: clients[2]._id,
    invoiceNumber: `SMC-2024-${String(invCount++).padStart(4, '0')}`,
    status: 'overdue',
    items: [{ description: 'Monthly Retainer - SEO & Content', quantity: 1, rate: 1200, amount: 1200, taxRate: 0 }],
    subtotal: 1200, taxAmount: 0, discount: 0, totalAmount: 1200, currency: 'USD',
    issueDate: new Date(Date.now() - 45 * 86400000),
    dueDate: new Date(Date.now() - 15 * 86400000),
  });

  const invoices = await Invoice.insertMany(invoicesData);

  // Create payments for paid invoices
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  for (const inv of paidInvoices) {
    await Payment.create({
      invoiceId: inv._id,
      userId: user._id,
      amount: inv.totalAmount,
      currency: inv.currency,
      status: 'completed',
      method: 'bank_transfer',
      paymentDate: inv.paidDate,
    });
  }

  // Create a few more demo users
  const plans = ['free', 'free', 'pro', 'pro', 'enterprise'];
  for (let i = 0; i < 15; i++) {
    const u = await User.create({
      name: `Demo User ${i + 1}`,
      email: `user${i + 1}@demo.com`,
      password: 'demo123',
      subscriptionPlan: plans[i % plans.length],
      invoiceCount: Math.floor(Math.random() * 20),
      createdAt: new Date(Date.now() - Math.random() * 180 * 86400000),
    });
    await Subscription.create({ userId: u._id, plan: plans[i % plans.length], status: 'active' });
  }

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin:  admin@invoiceflow.com  /  admin123');
  console.log('📧 Demo:   jane@demo.com          /  demo123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
