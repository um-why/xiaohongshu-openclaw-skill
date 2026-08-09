/**
 * 小红书评论模块
 */
const constants = require("../config/constants");
const { postJson, getJson } = require("../utils/request");
const { withRetry } = require("../utils/retry");
const utils = require("../utils/utils");

/**
 * 创建小红书评论任务
 * @param {string} token - API令牌
 * @param {string} url - 笔记链接
 * @param {number} limit - 评论数量, 1-10000
 * @returns  {Promise<Object>} 评论任务状态
 * @throws {Error} API调用失败时抛出错误
 */
async function createCommentTask(token, url, limit) {
  return await withRetry(
    async () => {
      return await postJson(
        "/api/xiaohongshu/comment/url",
        { _: Date.now(), token: token },
        { url, limit },
      );
    },
    constants.CREATE_MAX_ATTEMPTS,
    (attempt, err) => {
      utils.printError(
        `【创建任务重试】 ${attempt + 1}/${constants.CREATE_MAX_ATTEMPTS} 次 - ${err.message}`,
      );
    },
  );
}

/**
 * 获取小红书评论任务结果
 * @param {string} token - API令牌
 * @param {string} url - 笔记链接
 * @param {number} limit - 评论数量, 1-10000
 * @returns {Promise<Object>} 评论数组
 * @throws {Error} API调用失败时抛出错误
 */
async function getCommentTask(token, url, limit) {
  return await withRetry(
    async () => {
      const res = await getJson("/api/xiaohongshu/comment/info", {
        _: Date.now(),
        token: token,
        url,
        limit,
      });
      return res.data;
    },
    constants.QUERY_MAX_ATTEMPTS,
    (attempt, err) => {
      utils.printError(
        `【查询任务重试】 ${attempt + 1}/${constants.QUERY_MAX_ATTEMPTS} 次 - ${err.message}`,
      );
    },
  );
}

module.exports = {
  createCommentTask,
  getCommentTask,
};
