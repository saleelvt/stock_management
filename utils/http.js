class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const success = (res, statusCode, data, meta) => {
  return res.status(statusCode).json({ success: true, data, meta });
};

const fail = (res, statusCode, message, details) => {
  return res.status(statusCode).json({ success: false, message, details });
};

const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

// Global error handler
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details;
  res.status(statusCode).json({ success: false, message, details });
};

module.exports = { AppError, success, fail, notFoundMiddleware, errorMiddleware };


