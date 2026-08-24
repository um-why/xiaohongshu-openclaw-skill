const fs = require("fs");
const path = require("path");

let cached = null;
function skillName() {
  if (cached) return cached;
  const pkgPath = path.join(
    path.dirname(__filename),
    "..",
    "..",
    "package.json",
  );
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  cached = pkg.name;
  return cached;
}

module.exports = {
  skillName,
};
