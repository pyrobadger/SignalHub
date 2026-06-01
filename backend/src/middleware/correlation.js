const { v4: uuidv4 } = require('uuid');

const correlation = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
};

module.exports = correlation;
