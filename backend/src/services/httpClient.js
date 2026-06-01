const logger = require('../config/winston');

const httpClient = {
  /**
   * Reusable HTTP Request method with timeout, retries, and exponential backoff
   * @param {string} url 
   * @param {object} options 
   * @param {number} retries 
   * @param {number} timeout 
   * @param {number} backoffFactor 
   * @returns {Promise<any>}
   */
  async request(url, options = {}, retries = 3, timeout = 5000, backoffFactor = 200) {
    let attempt = 0;
    
    while (attempt <= retries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        logger.info(`External API Call (Attempt ${attempt + 1}/${retries + 1}): ${url}`, {
          url,
          attempt: attempt + 1,
        });

        const fetchOptions = {
          ...options,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            ...(options.headers || {}),
          }
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error response: Status ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        attempt++;

        const isTimeout = error.name === 'AbortError';
        const errorMessage = isTimeout ? 'Request timed out after 5000ms' : error.message;

        logger.warn(`External call failed (Attempt ${attempt}): ${errorMessage}`, {
          url,
          attempt,
          isTimeout,
        });

        if (attempt > retries) {
          throw new Error(`External Request Failed: ${errorMessage} after ${retries} retries`);
        }

        // Exponential backoff delay (2^attempt * backoffFactor)
        const delay = Math.pow(2, attempt) * backoffFactor;
        logger.info(`Waiting ${delay}ms before retrying external request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

module.exports = httpClient;
