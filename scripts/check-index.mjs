#!/usr/bin/env node
// 校验 dsh-plugins/index.json 是否符合插件市场 format 1。
//
// 两种模式：
//   1. 本地能拿到 DSH 自己的校验器（../.tools/pmi/lib/index.js，或环境变量
//      DSH_INDEX_VALIDATOR 指定）→ 用它，规则与 DSH 读取索引时完全一致。
//   2. 拿不到 → 用本文件内置的等价检查（零依赖），至少拦住「commit 写成短 sha」
//      「分类未声明」「版本不是 SemVer」这类会让整份索引失效的错误。
//
// 用法：
//   node scripts/check-index.mjs            # 校验工作区里的 index.json
//   node scripts/check-index.mjs --staged   # 校验已暂存的内容（pre-commit 用）
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const INDEX_URL = "https://cdn.jsdelivr.net/gh/skyrocks/dsh-plugins@main/index.json";
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/u;
const NUMERIC = "(?:0|[1-9]\\d*)";
const PRERELEASE_PART = `(?:${NUMERIC}|\\d*[a-zA-Z-][0-9a-zA-Z-]*)`;
const SEMVER = new RegExp(`^${NUMERIC}\\.${NUMERIC}\\.${NUMERIC}(?:-${PRERELEASE_PART}(?:\\.${PRERELEASE_PART})*)?(?:\\+[0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*)?$`, "u");
const COMMIT = /^[0-9a-f]{40}$/u;
const PATH_SEGMENT = /^[A-Za-z0-9._@+-]+$/u;

const staged = process.argv.includes("--staged");

/** 读待校验的 JSON 文本：暂存区优先，否则工作区文件。 */
function readIndex() {
  if (staged) return execFileSync("git", ["show", ":index.json"], { encoding: "utf8" });
  return readFileSync(new URL("../index.json", import.meta.url), "utf8");
}

/** 找 DSH 的官方校验器；找不到返回 undefined。 */
async function loadOfficialValidator() {
  const candidates = [
    process.env.DSH_INDEX_VALIDATOR,
    fileURLToPath(new URL("../../.tools/pmi/lib/index.js", import.meta.url)),
  ].filter((value) => typeof value === "string" && value !== "");
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const module = await import(pathToFileURL(candidate).href);
      if (typeof module.parseMarketIndex === "function") return module.parseMarketIndex;
    } catch {
      // 依赖缺失（例如 semver 解不到）时退回内置检查。
    }
  }
  return undefined;
}

/**
 * 内置检查：覆盖 format 1 里最容易写错、且一旦写错就整份索引失效的部分。
 * @param {unknown} value - 解析后的索引。
 * @returns {string[]} 问题列表，空数组表示通过。
 */
