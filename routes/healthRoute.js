const express = require('express');
const { healthz, readyz } = require('../controller/healthController');

const router = express.Router();

// Liveness and Readiness routes (controller holds logic)
router.get('/healthz', healthz);
router.get('/readyz', readyz);

module.exports = router;


