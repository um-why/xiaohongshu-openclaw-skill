/**
 * 通用 CLI 参数解析器
 */

/**
 * 读取 flag 后面的值, 若缺失或为另一个 flag 则报错
 * @param {string[]} args - 参数数组
 * @param {number} index - 当前 flag 的索引
 * @param {string} flagName - flag 名称 (用于错误提示)
 * @returns {string} 解析到的值
 * @throws {Error} 若值缺失或为另一个 flag
 */
function readValueAfterFlag(args, index, flagName) {
  const next = args[index + 1];
  if (next === undefined) {
    throw new Error(`参数 ${flagName} 缺少值`);
  }
  if (next.startsWith("-")) {
    throw new Error(`参数 ${flagName} 的值不能以 "-" 开头, 收到: "${next}"`);
  }
  return next;
}

/**
 * 通用 CLI 参数解析
 * @param {string[]} args - process.argv.slice(2)
 * @param {Object} schema - 选项定义
 * @param {Object} schema.flags - flag 定义, 形如:
 *   { "--keyword": { alias: "-k", key: "keyword", type: "string",
 *                    required: true, desc: "搜索关键词" } }
 * @param {string} [schema.positionalKey] - 位置参数对应的 key
 * @returns {Object} 解析结果 { [key]: value, _help?: boolean }
 * @throws {Error} 参数错误时抛出
 */
function parseArgs(args, schema) {
  const result = {};
  const seen = new Set();

  // 初始化默认值
  for (const def of Object.values(schema.flags)) {
    if (def.default !== undefined) {
      result[def.key] = def.default;
    }
  }

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    // 帮助
    if (arg === "--help" || arg === "-h") {
      result._help = true;
      return result;
    }

    // 查找匹配的 flag
    let matched = null;
    for (const [flag, def] of Object.entries(schema.flags)) {
      if (arg === flag || (def.alias && arg === def.alias)) {
        matched = { flag, def };
        break;
      }
    }

    if (matched) {
      const { flag, def } = matched;
      if (seen.has(def.key)) {
        throw new Error(`参数 ${flag} 重复指定`);
      }
      seen.add(def.key);

      if (def.type === "boolean") {
        result[def.key] = true;
      } else {
        const rawValue = readValueAfterFlag(args, i, arg);
        result[def.key] = def.transform ? def.transform(rawValue) : rawValue;
        i++;
      }
    } else if (!arg.startsWith("-")) {
      // 位置参数
      if (schema.positionalKey && result[schema.positionalKey] === undefined) {
        result[schema.positionalKey] = arg;
      } else {
        throw new Error(`未识别的位置参数: ${arg}`);
      }
    } else {
      throw new Error(`未识别的选项: ${arg}`);
    }

    i++;
  }

  // 检查必填项
  for (const [flag, def] of Object.entries(schema.flags)) {
    if (def.required && result[def.key] === undefined) {
      throw new Error(`缺少必填参数: ${flag} (${def.alias || "无别名"})`);
    }
  }

  return result;
}

/**
 * 根据 schema 生成帮助文本 (避免与解析逻辑漂移)
 * @param {Object} schema - 同 parseArgs 的 schema
 * @param {string} usage - 用法行, 如 "node src/xiaohongshu/search-cli.js <关键词> [选项]"
 * @param {string[]} [examples] - 示例数组
 * @returns {string} 帮助文本
 */
function buildHelp(schema, usage, examples = []) {
  const lines = [`用法: ${usage}\n`, "选项:"];
  for (const [flag, def] of Object.entries(schema.flags)) {
    const alias = def.alias || "";
    const placeholder = def.type === "boolean" ? "" : `<${def.key}>`;
    const defHint = def.default !== undefined ? ` (默认 ${def.default})` : "";
    lines.push(`  ${flag}\t${alias}\t${placeholder}\t${def.desc}${defHint}`);
  }
  lines.push("  --help\t-h\t\t显示帮助信息");
  if (examples.length > 0) {
    lines.push("\n示例:");
    examples.forEach((ex) => lines.push(`  ${ex}`));
  }
  return lines.join("\n");
}

module.exports = { parseArgs, readValueAfterFlag, buildHelp };
