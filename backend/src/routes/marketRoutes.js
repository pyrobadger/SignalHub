const express = require('express');
const marketController = require('../controllers/marketController');
const validate = require('../middleware/validate');
const { livePriceParamSchema } = require('../validators/signalValidator');

const router = express.Router();

// Public endpoint to lookup live crypto prices
router.get('/price/:symbol', validate(livePriceParamSchema), marketController.getLivePrice);

module.exports = router;
