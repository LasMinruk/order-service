const { v4: uuidv4 } = require('uuid');
const orders = require('../data/orders');

// Import service clients (these make HTTP calls to other services)
const { getUserById } = require('../services/userServiceClient');
const { getProductById, reduceStock } = require('../services/productServiceClient');
const { sendOrderNotification } = require('../services/notificationServiceClient');

// GET /orders - Get all orders
const getAllOrders = (req, res) => {
  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
};

// GET /orders/:id - Get single order
const getOrderById = (req, res) => {
  const order = orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: `Order with ID ${req.params.id} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
};

// POST /orders - Create a new order
// THIS IS THE KEY FUNCTION - it calls 3 other microservices!
const createOrder = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  // Step 1: Basic validation
  if (!userId || !productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'Please provide userId, productId, and quantity'
    });
  }

  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be a positive number'
    });
  }

  try {
    // ─────────────────────────────────────────────────
    // Step 2: Call USER SERVICE to verify user exists
    // ─────────────────────────────────────────────────
    console.log(`🔍 Checking user ${userId} with User Service...`);
    const userResponse = await getUserById(userId);

    if (!userResponse.success) {
      return res.status(404).json({
        success: false,
        message: `Cannot create order: ${userResponse.message}`
      });
    }

    const user = userResponse.data;
    console.log(`✅ User verified: ${user.name}`);

    // ─────────────────────────────────────────────────
    // Step 3: Call PRODUCT SERVICE to verify product
    // ─────────────────────────────────────────────────
    console.log(`🔍 Checking product ${productId} with Product Service...`);
    const productResponse = await getProductById(productId);

    if (!productResponse.success) {
      return res.status(404).json({
        success: false,
        message: `Cannot create order: ${productResponse.message}`
      });
    }

    const product = productResponse.data;
    console.log(`✅ Product verified: ${product.name}`);

    // Check if enough stock is available
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Requested: ${quantity}, Available: ${product.stock}`
      });
    }

    // ─────────────────────────────────────────────────
    // Step 4: Create the order
    // ─────────────────────────────────────────────────
    const totalPrice = product.price * quantity;

    const newOrder = {
      id: `order-${uuidv4().split('-')[0]}`,
      userId,
      userName: user.name,
      userEmail: user.email,
      productId,
      productName: product.name,
      quantity: parseInt(quantity),
      unitPrice: product.price,
      totalPrice,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    console.log(`✅ Order created: ${newOrder.id}`);

    // ─────────────────────────────────────────────────
    // Step 5: Reduce stock in Product Service
    // ─────────────────────────────────────────────────
    console.log(`📦 Updating stock in Product Service...`);
    await reduceStock(productId, parseInt(quantity));
    console.log(`✅ Stock updated`);

    // ─────────────────────────────────────────────────
    // Step 6: Call NOTIFICATION SERVICE
    // ─────────────────────────────────────────────────
    console.log(`📧 Sending notification via Notification Service...`);
    const notificationResult = await sendOrderNotification({
      orderId: newOrder.id,
      userName: user.name,
      userEmail: user.email,
      productName: product.name,
      quantity: newOrder.quantity,
      totalPrice: newOrder.totalPrice
    });
    console.log(`✅ Notification sent`);

    // ─────────────────────────────────────────────────
    // Step 7: Return success response
    // ─────────────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder,
      notification: notificationResult
    });

  } catch (error) {
    console.error(`❌ Order creation failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Order creation failed: ${error.message}`
    });
  }
};

module.exports = { getAllOrders, getOrderById, createOrder };