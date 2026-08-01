const constants = require("../config/constants");

async function withRetry(fn, maxAttempts, errorHandler) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (errorHandler) errorHandler(attempt, error);
      if (error.nonRetryable) throw error;
      if (attempt < maxAttempts - 1) {
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
