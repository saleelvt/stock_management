const express = require('express');
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../controller/productController');

const router = express.Router();

router.get('/', listProducts);
router.post('/', createProduct);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;


