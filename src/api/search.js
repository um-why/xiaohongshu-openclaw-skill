/**
 * 小红书笔记搜索模块
 */
const constants = require("../config/constants");
const { requestApi, pollTaskResult } = require("../utils/request");
const { pickCost, pickTaskId } = require("../utils/cost");
const { SkillError } = require("../utils/errors");

/**
 * 创建小红书笔记搜索任务
 * @returns {Promise<string|undefined>} Create 成功时的任务 id（uuid）
 */
async function createSearchTask(token, keyword, type, sort, time, limit) {
  const response = await requestApi(
    "POST",
    "/api/xiaohongshu/note-search/keyword",
    { _: Date.now() },
    { keyword, type, sort, time, limit },
    token,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
  return pickTaskId(response);
}

/**
 * 获取小红书笔记搜索任务结果。返回接口 data 数组，不追加文档以外的字段。
 * @param {string} [taskId] Create 返回的任务 id；有则查询只传 id（不带业务字段）
 * @returns {Promise<{ results: Array, cost?: number }>}
 */
async function getSearchTask(token, keyword, type, sort, time, limit, taskId) {
  const params = taskId
    ? { id: taskId }
    : { keyword, type, sort, time, limit };
  const response = await pollTaskResult(
    "/api/xiaohongshu/note-search/info",
    params,
    token,
    "查询任务",
  );
  const cost = pickCost(response);
  if (!Array.isArray(response.data)) {
    throw new SkillError("API_ERROR", "搜索结果格式错误: data 不是数组", true);
  }
  return { results: response.data, cost };
}

module.exports = {
  createSearchTask,
  getSearchTask,
};
