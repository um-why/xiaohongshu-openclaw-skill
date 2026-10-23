/**
 * 小红书笔记搜索模块
 */
const constants = require("../config/constants");
const { requestApi, pollTaskResult } = require("../utils/request");
const { SkillError } = require("../utils/errors");

/**
 * 创建小红书笔记搜索任务
 * @param {string} token
 * @param {string} keyword
 * @param {number} type 0 全部, 1 视频, 2 图文
 * @param {number} sort 0 综合, 1 最新, 2 最多点赞, 3 最多评论, 4 最多收藏
 * @param {number} time 0 全部, 1 一天内, 2 一周内, 3 半年内
 * @param {number} limit 1-10000
 * @returns {Promise<object>}
 */
async function createSearchTask(token, keyword, type, sort, time, limit) {
  return await requestApi(
    "POST",
    "/api/xiaohongshu/note-search/keyword",
    { _: Date.now() },
    { keyword, type, sort, time, limit },
    token,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
}

/**
 * 获取小红书笔记搜索任务结果。返回接口 data 数组，不追加文档以外的字段。
 * @returns {Promise<Array>}
 */
async function getSearchTask(token, keyword, type, sort, time, limit) {
  const response = await pollTaskResult(
    "/api/xiaohongshu/note-search/info",
    { keyword, type, sort, time, limit },
    token,
    "查询任务",
  );
  if (!Array.isArray(response.data)) {
    throw new SkillError("API_ERROR", "搜索结果格式错误: data 不是数组", true);
  }
  return response.data;
}

module.exports = {
  createSearchTask,
  getSearchTask,
};
