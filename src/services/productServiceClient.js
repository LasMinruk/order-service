const axios = require('axios');

// This URL will be:
// - localhost when running locally
// - The real cloud URL when deployed on AWS
// We use environment variables so we don't hardcode URLs
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Check if a product exists by calling Product Service
const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`);
    return response.data; // Returns { success: true, data: { id, name, price, stock } }
  } catch (error) {
    // If product not found, axios throws an error
    if (error.response && error.response.status === 404) {
      return { success: false, message: 'Product not found' };
    }
    // If Product Service is completely down
    throw new Error(`Product Service unavailable: ${error.message}`);
  }
};

// Reduce stock in Product Service
const reduceStock = async (productId, quantity) => {
  try {
    const response = await axios.patch(`${PRODUCT_SERVICE_URL}/products/${productId}/stock`, {
      quantity
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to reduce stock: ${error.message}`);
  }
};

module.exports = { getProductById, reduceStock };

