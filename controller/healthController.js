const mongoose = require('../config/db');

// Liveness: process is up
const healthz = (req, res) => {
  res.status(200).json({ status: 'ok' });
};

// Readiness: dependencies (e.g., MongoDB) are ready
const readyz = (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1; // 1 = connected
  const details = {
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoReady ? 'connected' : 'not_connected'
    }
  };

  if (mongoReady) {
    return res.status(200).json({ status: 'ready', ...details });
  }
  return res.status(503).json({ status: 'not_ready', ...details });
};

module.exports = { healthz, readyz };


