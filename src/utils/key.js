/**
 * TOKEN 管理模块
 */
const utils = require("./utils");

function isValidToken(token) {
  if (!token || typeof token !== "string") return false;
  if (token.length < 16 || token.length > 256) return false;
  if (!/^[0-9a-zA-Z_-]+$/.test(token)) return false;
  return true;
}

/**
 * @param {string|undefined} token
 * @returns {string} 有效令牌；无效时返回空字符串
 */
function skillKey(token) {
  token = (token || "").trim();
  if (!token) {
    utils.printError(
      "GUAIKEI_API_TOKEN 未配置。可通过 https://www.guaikei.com 自助开通后配置环境变量。",
    );
    return "";
  }
  if (!isValidToken(token)) {
    utils.printError(
      "GUAIKEI_API_TOKEN 格式无效。须为 16-256 位字母、数字、下划线或连字符。",
    );
    return "";
  }

  utils.printInfo("已使用配置的私有TOKEN");
  return token;
}

module.exports = {
  skillKey,
};
