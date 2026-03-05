const app = require('./src/app');

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`✅ Order Service is running on port ${PORT}`);
  console.log(`📍 Health check:    http://localhost:${PORT}/health`);
  console.log(`📋 Orders endpoint: http://localhost:${PORT}/orders`);
  console.log(`\n🔗 Connected to:`);
  console.log(`   👤 User Service:         ${process.env.USER_SERVICE_URL || 'http://localhost:3001'}`);
  console.log(`   📦 Product Service:      ${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`   🔔 Notification Service: ${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'}`);
});