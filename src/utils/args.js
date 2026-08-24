/**
 * 通用 CLI 参数解析器
 */

function readValueAfterFlag(args, index, flagName, def) {
  const next = args[index + 1];
  if (next === undefined) throw new Error(`参数 ${flagName} 缺少值`);
  if (/^--[a-zA-Z]/.test(next)) {
    throw new Error(`参数 ${flagName} 缺少值（下一个 token 是 ${next}）`);
  }
  if (def && def.type === "number" && !/^-?\d+(\.\d+)?$/.test(next)) {
    throw new Error(`参数 ${flagName} 需要数字，收到: "${next}"`);
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
  const warnings = [];

  for (const def of Object.values(schema.flags)) {
    if (def.default !== undefined) result[def.key] = def.default;
  }

  let i = 0;
  while (i < args.length) {
    let arg = args[i];
    let inlineValue = null;

    if (arg === "--help" || arg === "-h") {
      result._help = true;
      return result;
    }

    // 新增：支持 --flag=value / -k=value
    if (arg.startsWith("-")) {
      const eq = arg.indexOf("=");
      if (eq > 0) {
        inlineValue = arg.slice(eq + 1);
        arg = arg.slice(0, eq);
      }
    }

    let matched = null;
    for (const [flag, def] of Object.entries(schema.flags)) {
      if (arg === flag || (def.alias && arg === def.alias)) {
        matched = { flag, def };
        break;
      }
    }

    if (matched) {
      const { flag, def } = matched;
      if (seen.has(def.key)) throw new Error(`参数 ${flag} 重复指定`);
      seen.add(def.key);

      if (def.type === "boolean") {
        result[def.key] = inlineValue === null ? true : inlineValue !== "false";
      } else {
        let rawValue;
        if (inlineValue !== null) {
          if (inlineValue === "") throw new Error(`参数 ${flag} 缺少值`);
          rawValue = inlineValue;
        } else {
          rawValue = readValueAfterFlag(args, i, arg, def);
          i++;
        }
        result[def.key] = def.transform ? def.transform(rawValue) : rawValue;
      }
    } else if (!arg.startsWith("-")) {
      if (schema.positionalKey) {
        if (
          result[schema.positionalKey] === undefined ||
          !seen.has(schema.positionalKey)
        ) {
          // 位置参数与显式 flag 冲突时告警而非静默覆盖
          if (result[schema.positionalKey] !== undefined) {
            warnings.push(
              `位置参数 "${arg}" 与已解析值冲突，将保留 "${result[schema.positionalKey]}"`,
            );
          } else {
            result[schema.positionalKey] = arg;
          }
        } else {
          warnings.push(`已通过 flag 指定，忽略多余位置参数: "${arg}"`);
        }
      } else {
        throw new Error(`未识别的位置参数: ${arg}`);
      }
    } else {
      const known = Object.keys(schema.flags).join(", ");
      throw new Error(`未识别的选项: ${arg}（可用: ${known}, --help）`);
    }
    i++;
  }

  for (const [flag, def] of Object.entries(schema.flags)) {
    if (def.required && result[def.key] === undefined) {
      throw new Error(
        `缺少必填参数: ${flag}${def.alias ? " / " + def.alias : ""}`,
      );
    }
  }

  if (warnings.length) result._warnings = warnings;
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
