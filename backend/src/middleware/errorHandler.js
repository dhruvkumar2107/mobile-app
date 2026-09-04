function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    if (err.stack) console.error(err.stack);
  }

  const response = {
    success: false,
    error: isProduction && statusCode === 500 ? 'Internal Server Error' : err.message || 'Internal Server Error',
  };

  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = { errorHandler, createError };
