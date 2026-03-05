const express = require('express');
const router = express.Router();
const { getAllOrders, getOrderById, createOrder } = require('../controllers/orderController');

router.get('/', getAllOrders);       // GET /orders
router.get('/:id', getOrderById);   // GET /orders/order-001
router.post('/', createOrder);      // POST /orders

module.exports = router;