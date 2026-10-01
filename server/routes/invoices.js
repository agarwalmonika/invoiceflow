const express = require('express');
const router = express.Router();
const {
  createInvoice, getInvoices, getInvoice,
  updateInvoice, deleteInvoice, downloadPDF, getStats
} = require('../controllers/invoiceController');
const { protect, checkPlanLimit } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', downloadPDF);
router.post('/', checkPlanLimit, createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
