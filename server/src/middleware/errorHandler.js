/**
 * Global Error Handler — catches all errors thrown in route handlers.
 * Returns structured JSON responses with appropriate status codes.
 * In development mode, includes the full stack trace.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID format';
  }

  // Mongoose duplicate key (e.g., duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'credential';
    message = `An account with this ${field} already exists.`;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  console.error(`❌ [${statusCode}] ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
