const httpClient = require('./httpClient');
const cache = require('../config/redis');
const logger = require('../config/winston');
const AppError = require('../utils/AppError');

const CACHE_TTL_SECONDS = 15;

const marketService = {
  async getLivePrice(symbol) {
    if (!symbol) {
      throw new AppError('Asset symbol is required.', 400);
    }
    
    const uppercaseSymbol = symbol.trim().toUpperCase();
    const cacheKey = `price:${uppercaseSymbol}`;

    // 1. Check Redis/In-Memory Cache
    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.info(`Cache Hit: Live price for ${uppercaseSymbol} retrieved from cache.`);
        return cachedData;
      }
    } catch (err) {
      logger.error(`Failed to retrieve cache for key ${cacheKey}: ${err.message}`);
    }

    // Cache Miss - Query External APIs
    logger.info(`Cache Miss: Fetching live price for ${uppercaseSymbol} from external APIs.`);

    // 2. Query Binance Public API (Primary Provider)
    try {
      const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${uppercaseSymbol}USDT`;
      const data = await httpClient.request(binanceUrl, {}, 3, 5000); // 3 retries, 5s timeout

      if (data && data.price) {
        const result = {
          symbol: uppercaseSymbol,
          price: parseFloat(parseFloat(data.price).toFixed(2)),
          currency: 'USD',
          source: 'Binance API'
        };

        // Cache the successful result
        await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
        return result;
      }
    } catch (binanceError) {
      logger.warn(`Primary Provider (Binance) failed for ${uppercaseSymbol}: ${binanceError.message}. Triggering Fallback to CoinCap...`);
    }

    // 3. Fallback: Query CoinCap API (Secondary Provider)
    try {
      const coincapUrl = `https://api.coincap.io/v2/assets?search=${uppercaseSymbol}`;
      const data = await httpClient.request(coincapUrl, {}, 3, 5000);

      if (data && data.data && Array.isArray(data.data)) {
        // Find exact symbol match
        const asset = data.data.find(
          item => item.symbol.toUpperCase() === uppercaseSymbol
        );

        if (asset && asset.priceUsd) {
          const result = {
            symbol: uppercaseSymbol,
            price: parseFloat(parseFloat(asset.priceUsd).toFixed(2)),
            currency: 'USD',
            source: 'CoinCap API (Fallback)'
          };

          // Cache the successful result
          await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
          return result;
        }
      }
    } catch (coincapError) {
      logger.error(`Fallback Provider (CoinCap) also failed for ${uppercaseSymbol}: ${coincapError.message}`);
    }

    // 4. Ultimate graceful fallback if both providers fail
    // If the symbol is BTC/ETH/SOL, return a mock price rather than crashing the frontend, but log a warning!
    // This is super premium: fallback mock pricing for key assets to maintain platform uptime under API outages
    const defaultPrices = {
      BTC: 68432.12,
      ETH: 3820.50,
      SOL: 165.75,
      BNB: 590.20,
    };

    if (defaultPrices[uppercaseSymbol]) {
      logger.warn(`API OUTAGE: Both primary and fallback APIs failed. Returning hardcoded default price for ${uppercaseSymbol}`);
      return {
        symbol: uppercaseSymbol,
        price: defaultPrices[uppercaseSymbol],
        currency: 'USD',
        source: 'Emergency Local Fallback'
      };
    }

    throw new AppError(
      `Failed to retrieve live market data for ${uppercaseSymbol}. Crypto price APIs are temporarily unavailable.`,
      502
    );
  }
};

module.exports = marketService;
