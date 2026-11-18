let version = "1.2.3";
try {
  const pkg = require("../../package.json");
  if (pkg && typeof pkg.version === "string" && pkg.version) {
    version = pkg.version;
  }
} catch (_) {
  // package.json 缺失时仍应能输出错误信封
}

module.exports = {
  BASE_URL: "www.guaikei.com",
  REQUEST_TIMEOUT: 20000,
  CREATE_MAX_ATTEMPTS: 3,
  QUERY_MAX_ATTEMPTS: 20,
  RETRY_INTERVAL: 2000,
  VERSION: version,
  /** 评论 expired_at 按「往前推天数」时的上限（约 6 年）；防止把 Unix 时间戳误当作天数。 */
  COMMENT_EXPIRED_AT_MAX_DAYS: 6 * 365,
};
