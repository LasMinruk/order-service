const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// Send order notification to Notification Service
const sendOrderNotification = async (orderData) => {
  try {
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/notifications/order`,
      orderData
    );
    return response.data;
  } catch (error) {
    // We don't fail the order if notification fails
    // Just log it - notification is non-critical
    console.error(`⚠️  Notification Service error: ${error.message}`);
    return { success: false, message: 'Notification failed but order was created' };
  }
};

module.exports = { sendOrderNotification };