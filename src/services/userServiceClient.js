const axios = require('axios');

// This URL will be:
// - localhost when running locally
// - The real cloud URL when deployed on AWS
// We use environment variables so we don't hardcode URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Check if a user exists by calling User Service
const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    return response.data; // Returns { success: true, data: { id, name, email } }
  } catch (error) {
    // If user not found, axios throws an error
    if (error.response && error.response.status === 404) {
      return { success: false, message: 'User not found' };
    }
    // If User Service is completely down
    throw new Error(`User Service unavailable: ${error.message}`);
  }
};

module.exports = { getUserById };