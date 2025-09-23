const Product = require('../model/Product');
const { success, fail, AppError } = require('../utils/http');

const parseStockBySize = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeEntry).filter(Boolean);
  if (typeof raw === 'object') return Object.entries(raw).map(([size, quantity]) => normalizeEntry({ size, quantity })).filter(Boolean);
  return [];
};

const normalizeEntry = (entry) => {
  if (!entry) return null;
  const size = (entry.size ?? '').toString().trim();
  const quantity = Number(entry.quantity ?? entry.qty ?? entry.q ?? 0);
  if (!size || Number.isNaN(quantity) || quantity < 0) return null;
  return { size, quantity };
};

// Create
const createProduct = async (req, res) => {
  try {
    const { productCode, productName, brand, color } = req.body;
    const stockBySize = parseStockBySize(req.body.stockBySize);

    if (!productCode || !productName || !color) {
      return fail(res, 400, 'productCode, productName and color are required');
    }

    const exists = await Product.findOne({ productCode }).lean();
    if (exists) {
      return fail(res, 409, 'Product code already exists');
    }

    const product = await Product.create({ productCode, productName, brand, color, stockBySize });
    return success(res, 201, product);
  } catch (err) {
    return fail(res, 500, 'Failed to create product', err.message);
  }
};

// List with pagination and filters
const listProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.search) {
      const q = req.query.search.trim();
      filters.$or = [
        { productCode: new RegExp(q, 'i') },
        { productName: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { color: new RegExp(q, 'i') }
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filters)
    ]);

    return success(res, 200, items, { page, limit, total });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch products', err.message);
  }
};

// Get by id
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();
    if (!product) return fail(res, 404, 'Product not found');
    return success(res, 200, product);
  } catch (err) {
    return fail(res, 500, 'Failed to get product', err.message);
  }
};

// Update
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCode, productName, brand, color } = req.body;
    const stockBySize = req.body.stockBySize ? parseStockBySize(req.body.stockBySize) : undefined;

    const update = {};
    if (productCode !== undefined) update.productCode = productCode;
    if (productName !== undefined) update.productName = productName;
    if (brand !== undefined) update.brand = brand;
    if (color !== undefined) update.color = color;
    if (stockBySize !== undefined) update.stockBySize = stockBySize;

    if (Object.keys(update).length === 0) {
      return fail(res, 400, 'No fields to update');
    }

    if (update.productCode) {
      const exists = await Product.findOne({ _id: { $ne: id }, productCode: update.productCode }).lean();
      if (exists) return fail(res, 409, 'Product code already exists');
    }

    const product = await Product.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!product) return fail(res, 404, 'Product not found');
    return success(res, 200, product);
  } catch (err) {
    return fail(res, 500, 'Failed to update product', err.message);
  }
};

// Delete
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return fail(res, 404, 'Product not found');
    return success(res, 200, { deleted: true });
  } catch (err) {
    return fail(res, 500, 'Failed to delete product', err.message);
  }
};

module.exports = { createProduct, listProducts, getProduct, updateProduct, deleteProduct };


