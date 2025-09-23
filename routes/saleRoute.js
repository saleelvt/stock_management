const express = require('express');
const { createSale, listSales, listSalesByCustomer, getSale } = require('../controller/saleController');

const router = express.Router();

router.get('/', listSales);
router.get('/by-customer', listSalesByCustomer);
router.get('/customers/search', listSalesByCustomer);
router.post('/', createSale);
router.get('/:id([a-fA-F0-9]{24})', getSale);

module.exports = router;


