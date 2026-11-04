/**
 * 后端数字 errcode → Skill 稳定 error_code。
 * 仅映射已约定的业务码；其余仍以数字字符串透出。
 */
const { ApiError } = require("./errors");

const BACKEND_CODE_MAP = {
  14: {
    code: "PLAN_LIMIT",
    noRetry: true,
    defaultMessage:
      "当前 TOKEN 套餐单次条数超限（包月：搜索最多 40，作品最多 30，评论最多 20）。请降低 --limit，或到 www.guaikei.com 升级按量套餐",
  },
  // 小红书评论包月超限返回 16（与搜索/作品的 14 不同）
  16: {
    code: "PLAN_LIMIT",
    noRetry: true,
    defaultMessage:
      "当前 TOKEN 套餐单次条数超限（包月：搜索最多 40，作品最多 30，评论最多 20）。请降低 --limit，或到 www.guaikei.com 升级按量套餐",
  },
};

/**
 * @param {number} errcode
 * @param {string} [errmsg]
 * @returns {ApiError}
 */
function mapBackendApiError(errcode, errmsg) {
  const mapped = BACKEND_CODE_MAP[errcode];
  if (mapped) {
    return new ApiError(
      mapped.code,
      (errmsg && String(errmsg).trim()) || mapped.defaultMessage,
      mapped.noRetry !== false,
    );
  }
  return new ApiError(
    errcode.toString(),
    errmsg || "请求失败",
    errcode >= 10,
  );
}

module.exports = {
  BACKEND_CODE_MAP,
  mapBackendApiError,
};
