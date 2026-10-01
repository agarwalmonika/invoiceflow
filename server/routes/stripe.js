const express = require('express');
const router = express.Router();
const { getPlans, createCheckout, createPortal, webhook } = require('../controllers/stripeController');
const { protect } = require('../middleware/auth');

router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

router.use(protect);
router.get('/plans', getPlans);
router.post('/checkout', createCheckout);
router.post('/portal', createPortal);

module.exports = router;
