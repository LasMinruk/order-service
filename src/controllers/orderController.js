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
  if (isNaN(quantity) || quantity <= 0)
    return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });

  try {
    console.log(`🔍 Checking user ${userId}...`);
    const userResponse = await getUserById(userId);
    if (!userResponse.success) return res.status(404).json({ success: false, message: `Cannot create order: ${userResponse.message}` });
    const user = userResponse.data;
    console.log(`✅ User verified: ${user.name}`);

    console.log(`🔍 Checking product ${productId}...`);
    const productResponse = await getProductById(productId);
    if (!productResponse.success) return res.status(404).json({ success: false, message: `Cannot create order: ${productResponse.message}` });
    const product = productResponse.data;
    console.log(`✅ Product verified: ${product.name}`);

    if (product.stock < quantity)
      return res.status(400).json({ success: false, message: `Insufficient stock. Requested: ${quantity}, Available: ${product.stock}` });

    const totalPrice = product.price * parseInt(quantity);

    const newOrder = await Order.create({
      userId,
      userName: user.name,
      userEmail: user.email,
      productId,
      productName: product.name,
      quantity: parseInt(quantity),
      unitPrice: product.price,
      totalPrice,
      status: 'confirmed'
    });
    console.log(`✅ Order created: ${newOrder._id}`);

    console.log(`📦 Updating stock...`);
    await reduceStock(productId, parseInt(quantity));
    console.log(`✅ Stock updated`);

    console.log(`📧 Sending notification...`);
    const notificationResult = await sendOrderNotification({
      orderId: newOrder._id,
      userName: user.name,
      userEmail: user.email,
      productName: product.name,
      quantity: newOrder.quantity,
      totalPrice: newOrder.totalPrice
    });
    console.log(`✅ Notification sent`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder,
      notification: notificationResult
    });
  } catch (error) {
    console.error(`❌ Order creation failed: ${error.message}`);
    res.status(500).json({ success: false, message: `Order creation failed: ${error.message}` });
  }
};

module.exports = { getAllOrders, getOrderById, createOrder };