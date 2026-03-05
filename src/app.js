const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Import routes
const orderRoutes = require('./routes/orderRoutes');

// Mount routes
app.use('/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'order-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dependencies: {
      userService: process.env.USER_SERVICE_URL || 'http://localhost:3001',
      productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
      notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'
    }
  });
});

// Handle unknown routes - using regex pattern for catch-all
app.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;