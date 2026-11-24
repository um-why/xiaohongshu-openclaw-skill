/**
 * 小红书笔记详情模块
 */
const constants = require("../config/constants");
const { requestApi, pollTaskResult } = require("../utils/request");
const { pickCost, pickTaskId } = require("../utils/cost");
const { SkillError } = require("../utils/errors");

/**
 * 创建小红书笔记详情任务
 * @returns {Promise<string|undefined>} Create 成功时的任务 id（uuid）
 */
async function createDetailTask(token, url) {
  const response = await requestApi(
    "POST",
    "/api/xiaohongshu/detail/url",
    { _: Date.now() },
    { url },
    token,
    constants.CREATE_MAX_ATTEMPTS,
    "创建任务",
  );
  return pickTaskId(response);
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
 * @param {string} [taskId] Create 返回的任务 id；有则查询只传 id（不带业务字段）
 * @returns {Promise<{ results: object|null, cost?: number }>}
 */
async function getDetailTask(token, url, taskId) {
  const params = taskId ? { id: taskId } : { url };
  const response = await pollTaskResult(
    "/api/xiaohongshu/detail/info",
    params,
    token,
    "查询任务",
  );
  const cost = pickCost(response);
  if (response.data == null) return { results: null, cost };
  return { results: processDetail(response.data), cost };
}

module.exports = {
  createDetailTask,
  getDetailTask,
};