function fallbackValidation(value) {
  const problems = [];
  const at = (path, reason) => problems.push(`${path} ${reason}`);
  const isObject = (node) => typeof node === "object" && node !== null && !Array.isArray(node);

  if (!isObject(value)) return ["$ must be an object"];
  if (value.format !== 1) at("$.format", "must be 1");

  const localized = (node, path) => {
    if (typeof node === "string") return true;
    if (!isObject(node)) return at(path, "must be a string or a language map"), false;
    if (typeof node.en !== "string" || node.en.trim() === "") at(path, "must contain a non-empty en");
    for (const [language, text] of Object.entries(node)) {
      if (!/^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/u.test(language)) at(`${path}.${language}`, "must be a lowercase language id");
      if (typeof text !== "string" || text.trim() === "") at(`${path}.${language}`, "must be a non-empty string");
    }
    return true;
  };

  localized(value.title, "$.title");
  if (value.description !== undefined) localized(value.description, "$.description");

  const metadata = isObject(value.metadata) ? value.metadata : {};
  const declared = (group) => (isObject(metadata[group]) ? metadata[group] : {});
  const categories = declared("categories");
  const labels = declared("labels");
  for (const [group, table] of [["categories", categories], ["labels", labels]]) {
    for (const [id, node] of Object.entries(table)) {
      if (id === "") at(`$.metadata.${group}`, "must not declare an empty id");
      if (!isObject(node)) at(`$.metadata.${group}.${id}`, "must be an object");
      else localized(node.title, `$.metadata.${group}.${id}.title`);
    }
  }

  if (!Array.isArray(value.plugins)) at("$.plugins", "must be an array");
  const names = new Set();
  for (const [position, plugin] of (Array.isArray(value.plugins) ? value.plugins : []).entries()) {
    const path = `$.plugins[${position}]`;
    if (!isObject(plugin)) {
      at(path, "must be an object");
      continue;
    }
    const name = plugin.name;
    if (typeof name !== "string" || !PACKAGE_NAME.test(name)) at(`${path}.name`, "must be a valid npm package name");
    else if (names.has(name)) at(`${path}.name`, `duplicates ${name}`);
    else names.add(name);
    if (plugin.title !== undefined) localized(plugin.title, `${path}.title`);
    if (plugin.description !== undefined) localized(plugin.description, `${path}.description`);

    const own = isObject(plugin.metadata) ? plugin.metadata : {};
    if (own.category !== undefined && !Object.hasOwn(categories, own.category)) {
      at(`${path}.metadata.category`, `references undeclared id ${JSON.stringify(own.category)}`);
    }
    if (own.labels !== undefined) {
      if (!Array.isArray(own.labels)) at(`${path}.metadata.labels`, "must be an array");
      else {
        const seen = new Set();
        for (const label of own.labels) {
          if (typeof label !== "string" || !Object.hasOwn(labels, label)) {
            at(`${path}.metadata.labels`, `references undeclared id ${JSON.stringify(label)}`);
          } else if (seen.has(label)) at(`${path}.metadata.labels`, `must not repeat ${JSON.stringify(label)}`);
          else seen.add(label);
        }
      }
    }

    const versions = plugin.versions;
    if (!Array.isArray(versions) || versions.length === 0) {
      at(`${path}.versions`, "must be a non-empty array");
      continue;
    }
    const seenVersions = new Set();
    for (const [index, version] of versions.entries()) {
      const vpath = `${path}.versions[${index}]`;
      if (!isObject(version)) {
        at(vpath, "must be an object");
        continue;
      }
      if (typeof version.version !== "string" || !SEMVER.test(version.version)) {
        at(`${vpath}.version`, "must be an exact SemVer version");
      } else if (seenVersions.has(version.version)) at(`${vpath}.version`, `duplicates ${version.version}`);
      else seenVersions.add(version.version);

      const stamp = version.publishTimestamp;
      if (typeof stamp !== "number" || !Number.isInteger(stamp) || stamp < 0 || stamp >= 1e11) {
        at(`${vpath}.publishTimestamp`, "must be an integer number of Unix seconds in [0, 10^11)");
      }

      const source = version.source;
      if (!isObject(source)) at(`${vpath}.source`, "must be an object");
      else if (source.type === "git") {
        // 这一条是最容易犯的错：短 sha 会让 DSH 拒绝整份索引。
        if (typeof source.commit !== "string") at(`${vpath}.source.commit`, "must be a string");
        else if (!COMMIT.test(source.commit)) {
          at(`${vpath}.source.commit`, `must be a lowercase 40-hex-digit commit SHA (got ${JSON.stringify(source.commit)})`);
        }
        if (typeof source.url !== "string" || !/^https:\/\/[^/]+\/[^/]+\/[^/]+/u.test(source.url)) {
          at(`${vpath}.source.url`, "must be an https repository URL");
        }
        if (source.path !== undefined) {
          if (typeof source.path !== "string") at(`${vpath}.source.path`, "must be a string");
          else if (source.path.split("/").some((segment) => segment === "." || segment === ".." || !PATH_SEGMENT.test(segment))) {
            at(`${vpath}.source.path`, "must be a relative directory without . or ..");
          }
        }
      } else if (source.type === "npm") {
        if (source.registry !== undefined && (typeof source.registry !== "string" || !/^https?:\/\//u.test(source.registry))) {
          at(`${vpath}.source.registry`, "must be an http(s) URL");
        }
      } else {
        at(`${vpath}.source.type`, 'must be "npm" or "git"');
      }

      const engines = version.engines;
      if (engines !== undefined) {
        if (!isObject(engines)) at(`${vpath}.engines`, "must be an object");
        else if (engines.dsh !== undefined) {
          if (typeof engines.dsh !== "string" || engines.dsh.trim() === "") at(`${vpath}.engines.dsh`, "must be a non-empty string");
          else if (engines.dsh.startsWith("workspace:")) at(`${vpath}.engines.dsh`, "must not be a workspace: range");
          else if (!/\d/u.test(engines.dsh)) at(`${vpath}.engines.dsh`, "must be a SemVer range");
        }
      }
    }
  }
  return problems;
}

/** 提醒：最新版本是否已经打好了 CDN 用的 tgz（不阻塞提交）。 */
function tarballWarnings(value) {
  const warnings = [];
  for (const plugin of Array.isArray(value?.plugins) ? value.plugins : []) {
    if (typeof plugin?.name !== "string" || !Array.isArray(plugin.versions) || plugin.versions.length === 0) continue;
    const flat = plugin.name.replace(/^@/u, "").replace(/\//gu, "-");
    const path = new URL(`../dist/${flat}-${plugin.versions[0].version}.tgz`, import.meta.url);
    if (!existsSync(path)) warnings.push(`dist/${flat}-${plugin.versions[0].version}.tgz 不存在（最新版本没有 CDN 安装包）`);
  }
  return warnings;
}

const text = readIndex();
let value;
try {
  value = JSON.parse(text);
} catch (error) {
  console.error(`✘ index.json 不是合法 JSON：${error.message}`);
  process.exit(1);
}

const official = await loadOfficialValidator();
const problems = official === undefined ? fallbackValidation(value) : [];
if (official !== undefined) {
  try {
    official(value, INDEX_URL);
  } catch (error) {
    problems.push(`${error.path ?? "$"} ${error.reason ?? error.message}`);
  }
}

if (problems.length > 0) {
  console.error(`✘ index.json 不符合 format 1（${problems.length} 处）：`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\n校验器：${official === undefined ? "内置" : "DSH 官方 parseMarketIndex"}`);
  console.error("这类错误会让 DSH 拒绝整份索引——修好再提交（确实要跳过：git commit --no-verify）。");
  process.exit(1);
}

for (const warning of tarballWarnings(value)) console.warn(`⚠ ${warning}`);
console.log(`✔ index.json 通过（${value.plugins?.length ?? 0} 个插件，校验器：${official === undefined ? "内置" : "DSH 官方"}）`);
