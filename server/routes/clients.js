// routes/clients.js
const express = require('express');
const router = express.Router();
const { createClient, getClients, getClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
