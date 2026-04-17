const fs = require("fs");
const path = require("path");
const utils = require("./utils");

async function taskWrite(filename, content) {
  const outputFilename = path.join(
    path.dirname(__filename),
    "..",
    "..",
    "logs",
    filename,
  );
  if (!fs.existsSync(path.dirname(outputFilename))) {
    fs.mkdirSync(path.dirname(outputFilename));
  }
  fs.writeFileSync(outputFilename, content);
  utils.printSuccess(`  → 已保存到 ${outputFilename}`);
}

module.exports = {
  taskWrite,
};
