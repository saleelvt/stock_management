const mongoose = require('../config/db');
const Product = require('../model/Product');
const Sale = require('../model/Sale');
const Return = require('../model/Return');
const { success, fail } = require('../utils/http');

const createReturn = async (req, res) => {
  const { saleId, productCode, size, quantity, reason, notes } = req.body;
  if (!saleId || !productCode || !size || !quantity) {
    return fail(res, 400, 'saleId, productCode, size and quantity are required');
  }
  if (!/^[a-fA-F0-9]{24}$/.test(saleId)) return fail(res, 400, 'Invalid saleId');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sale = await Sale.findById(saleId).session(session);
    if (!sale) throw new Error('Sale not found');

    const line = sale.items.find(i => i.productCode === productCode && String(i.size).trim() === String(size).trim());
    if (!line) throw new Error('Product/size not found in sale');
    if (quantity > line.quantity) throw new Error('Return quantity exceeds sold quantity');

    const product = await Product.findOne({ productCode }).session(session);
    if (!product) throw new Error('Product not found');

    let sizeEntry = product.stockBySize.find(s => String(s.size).trim() === String(size).trim());
    if (!sizeEntry) {
      product.stockBySize.push({ size: String(size).trim(), quantity: 0 });
      sizeEntry = product.stockBySize[product.stockBySize.length - 1];
    }
    sizeEntry.quantity += Number(quantity);
    await product.save({ session });

    const ret = await Return.create([
      {
        sale: sale._id,
        customerName: sale.customerName,
        product: product._id,
        productCode: product.productCode,
        size: String(size).trim(),
        quantity: Number(quantity),
        color: line.color || product.color,
        reason: reason || '',
        notes: notes || ''
      }
    ], { session });

    await session.commitTransaction();
    session.endSession();
    return success(res, 201, ret[0]);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return fail(res, 400, 'Return creation failed', err.message);
  }
};

const listReturnsByCustomer = async (req, res) => {
  try {
    const name = (req.query.name || req.query.q || '').toString().trim();
    if (!name) return fail(res, 400, 'name query param is required');
    const items = await Return.find({ customerName: new RegExp(name, 'i') }).sort({ createdAt: -1 }).lean();
    return success(res, 200, items, { total: items.length });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch returns', err.message);
  }
};

const listAllReturns = async (req, res) => {
  try {
    const items = await Return.find({}).sort({ createdAt: -1 }).lean();
    return success(res, 200, items, { total: items.length });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch returns', err.message);
  }
};

module.exports = { createReturn, listReturnsByCustomer, listAllReturns };


