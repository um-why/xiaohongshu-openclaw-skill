/**
 * 通用 CLI 参数解析器
 */

function isNumberToken(value) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function readValueAfterFlag(args, index, flagName, def) {
  const next = args[index + 1];
  if (next === undefined) throw new Error(`参数 ${flagName} 缺少值`);
  const numeric = def && def.type === "number";
  const looksLikeFlag =
    /^--[a-zA-Z]/.test(next) || (/^-[a-zA-Z]/.test(next) && !numeric);
  if (looksLikeFlag) {
    throw new Error(`参数 ${flagName} 缺少值（下一个 token 是 ${next}）`);
  }
  if (numeric && !isNumberToken(next)) {
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
  let positionalSet = false;

  for (const def of Object.values(schema.flags)) {
    if (def.default !== undefined) result[def.key] = def.default;
  }

  let i = 0;
  let noMoreFlags = false;
  while (i < args.length) {
    let arg = args[i];
    let inlineValue = null;

    if (!noMoreFlags && arg === "--") {
      noMoreFlags = true;
      i++;
      continue;
    }

    if (!noMoreFlags && (arg === "--help" || arg === "-h")) {
      result._help = true;
      return result;
    }

    if (!noMoreFlags && arg.startsWith("-")) {
      const eq = arg.indexOf("=");
      if (eq > 0) {
        inlineValue = arg.slice(eq + 1);
        arg = arg.slice(0, eq);
      }
    }

    let matched = null;
    if (!noMoreFlags) {
      for (const [flag, def] of Object.entries(schema.flags)) {
        if (arg === flag || (def.alias && arg === def.alias)) {
          matched = { flag, def };
          break;
        }
      }
    }

    if (matched) {
      const { flag, def } = matched;
      if (seen.has(def.key)) throw new Error(`参数 ${flag} 重复指定`);
      if (schema.positionalKey === def.key && positionalSet) {
        throw new Error(
          `位置参数 "${result[def.key]}" 与 ${flag} 重复, 请只保留一种写法`,
        );
      }
      seen.add(def.key);

      if (def.type === "boolean") {
        result[def.key] = inlineValue === null ? true : inlineValue !== "false";
      } else {
        let rawValue;
        if (inlineValue !== null) {
          if (inlineValue === "") throw new Error(`参数 ${flag} 缺少值`);
          if (def.type === "number" && !isNumberToken(inlineValue)) {
            throw new Error(`参数 ${flag} 需要数字，收到: "${inlineValue}"`);
          }
          rawValue = inlineValue;
        } else {
          rawValue = readValueAfterFlag(args, i, arg, def);
          i++;
        }
        const transformed = def.transform ? def.transform(rawValue) : rawValue;
        if (
          def.type === "number" &&
          (typeof transformed !== "number" || !Number.isFinite(transformed))
        ) {
          throw new Error(`参数 ${flag} 需要数字，收到: "${rawValue}"`);
        }
        result[def.key] = transformed;
      }
    } else if (noMoreFlags || !arg.startsWith("-")) {
      if (!schema.positionalKey) {
        throw new Error(`未识别的位置参数: ${arg}`);
      }
      const key = schema.positionalKey;
      if (seen.has(key)) {
        throw new Error(`已通过 flag 指定 ${key}, 多余的位置参数: "${arg}"`);
      }
      if (positionalSet) {
        throw new Error(
          `位置参数重复: "${arg}"（已收到 "${result[key]}"）。含空格的值请加引号`,
        );
      }
      result[key] = arg;
      positionalSet = true;
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
