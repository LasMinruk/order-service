const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: 'confirmed', enum: ['confirmed', 'cancelled', 'delivered'] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);