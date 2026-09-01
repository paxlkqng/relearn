#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const inputArg = args.find((arg) => arg.startsWith("--input="));
const outputArg = args.find((arg) => arg.startsWith("--output="));
const reportArg = args.find((arg) => arg.startsWith("--report="));
const limitArg = args.find((arg) => arg.startsWith("--limit="));

if (!inputArg) {
  console.error("Usage: npm run problem-bank:import:math -- --input=/path/to/MATH --output=data/problem-bank/staging/hendrycks-math.jsonl [--report=data/problem-bank/staging/hendrycks-math.report.json] [--limit=500]");
  process.exit(1);
}

const inputRoot = path.resolve(inputArg.split("=")[1]);
const outputPath = path.resolve(outputArg?.split("=")[1] ?? "data/problem-bank/staging/hendrycks-math.jsonl");
const reportPath = path.resolve(reportArg?.split("=")[1] ?? `${outputPath}.report.json`);
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;
const sourceManifestPath = path.resolve("data/problem-bank/sources.json");

const allowedTypes = new Set(["Algebra", "Prealgebra"]);
const approvedSkills = new Set([
  "equation-manipulation",
  "factoring",
  "polynomial-division",
  "rational-functions",
  "function-transformations",
  "exponents-radicals",
]);

function inferSkill(problem, type) {
  const text = problem.toLowerCase();
  if (/factor|factori[sz]|zero(?:es)? of|roots? of/.test(text)) return "factoring";
  if (/polynomial.*div|synthetic division|remainder theorem|quotient/.test(text)) return "polynomial-division";
  if (/rational function|rational expression|asymptote|hole|discontinu/.test(text)) return "rational-functions";
  if (/transform|translation|reflect|stretch|compress|shift/.test(text)) return "function-transformations";
  if (/radical|square root|cube root|exponent|power/.test(text)) return "exponents-radicals";
  if (type === "Prealgebra" || /solve|equation|inequal|simplif|evaluate/.test(text)) return "equation-manipulation";
  return null;
}

function mapDifficulty(level) {
  const match = String(level ?? "").match(/(\d+)/);
  const n = match ? Number(match[1]) : 3;
  if (n <= 2) return "core";
  return "bridge";
}

async function collectJsonFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJsonFiles(full)));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(full);
  }
  return files.sort();
}

const sourceManifest = JSON.parse(await fs.readFile(sourceManifestPath, "utf8"));
const sourcePolicy = sourceManifest.find((source) => source.id === "hendrycks-math");
if (!sourcePolicy || sourcePolicy.status !== "approved-for-import" || sourcePolicy.license !== "MIT") {
  throw new Error("MATH import is disabled unless data/problem-bank/sources.json explicitly approves the source under MIT.");
}

const files = await collectJsonFiles(inputRoot);
const accepted = [];
const rejected = [];
const untagged = [];
const seenSourceIds = new Set();

for (const file of files) {
  if (accepted.length >= limit) break;
  const relativeFile = path.relative(inputRoot, file).replaceAll(path.sep, "/");
  try {
    const raw = JSON.parse(await fs.readFile(file, "utf8"));
    if (!allowedTypes.has(raw.type)) continue;
    if (typeof raw.problem !== "string" || typeof raw.solution !== "string") {
      rejected.push({ file: relativeFile, reason: "missing problem or solution" });
      continue;
    }
    if (seenSourceIds.has(relativeFile)) {
      rejected.push({ file: relativeFile, reason: "duplicate source path" });
      continue;
    }
    seenSourceIds.add(relativeFile);

    const primarySkill = inferSkill(raw.problem, raw.type);
    if (!primarySkill || !approvedSkills.has(primarySkill)) {
      untagged.push({ file: relativeFile, type: raw.type, level: raw.level ?? null });
      continue;
    }

    const digest = crypto.createHash("sha256").update(relativeFile).digest("hex").slice(0, 16);
    accepted.push({
      id: `hendrycks-math-${digest}`,
      source: "MATH Dataset",
      sourceProblemId: relativeFile,
      sourceUrl: "https://github.com/hendrycks/math",
      licensingNote: "MATH repository is distributed under the MIT License; preserve copyright notice, license, attribution, and source path.",
      solutionReference: `MATH dataset solution for ${relativeFile}`,
      primarySkill,
      prerequisiteSkills: [],
      difficulty: mapDifficulty(raw.level),
      answerFormat: "free-response",
      prompt: raw.problem,
      sourceSolution: raw.solution,
      sourceMetadata: {
        level: raw.level ?? null,
        type: raw.type,
      },
      ingestionStatus: "candidate-needs-review",
    });
  } catch (error) {
    rejected.push({
      file: relativeFile,
      reason: error instanceof Error ? error.message : "unknown error",
    });
  }
}

const bySkill = accepted.reduce((acc, item) => {
  acc[item.primarySkill] = (acc[item.primarySkill] ?? 0) + 1;
  return acc;
}, {});

const report = {
  source: {
    id: sourcePolicy.id,
    name: sourcePolicy.name,
    homepage: sourcePolicy.homepage,
    license: sourcePolicy.license,
    status: sourcePolicy.status,
  },
  inputRoot,
  outputPath,
  scannedJsonFiles: files.length,
  accepted: accepted.length,
  rejected: rejected.length,
  untagged: untagged.length,
  bySkill,
  rejectedRecords: rejected,
  untaggedRecords: untagged,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, accepted.map((item) => JSON.stringify(item)).join("\n") + (accepted.length ? "\n" : ""), "utf8");
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ ...report, rejectedRecords: undefined, untaggedRecords: undefined, reportPath }, null, 2));
