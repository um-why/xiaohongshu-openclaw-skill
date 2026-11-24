/**
 * 小红书评论模块
 */
const constants = require("../config/constants");
const { requestApi, pollTaskResult } = require("../utils/request");
const { pickCost, pickTaskId } = require("../utils/cost");
const { SkillError } = require("../utils/errors");

function commentBody(url, expiredAt, limit) {
  const data = { url, limit };
  if (expiredAt !== undefined) data.expired_at = expiredAt;
  return data;
}

/**
 * 创建小红书评论任务。expiredAt 未传时由命令先换成时间点再调用。
 * @returns {Promise<string|undefined>} Create 成功时的任务 id（uuid）
 */
async function createCommentTask(token, url, expiredAt, limit) {
  const response = await requestApi(
    "POST",
    "/api/xiaohongshu/comment/url",
    { _: Date.now() },
    commentBody(url, expiredAt, limit),
    token,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
  return pickTaskId(response);
}

/**
 * 获取小红书评论任务结果。
 * @param {string} [taskId] Create 返回的任务 id；有则查询只传 id（不带业务字段）
 * @returns {Promise<{ results: Array, cost?: number }>}
 */
async function getCommentTask(token, url, expiredAt, limit, taskId) {
  const params = taskId
    ? { id: taskId }
    : commentBody(url, expiredAt, limit);
  const response = await pollTaskResult(
    "/api/xiaohongshu/comment/info",
    params,
    token,
    "查询任务",
  );
  const cost = pickCost(response);
  if (response.data == null) return { results: [], cost };
  if (!Array.isArray(response.data)) {
    throw new SkillError("API_ERROR", "评论结果格式错误: data 不是数组", true);
  }
  return { results: response.data, cost };
}

module.exports = {
  createCommentTask,
  getCommentTask,
};
