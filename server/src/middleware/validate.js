const Joi = require('joi');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    req[target] = value;
    next();
  };
}

module.exports = { validate };
