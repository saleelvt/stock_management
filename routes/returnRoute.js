const express = require('express');
const { createReturn, listReturnsByCustomer } = require('../controller/returnController');

const router = express.Router();

router.post('/', createReturn);
router.get('/by-customer', listReturnsByCustomer);

module.exports = router;


