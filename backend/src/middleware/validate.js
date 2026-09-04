const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      error: firstError.msg || 'Validation failed',
      details: errors.array(),
    });
  }
  next();
}

module.exports = { validate };
