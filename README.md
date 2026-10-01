# InvoiceFlow – Full-Stack Invoice & Billing SaaS

A complete, production-ready Invoice and Billing SaaS application built with React, Node.js, MongoDB, and Stripe.

## 🚀 Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18 + Vite, Tailwind CSS, Recharts |
| Backend    | Node.js + Express.js                    |
| Database   | MongoDB + Mongoose                      |
| Auth       | JWT + bcryptjs                          |
| Payments   | Stripe Subscriptions + Webhooks         |
| PDF Export | PDFKit                                  |

---

## 📁 Project Structure

```
invoice-saas/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Shared UI components
│   │   │   ├── invoice/        # Invoice-specific components
│   │   │   └── layout/         # AppLayout, Sidebar, Topbar
│   │   ├── context/            # React Context (Auth)
│   │   ├── hooks/              # Custom hooks
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── invoice/        # List, Create, Edit, Detail
│   │   │   ├── client/         # List, Detail
│   │   │   ├── reports/        # Analytics & reports
│   │   │   ├── subscription/   # Plans, Stripe checkout
│   │   │   ├── profile/        # User settings
│   │   │   └── admin/          # Admin panel
│   │   ├── services/
│   │   │   └── api.js          # Axios API layer
│   │   └── utils/
│   │       └── helpers.js      # Formatters, constants
│   ├── package.json
│   └── vite.config.js
│
└── server/                     # Express backend
    ├── config/
    │   └── db.js               # MongoDB connection
    ├── controllers/
    │   ├── authController.js
    │   ├── invoiceController.js
    │   ├── clientController.js
    │   ├── adminController.js
    │   └── stripeController.js
    ├── middleware/
    │   └── auth.js             # JWT, role guards
    ├── models/
    │   ├── User.js
    │   ├── Client.js
    │   ├── Invoice.js
    │   └── PaymentSubscription.js
    ├── routes/
    │   ├── auth.js
    │   ├── invoices.js
    │   ├── clients.js
    │   ├── payments.js
    │   ├── admin.js
    │   └── stripe.js
    ├── utils/
    │   └── seed.js             # Demo data seeder
    ├── .env.example
    └── server.js
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account (for payment features)

### 1. Clone and Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# In /server directory
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoice-saas
JWT_SECRET=your_super_secret_key_here

# Stripe (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

CLIENT_URL=http://localhost:5173
```

### 3. Seed Demo Data (Optional)

```bash
cd server
npm run seed
```

This creates:
- **Admin:** `admin@invoiceflow.com` / `admin123`
- **Demo User:** `jane@demo.com` / `demo123`
- 8 sample invoices, 5 clients, payment history

### 4. Start Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Description          | Auth |
|--------|----------------------|----------------------|------|
| POST   | /api/auth/register   | Register new user    | No   |
| POST   | /api/auth/login      | Login                | No   |
| GET    | /api/auth/me         | Get current user     | Yes  |
| PUT    | /api/auth/profile    | Update profile       | Yes  |
| PUT    | /api/auth/password   | Change password      | Yes  |

### Invoices
| Method | Endpoint                  | Description          | Auth |
|--------|--------------------------|----------------------|------|
| GET    | /api/invoices             | List invoices        | Yes  |
| GET    | /api/invoices/stats       | Invoice statistics   | Yes  |
| GET    | /api/invoices/:id         | Get invoice          | Yes  |
| GET    | /api/invoices/:id/pdf     | Download PDF         | Yes  |
| POST   | /api/invoices             | Create invoice       | Yes  |
| PUT    | /api/invoices/:id         | Update invoice       | Yes  |
| DELETE | /api/invoices/:id         | Delete invoice       | Yes  |

### Clients
| Method | Endpoint          | Description    | Auth |
|--------|------------------|----------------|------|
| GET    | /api/clients      | List clients   | Yes  |
| GET    | /api/clients/:id  | Get client     | Yes  |
| POST   | /api/clients      | Create client  | Yes  |
| PUT    | /api/clients/:id  | Update client  | Yes  |
| DELETE | /api/clients/:id  | Delete client  | Yes  |

