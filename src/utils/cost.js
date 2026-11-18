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

module.exports = { pickCost };
