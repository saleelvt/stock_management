const mongoose = require('../config/db');
const Product = require('../model/Product');
const Sale = require('../model/Sale');
const { success, fail } = require('../utils/http');

const normalizeItem = (raw) => {
  if (!raw) return null;
  const productCode = (raw.productCode || '').toString().trim();
  const size = (raw.size || '').toString().trim();
  const quantity = Number(raw.quantity || 0);
  const color = (raw.color || '').toString().trim();
  if (!productCode || !size || !quantity || quantity <= 0) return null;
  return { productCode, size, quantity, color };
};

const createSale = async (req, res) => {
  const { customerName, items, notes } = req.body;
  if (!customerName) return fail(res, 400, 'customerName is required');
  if (!Array.isArray(items) || items.length === 0) return fail(res, 400, 'items is required');

  const normalized = items.map(normalizeItem).filter(Boolean);
  if (normalized.length !== items.length) return fail(res, 400, 'Invalid item entries');

  const successfulDecrements = [];
  try {
    const saleItems = [];
    for (const it of normalized) {
      const updated = await Product.findOneAndUpdate(
        {
          productCode: it.productCode,
          'stockBySize.size': it.size,
          'stockBySize.quantity': { $gte: it.quantity }
        },
        { $inc: { 'stockBySize.$.quantity': -it.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new Error(`Insufficient stock or product/size not found for ${it.productCode} size ${it.size}`);
      }

      successfulDecrements.push({ productId: updated._id, size: it.size, quantity: it.quantity });
      saleItems.push({
        product: updated._id,
        productCode: updated.productCode,
        size: it.size,
        quantity: it.quantity,
        color: it.color || updated.color
      });
    }

    const totalItems = saleItems.reduce((s, i) => s + i.quantity, 0);
    const sale = await Sale.create({ customerName, items: saleItems, notes: notes || '', totalItems });
    return success(res, 201, sale);
  } catch (err) {
    // Roll back successful decrements
    for (const d of successfulDecrements) {
      await Product.updateOne(
        { _id: d.productId, 'stockBySize.size': d.size },
        { $inc: { 'stockBySize.$.quantity': d.quantity } }
      );
    }
    return fail(res, 400, 'Sale creation failed', err.message);
  }
};

const listSales = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const filters = {};
    const customer = (req.query.customer || req.query.name || '').toString().trim();
    if (customer) {
      filters.customerName = new RegExp(customer, 'i');
    }
    const [items, total] = await Promise.all([
      Sale.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Sale.countDocuments(filters)
    ]);
    return success(res, 200, items, { page, limit, total });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch sales', err.message);
  }
};

const listSalesByCustomer = async (req, res) => {
  try {
    const name = (req.query.name || req.query.q || '').toString().trim();
    if (!name) return fail(res, 400, 'name query param is required');
    const items = await Sale.find({ customerName: new RegExp(name, 'i') }).sort({ createdAt: -1 }).lean();
    const totalSales = items.length;
    const totalItems = items.reduce((sum, s) => sum + (s.totalItems || 0), 0);
    return success(res, 200, items, { totalSales, totalItems });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch customer sales', err.message);
  }
};

const getSale = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(id)) return fail(res, 400, 'Invalid sale id');
    const sale = await Sale.findById(id).lean();
    if (!sale) return fail(res, 404, 'Sale not found');
    return success(res, 200, sale);
  } catch (err) {
    return fail(res, 500, 'Failed to get sale', err.message);
  }
};

module.exports = { createSale, listSales, listSalesByCustomer, getSale };


