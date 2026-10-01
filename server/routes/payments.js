const express = require('express');
const router = express.Router();
const { markPaid, markUnpaid, getPayments } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getPayments);
router.put('/:invoiceId', markPaid);
router.put('/:invoiceId/unpaid', markUnpaid);

module.exports = router;
