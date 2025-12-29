import logger from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error.statusCode = 404;
    error.message = message;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error.statusCode = 400;
    error.message = message;
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error.statusCode = 400;
    error.message = message;
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error.statusCode = 401;
    error.message = message;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error.statusCode = 401;
    error.message = message;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
