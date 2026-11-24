/**
 * 后端数字 errcode → Skill 稳定 error_code（封闭枚举，不把裸数字透出给信封）。
 * 顺序：包月文案 → 余额（15/17 / 文案；详情 14=余额靠文案先命中）→ 裸 14/16 作 PLAN_LIMIT → 频控 → 日限
 * → 鉴权态（410 停用 / 405 未开通 / 77 过期）→ 未知码兜底 API_ERROR。
 * 同码异义：搜索/作品 14=包月；评论 16=包月；详情 14=余额（须带余额文案）。
 * 注意：业务 errcode 410 = TOKEN 状态异常，不是「接口下线 / 任务过期」。
 */
const { ApiError, AuthError } = require("./errors");

const PLAN_LIMIT_RE =
  /包月TOKEN|搜索量受限|作品量受限|评论量受限|获取量受限|最多支持\d+条/;
const BALANCE_RE = /余额可能不足|TOKEN余额|请通过www\.guaikei\.com充值/;
const RATE_RE = /短时间内请勿提交过多/;
const DAY_LIMIT_RE = /今日消费已达每日上限|每日消费限额|每日上限/;
const TOKEN_DISABLED_RE = /^Gone$/i;
const TOKEN_EXPIRED_RE = /TOKEN已过期|请通过www\.guaikei\.com延期/;
const FEATURE_CLOSED_RE = /^Method Not Allowed$/i;

const PLAN_LIMIT_FALLBACK =
  "当前 TOKEN 套餐单次条数超限（包月：搜索最多 40，作品最多 30，评论最多 20）。请降低 --limit，或到 www.guaikei.com 升级按量套餐";

const TOKEN_DISABLED_MSG =
  "GUAIKEI_API_TOKEN 已停用或状态异常，请到 www.guaikei.com 检查 TOKEN 或联系客服（不是接口下线）";
const FEATURE_CLOSED_MSG =
  "当前 TOKEN 未开通该接口权限，请到 www.guaikei.com 开通对应能力后重试";
const TOKEN_EXPIRED_MSG =
  "TOKEN 已过期，请通过 www.guaikei.com 延期后重试";

/**
 * @param {number} errcode
 * @param {string} [errmsg]
 * @returns {ApiError|AuthError}
 */
function mapBackendApiError(errcode, errmsg) {
  const msg = (errmsg && String(errmsg).trim()) || "";

  if (PLAN_LIMIT_RE.test(msg)) {
    return new ApiError("PLAN_LIMIT", msg || PLAN_LIMIT_FALLBACK, true);
  }

  // 15=搜/作品余额；17=评论余额；详情 14=余额（靠 errmsg）
  if (errcode === 15 || errcode === 17 || BALANCE_RE.test(msg)) {
    return new ApiError(
      "INSUFFICIENT_BALANCE",
      msg ||
        "TOKEN 余额可能不足，请通过 www.guaikei.com 充值后重试",
      true,
    );
  }

  // 14=搜索/作品包月；16=评论包月（errmsg 缺失时仍稳定）
  if (errcode === 14 || errcode === 16) {
    return new ApiError("PLAN_LIMIT", msg || PLAN_LIMIT_FALLBACK, true);
  }

  if (errcode === 2 || RATE_RE.test(msg)) {
    return new ApiError(
      "RATE_LIMITED",
      msg || "短时间内请勿提交过多任务，请稍后重试",
      true,
    );
  }

  if (errcode === 18 || DAY_LIMIT_RE.test(msg)) {
    return new ApiError(
      "DAILY_LIMIT",
      msg ||
        "今日消费已达每日上限，请明日再试，或登录 www.guaikei.com 调整每日消费限额",
      true,
    );
  }

  if (errcode === 401 || errcode === 403) {
    const e = new AuthError(
      "GUAIKEI_API_TOKEN 无效, 请检查环境变量 或 通过 www.guaikei.com 联系客服获取解决方案",
    );
    e.noRetry = true;
    return e;
  }

  if (errcode === 410 || TOKEN_DISABLED_RE.test(msg)) {
    const e = new AuthError(TOKEN_DISABLED_MSG);
    e.noRetry = true;
    return e;
  }

  if (errcode === 405 || FEATURE_CLOSED_RE.test(msg)) {
    const e = new AuthError(FEATURE_CLOSED_MSG);
    e.noRetry = true;
    return e;
  }

  if (errcode === 77 || TOKEN_EXPIRED_RE.test(msg)) {
    const e = new AuthError(msg || TOKEN_EXPIRED_MSG);
    e.noRetry = true;
    return e;
  }

  const detail = msg
    ? `${msg}（上游 errcode=${errcode}）`
    : `上游返回未映射业务码 errcode=${errcode}`;
  return new ApiError("API_ERROR", detail, errcode >= 10);
}

module.exports = {
  mapBackendApiError,
  PLAN_LIMIT_RE,
  BALANCE_RE,
  RATE_RE,
  DAY_LIMIT_RE,
};
