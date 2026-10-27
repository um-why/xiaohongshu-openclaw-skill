const constants = require("../config/constants");

/**
 * 重试执行函数。error.noRetry 为 true 时立即抛出。
 * @param {function} fn
 * @param {number} maxAttempts
 * @param {function} [errorHandler]
 * @returns {Promise<*>}
 */
async function withRetry(fn, maxAttempts, errorHandler) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (error && error.noRetry) throw error;
      if (attempt < maxAttempts - 1) {
        if (errorHandler) errorHandler(attempt, error);
        const delay = Math.min(
          Math.pow(2, attempt) * constants.RETRY_INTERVAL,
          60000,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error(`重试${maxAttempts}次后失败`);
}

module.exports = { withRetry };