### Payments
| Method | Endpoint                      | Description      | Auth |
|--------|------------------------------|------------------|------|
| GET    | /api/payments                 | Payment history  | Yes  |
| PUT    | /api/payments/:invoiceId      | Mark paid        | Yes  |
| PUT    | /api/payments/:invoiceId/unpaid | Mark unpaid    | Yes  |

### Admin (Admin role only)
| Method | Endpoint                      | Description       |
|--------|------------------------------|-------------------|
| GET    | /api/admin/users              | List all users    |
| GET    | /api/admin/stats              | Platform stats    |
| PUT    | /api/admin/users/:id/toggle   | Toggle user status|
| PUT    | /api/admin/users/:id/plan     | Update user plan  |

### Stripe
| Method | Endpoint              | Description            |
|--------|----------------------|------------------------|
| GET    | /api/stripe/plans    | Get plan info          |
| POST   | /api/stripe/checkout | Create checkout session|
| POST   | /api/stripe/portal   | Billing portal         |
| POST   | /api/stripe/webhook  | Stripe webhook handler |

---

## 💳 Stripe Setup

### Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Create **Pro Plan** product → Recurring price **$19/month** → Copy Price ID → set as `STRIPE_PRICE_ID_PRO`
3. Create **Enterprise Plan** product → Recurring price **$49/month** → Copy Price ID → set as `STRIPE_PRICE_ID_ENTERPRISE`

### Set Up Webhook (Local Testing)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/stripe/webhook

# Copy the webhook signing secret (whsec_...) to your .env
```

### Events Handled
- `checkout.session.completed` — activates subscription
- `customer.subscription.updated` — syncs plan changes
- `customer.subscription.deleted` — downgrades to free

---

## 🌟 Features

### User Features
- ✅ JWT authentication with role-based access
- ✅ Create, edit, delete invoices with line items
- ✅ Auto-generated invoice numbers
- ✅ Multi-currency support (8 currencies)
- ✅ PDF invoice generation & download
- ✅ Client management (CRUD)
- ✅ Payment tracking (mark paid/unpaid)
- ✅ Revenue charts and analytics
- ✅ Subscription management via Stripe
- ✅ Dark mode support
- ✅ Responsive mobile-first design

### Admin Features
- ✅ Platform-wide dashboard
- ✅ User management (activate/deactivate, change plans)
- ✅ Revenue and signup analytics
- ✅ MRR estimation

---

## 🚢 Deployment

### Frontend → Vercel

```bash
cd client
npm run build

# Push to GitHub, connect to Vercel
# Set env: VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend → Render

1. Push `server/` to GitHub
2. Create Web Service on Render
3. Set environment variables (same as `.env`)
4. Build: `npm install`, Start: `npm start`

### Database → MongoDB Atlas

1. Create cluster at https://cloud.mongodb.com
2. Get connection string → set as `MONGODB_URI`
3. Whitelist `0.0.0.0/0` for Render IP

---

## 🔐 Security Features

- Helmet.js security headers
- Rate limiting (200 req/15min global, 20 for auth)
- bcrypt password hashing (12 rounds)
- JWT token authentication
- MongoDB injection protection via Mongoose
- CORS configured for specific origins

---

## 📊 Subscription Plans

| Feature              | Free | Pro ($19/mo) | Enterprise ($49/mo) |
|----------------------|------|--------------|---------------------|
| Invoices/month       | 5    | 100          | Unlimited           |
| PDF export           | ✅   | ✅            | ✅                   |
| Multi-currency       | ✅   | ✅            | ✅                   |
| Client management    | ✅   | ✅            | ✅                   |
| Email invoices       | ❌   | ✅            | ✅                   |
| Priority support     | ❌   | ✅            | ✅                   |
| Team members         | ❌   | ❌            | ✅                   |
| API access           | ❌   | ❌            | ✅                   |

---

## 🧑‍💻 Demo Credentials

After running `npm run seed`:

| Role  | Email                      | Password  |
|-------|----------------------------|-----------|
| Admin | admin@invoiceflow.com      | admin123  |
| User  | jane@demo.com              | demo123   |
