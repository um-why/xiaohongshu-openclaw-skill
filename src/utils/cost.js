/**
 * 从 REST 取数响应中提取可选 cost（与 errcode/data 同级）。
 * @param {object} [response]
 * @returns {number|undefined}
 */
function pickCost(response) {
  if (!response || typeof response !== "object") return undefined;
  const c = response.cost;
  if (typeof c === "number" && Number.isFinite(c)) return c;
  return undefined;
}

/** 标准 UUID 字符串（8-4-4-4-12，共 36 字符，含连字符） */
const TASK_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 从 Create 成功响应提取任务 id（uuid）。缺失或非 36 位 uuid 形态时返回 undefined（查询仅带业务字段）。
 * @param {object} [response]
 * @returns {string|undefined}
 */
function pickTaskId(response) {
  if (!response || typeof response !== "object") return undefined;
  const id = typeof response.id === "string" ? response.id.trim() : "";
  if (!id || !TASK_UUID_RE.test(id)) return undefined;
  return id;
}

module.exports = { pickCost, pickTaskId };
