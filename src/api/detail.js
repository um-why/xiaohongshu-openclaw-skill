/**
 * 小红书笔记详情模块
 */
const constants = require("../config/constants");
const { requestApi, pollTaskResult } = require("../utils/request");
const { SkillError } = require("../utils/errors");

/**
 * 创建小红书笔记详情任务
 * @param {string} token
 * @param {string} url
 * @returns {Promise<object>}
 */
async function createDetailTask(token, url) {
  return await requestApi(
    "POST",
    "/api/xiaohongshu/detail/url",
    { _: Date.now() },
    { url },
    token,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
}

/**
 * 丢掉接口可能带回的 error 字段。只有 error、没有笔记 id 时视为业务失败。
 * @param {object} data
 * @returns {object|null}
 */
function processDetail(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new SkillError("API_ERROR", "详情结果格式错误: data 不是对象", true);
  }
  const errorText = typeof data.error === "string" ? data.error.trim() : "";
  const result = { ...data };
  delete result.error;
  if (!result.id) {
    if (errorText) {
      throw new SkillError("API_ERROR", errorText, true);
    }
    return null;
  }
  return result;
}

/**
 * 获取小红书笔记详情。返回接口 data 对象，不追加文档以外的字段。
 * @returns {Promise<object|null>}
 */
async function getDetailTask(token, url) {
  const response = await pollTaskResult(
    "/api/xiaohongshu/detail/info",
    { url },
    token,
    "查询任务",
  );
  if (response.data == null) return null;
  return processDetail(response.data);
}

module.exports = {
  createDetailTask,
  getDetailTask,
};
