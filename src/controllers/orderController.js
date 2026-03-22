const Order = require('../models/Order');
const { getUserById } = require('../services/userServiceClient');
const { getProductById, reduceStock } = require('../services/productServiceClient');
const { sendOrderNotification } = require('../services/notificationServiceClient');

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: `Order with ID ${req.params.id} not found` });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ success: false, message: `Order with ID ${req.params.id} not found` });
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrder = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity)
    return res.status(400).json({ success: false, message: 'Please provide userId, productId, and quantity' });

  // Fix 1: Number.isNaN instead of isNaN
  if (Number.isNaN(Number(quantity)) || quantity <= 0)
    return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });

  try {
    // Fix 2: Remove console.log with user-controlled userId
    console.log('🔍 Checking user with User Service...');
    const userResponse = await getUserById(userId);
    if (!userResponse.success) return res.status(404).json({ success: false, message: `Cannot create order: ${userResponse.message}` });
    const user = userResponse.data;
    // Fix 3: Remove console.log with user-controlled user.name
    console.log('✅ User verified successfully');

    // Fix 4: Remove console.log with user-controlled productId
    console.log('🔍 Checking product with Product Service...');
    const productResponse = await getProductById(productId);
    if (!productResponse.success) return res.status(404).json({ success: false, message: `Cannot create order: ${productResponse.message}` });
    const product = productResponse.data;
    // Fix 5: Remove console.log with user-controlled product.name
    console.log('✅ Product verified successfully');

    if (product.stock < quantity)
      return res.status(400).json({ success: false, message: `Insufficient stock. Requested: ${quantity}, Available: ${product.stock}` });

    // Fix 6 & 7: Number.parseInt instead of parseInt
    const qty = Number.parseInt(quantity, 10);
    const totalPrice = product.price * qty;

    const newOrder = await Order.create({
      userId,
      userName: user.name,
      userEmail: user.email,
      productId,
      productName: product.name,
      quantity: qty,
      unitPrice: product.price,
      totalPrice,
      status: 'confirmed'
    });
    console.log(`✅ Order created: ${newOrder._id}`);

    console.log('📦 Updating stock...');
    await reduceStock(productId, qty);
    console.log('✅ Stock updated');

    console.log('📧 Sending notification...');
    const notificationResult = await sendOrderNotification({
      orderId: newOrder._id,
      userName: user.name,
      userEmail: user.email,
      productName: product.name,
      quantity: newOrder.quantity,
      totalPrice: newOrder.totalPrice
    });
    console.log('✅ Notification sent');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder,
      notification: notificationResult
    });
  } catch (error) {
    console.error('❌ Order creation failed');
    res.status(500).json({ success: false, message: `Order creation failed: ${error.message}` });
  }
};

module.exports = { getAllOrders, getOrderById, createOrder };