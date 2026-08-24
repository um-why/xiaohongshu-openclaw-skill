const pkg = require("../../package.json");
module.exports = {
  BASE_URL: "www.guaikei.com",
  REQUEST_TIMEOUT: 20000,
  CREATE_MAX_ATTEMPTS: 3,
  QUERY_MAX_ATTEMPTS: 20,
  RETRY_INTERVAL: 2000,
  VERSION: pkg.version,
};
