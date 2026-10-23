/**
 * 固定为北京时间，格式如 2026/9/4 20:13:20，月和日不补零。
 * @param {Date} date
 * @returns {string}
 */
function formatBeijingTime(date) {
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hour = String(shifted.getUTCHours()).padStart(2, "0");
  const minute = String(shifted.getUTCMinutes()).padStart(2, "0");
  const second = String(shifted.getUTCSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

module.exports = {
  formatBeijingTime,
};
