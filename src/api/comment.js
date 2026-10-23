/**
 * 小红书评论模块
 */
const constants = require("../config/constants");
const { requestApi, pollTaskResult } = require("../utils/request");
const { SkillError } = require("../utils/errors");

function commentBody(url, expiredAt, limit) {
  const data = { url, limit };
  if (expiredAt !== undefined) data.expired_at = expiredAt;
  return data;
}

/**
 * 创建小红书评论任务。expiredAt 未传时由命令先换成时间点再调用。
 * @param {string} token
 * @param {string} url
 * @param {number|string|undefined} expiredAt
 * @param {number} limit
 * @returns {Promise<object>}
 */
async function createCommentTask(token, url, expiredAt, limit) {
  return await requestApi(
    "POST",
    "/api/xiaohongshu/comment/url",
    { _: Date.now() },
    commentBody(url, expiredAt, limit),
    token,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
}

/**
 * 获取小红书评论任务结果。
 * @returns {Promise<Array>}
 */
async function getCommentTask(token, url, expiredAt, limit) {
  const response = await pollTaskResult(
    "/api/xiaohongshu/comment/info",
    commentBody(url, expiredAt, limit),
    token,
    "查询任务",
  );
  if (response.data == null) return [];
  if (!Array.isArray(response.data)) {
    throw new SkillError("API_ERROR", "评论结果格式错误: data 不是数组", true);
  }
  return response.data;
}

module.exports = {
  createCommentTask,
  getCommentTask,
};
