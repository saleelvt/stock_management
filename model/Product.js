const mongoose = require('../config/db');

const SizeStockSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 }
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, trim: true, unique: true, index: true },
    productName: { type: String, required: true, trim: true, index: true },
    brand: { type: String, trim: true, default: '' },
    color: { type: String, required: true, trim: true },
    stockBySize: { type: [SizeStockSchema], default: [] }
  },
  { timestamps: true }
);

ProductSchema.virtual('totalStock').get(function () {
  return (this.stockBySize || []).reduce((sum, s) => sum + (s.quantity || 0), 0);
});

// Ensure no duplicate sizes in the array when saving
ProductSchema.pre('validate', function (next) {
  if (!Array.isArray(this.stockBySize)) return next();
  const map = new Map();
  for (const entry of this.stockBySize) {
    const key = String(entry.size).trim();
    const qty = Number(entry.quantity) || 0;
    map.set(key, (map.get(key) || 0) + qty);
  }
  this.stockBySize = Array.from(map.entries()).map(([size, quantity]) => ({ size, quantity }));
  next();
});

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;


