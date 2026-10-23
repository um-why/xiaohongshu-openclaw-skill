/**
 * 小红书博主笔记模块
 */
const constants = require("../config/constants");
const { requestApi, pollTaskResult } = require("../utils/request");
const { SkillError } = require("../utils/errors");

/**
 * 创建小红书博主笔记任务
 * @param {string} token
 * @param {string} url
 * @param {number} limit 0 表示只要博主信息
 * @returns {Promise<object>}
 */
async function createPostTask(token, url, limit) {
  return await requestApi(
    "POST",
    "/api/xiaohongshu/post/url",
    { _: Date.now() },
    { url, limit },
    token,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
}

/**
 * 只保留 note 与 user。仅有 error 时视为业务失败。
 * @param {object} data
 * @returns {{note?: Array, user?: object}|null}
 */
function processPost(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new SkillError("API_ERROR", "作品结果格式错误: data 不是对象", true);
  }
  const result = {};
  if (Array.isArray(data.note)) result.note = data.note;
  if (data.user && typeof data.user === "object" && !Array.isArray(data.user)) {
    result.user = data.user;
  }
  const hasNotes = Array.isArray(result.note) && result.note.length > 0;
  const hasUser = result.user && Object.keys(result.user).length > 0;
  const errorText = typeof data.error === "string" ? data.error.trim() : "";
  if (!hasNotes && !hasUser) {
    if (errorText) throw new SkillError("API_ERROR", errorText, true);
    return null;
  }
  return result;
}

/**
 * 获取小红书博主笔记任务结果。
 * @returns {Promise<{note?: Array, user?: object}|null>}
 */
async function getPostTask(token, url, limit) {
  const response = await pollTaskResult(
    "/api/xiaohongshu/post/info",
    { url, limit },
    token,
    "查询任务",
  );
  if (response.data == null) return null;
  return processPost(response.data);
}

module.exports = {
  createPostTask,
  getPostTask,
};
