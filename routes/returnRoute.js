const express = require('express');
const { createReturn, listReturnsByCustomer, listAllReturns } = require('../controller/returnController');

const router = express.Router();

router.post('/', createReturn);
router.get('/', listAllReturns);
router.get('/by-customer', listReturnsByCustomer);

module.exports = router;


