/**
 * 通用 CLI 参数解析器
 */

function isNumberToken(value) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

/**
 * 布尔 flag：无 `=` 赋值 → true；有赋值须为 true/false/1/0（大小写不敏感）；其它值报错。
 * @param {string|undefined|null} raw
 * @param {string} flagName
 * @returns {boolean}
 */
function parseBooleanFlagValue(raw, flagName) {
  if (raw === undefined || raw === null) return true;
  const s = String(raw).trim().toLowerCase();
  if (s === "") {
    throw new Error(`参数 ${flagName} 缺少有效布尔值（可用 true/false）`);
  }
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  throw new Error(
    `参数 ${flagName} 须为 true/false（或 1/0），收到: "${raw}"；省略该 flag 表示关闭`,
  );
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
 * 从 JSON 对象按 schema 填结果（与 flag 路径同一套 default / required / transform）
 */
function applySchemaFromObject(obj, schema) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("--json-args 须为 JSON 对象");
  }

  const allowed = new Map();
  for (const def of Object.values(schema.flags)) {
    allowed.set(def.key, def);
  }

  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new Error("--json-args 含未知字段: " + key);
    }
  }

  const result = {};
  for (const [flag, def] of Object.entries(schema.flags)) {
    const key = def.key;
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      if (def.default !== undefined) result[key] = def.default;
      continue;
    }
    const value = obj[key];
    if (def.type === "boolean") {
      if (typeof value !== "boolean") {
        throw new Error("参数 " + key + " 须为布尔值 true/false");
      }
      result[key] = value;
      continue;
    }
    if (def.type === "number") {
      let raw;
      if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          throw new Error("参数 " + key + " 须为有限数字");
        }
        raw = String(value);
      } else if (typeof value === "string") {
        raw = value;
      } else {
        throw new Error("参数 " + key + " 须为数字或数字字符串");
      }
      const transformed = def.transform ? def.transform(raw) : Number(raw);
      if (typeof transformed !== "number" || !Number.isFinite(transformed)) {
        throw new Error("参数 " + key + " 需要数字，收到: \"" + raw + "\"");
      }
      result[key] = transformed;
      continue;
    }
    if (typeof value !== "string") {
      throw new Error("参数 " + key + " 须为字符串");
    }
    result[key] = def.transform ? def.transform(value) : value;
  }

  for (const [flag, def] of Object.entries(schema.flags)) {
    if (def.required && result[def.key] === undefined) {
      throw new Error(
        "缺少必填参数: " +
          flag +
          (def.alias ? " / " + def.alias : "") +
          "；JSON 字段名用 \"" +
          def.key +
          "\"",
      );
    }
  }

  return result;
}

/**
 * 解析 --json-args 模式；与传统 flag / 位置参数互斥。
 * @param {string[]} args
 * @returns {{ raw: string } | null}
 */
function extractJsonArgsPayload(args) {
  let hasJsonArgs = false;
  for (const arg of args) {
    const name = arg.indexOf("=") > 0 ? arg.slice(0, arg.indexOf("=")) : arg;
    if (name === "--json-args") {
      hasJsonArgs = true;
      break;
    }
  }
  if (!hasJsonArgs) return null;

  let raw;
  let seen = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const eq = arg.indexOf("=");
    const name = eq > 0 ? arg.slice(0, eq) : arg;
    const inline = eq > 0 ? arg.slice(eq + 1) : undefined;

    if (name !== "--json-args") {
      throw new Error(
        "--json-args 不可与其它参数混用；请把全部业务字段放进 JSON，或改用传统 flag",
      );
    }
    if (seen) throw new Error("参数 --json-args 重复指定");
    seen = true;
    if (inline !== undefined) {
      if (inline === "") throw new Error("参数 --json-args 缺少有效值");
      raw = inline;
    } else {
      const next = args[i + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new Error("参数 --json-args 缺少值");
      }
      raw = next;
      i++;
    }
  }
  return { raw };
}

/**
 * CLI 统一入口：有 --json-args 走 JSON；否则走传统 parseArgs（语义不变）。
 */
function parseCliArgs(args, schema) {
  const jsonMode = extractJsonArgsPayload(args);
  if (!jsonMode) return parseArgs(args, schema);
  let obj;
  try {
    obj = JSON.parse(jsonMode.raw);
  } catch (e) {
    throw new Error(
      "--json-args JSON 无效: " +
        e.message +
        "。PowerShell 建议外层单引号: --json-args '{\"keyword\":\"AI\"}'",
    );
  }
  return applySchemaFromObject(obj, schema);
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
        result[def.key] = parseBooleanFlagValue(inlineValue, flag);
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
  const lines = [`用法: ${usage}\r\n`, "选项:"];
  for (const [flag, def] of Object.entries(schema.flags)) {
    const alias = def.alias || "";
    const placeholder = def.type === "boolean" ? "" : `<${def.key}>`;
    const defHint = def.default !== undefined ? ` (默认 ${def.default})` : "";
    lines.push(`  ${flag}\t${alias}\t${placeholder}\t${def.desc}${defHint}`);
  }
  lines.push("  --help\t-h\t\t显示帮助信息");
  lines.push(
    "  --json-args\t\t<json>\t一次性传入全部参数的 JSON 对象（与其它 flag 互斥；键名用 keyword/url/sort 等，不用 --keyword）",
  );
  if (examples.length > 0) {
    lines.push("\r\n示例:");
    examples.forEach((ex) => lines.push(`  ${ex}`));
  }
  return lines.join("\r\n");
}

module.exports = {
  parseArgs,
  parseCliArgs,
  applySchemaFromObject,
  readValueAfterFlag,
  buildHelp,
  parseBooleanFlagValue,
};
