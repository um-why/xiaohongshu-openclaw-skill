const fs = require("fs");
const path = require("path");

function skillName() {
  const pkgPath = path.join(
    path.dirname(__filename),
    "..",
    "..",
    "package.json",
  );
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return pkg.name;
}

module.exports = {
  skillName,
};
