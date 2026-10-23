const fs = require("fs");
const path = require("path");

const FALLBACK_NAME = "xiaohongshu-tool";

let cached = null;
function skillName() {
  if (cached) return cached;
  try {
    const pkgPath = path.join(
      path.dirname(__filename),
      "..",
      "..",
      "package.json",
    );
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg && typeof pkg.name === "string" && pkg.name) {
      cached = pkg.name;
      return cached;
    }
  } catch (_) {
    // 忽略：package.json 缺失/损坏时不应阻断请求
  }
  cached = FALLBACK_NAME;
  return cached;
}

module.exports = {
  skillName,
};
