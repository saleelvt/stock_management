const mongoose = require('../config/db');

const SaleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productCode: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String, trim: true }
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    items: { type: [SaleItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
    notes: { type: String, trim: true, default: '' },
    totalItems: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

const Sale = mongoose.model('Sale', SaleSchema);
module.exports = Sale;


