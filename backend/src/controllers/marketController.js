const marketService = require('../services/marketService');
const logger = require('../config/winston');

const marketController = {
  async getLivePrice(req, res, next) {
    try {
      const { symbol } = req.params;
      const priceData = await marketService.getLivePrice(symbol);

      logger.info(`Live Price Retrieved: ${symbol} = $${priceData.price}`, {
        correlationId: req.correlationId,
        endpoint: `/api/v1/market/price/${symbol}`,
        userId: req.user ? req.user.id : undefined,
        symbol,
        price: priceData.price,
      });

      return res.status(200).json({
        success: true,
        message: 'Live market price retrieved successfully.',
        data: priceData,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = marketController;
