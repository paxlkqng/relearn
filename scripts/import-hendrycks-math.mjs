#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const inputArg = args.find((arg) => arg.startsWith("--input="));
const outputArg = args.find((arg) => arg.startsWith("--output="));
const limitArg = args.find((arg) => arg.startsWith("--limit="));

if (!inputArg) {
  console.error("Usage: npm run problem-bank:import:math -- --input=/path/to/MATH --output=data/problem-bank/staging/hendrycks-math.jsonl [--limit=500]");
  process.exit(1);
}

const inputRoot = path.resolve(inputArg.split("=")[1]);
const outputPath = path.resolve(outputArg?.split("=")[1] ?? "data/problem-bank/staging/hendrycks-math.jsonl");
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;

const allowedTypes = new Set(["Algebra", "Prealgebra"]);

function inferSkill(problem, type) {
  const text = problem.toLowerCase();
  if (/factor|factori[sz]|zero(?:es)? of|roots? of/.test(text)) return "factoring";
  if (/polynomial.*div|synthetic division|remainder theorem|quotient/.test(text)) return "polynomial-division";
  if (/rational function|rational expression|asymptote|hole|discontinu/.test(text)) return "rational-functions";
  if (/transform|translation|reflect|stretch|compress|shift/.test(text)) return "function-transformations";
  if (/radical|square root|cube root|exponent|power/.test(text)) return "exponents-radicals";
  if (/trig|sine|cosine|tangent|unit circle/.test(text)) return "trig-identities";
  return type === "Prealgebra" ? "equation-manipulation" : "unmapped-algebra";
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
  return files;
}

const files = await collectJsonFiles(inputRoot);
const accepted = [];
const rejected = [];

for (const file of files) {
  if (accepted.length >= limit) break;
  try {
    const raw = JSON.parse(await fs.readFile(file, "utf8"));
    if (!allowedTypes.has(raw.type)) continue;
    if (typeof raw.problem !== "string" || typeof raw.solution !== "string") {
      rejected.push({ file: path.relative(inputRoot, file), reason: "missing problem or solution" });
      continue;
    }

    const sourceProblemId = path.relative(inputRoot, file).replaceAll(path.sep, "/");
    const digest = crypto.createHash("sha256").update(sourceProblemId).digest("hex").slice(0, 16);
    accepted.push({
      id: `hendrycks-math-${digest}`,
      source: "MATH Dataset",
      sourceProblemId,
      sourceUrl: "https://github.com/hendrycks/math",
      licensingNote: "MATH repository is distributed under the MIT License; preserve attribution and source path.",
      solutionReference: `MATH dataset solution for ${sourceProblemId}`,
      primarySkill: inferSkill(raw.problem, raw.type),
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
      file: path.relative(inputRoot, file),
      reason: error instanceof Error ? error.message : "unknown error",
    });
  }
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, accepted.map((item) => JSON.stringify(item)).join("\n") + (accepted.length ? "\n" : ""), "utf8");

const bySkill = accepted.reduce((acc, item) => {
  acc[item.primarySkill] = (acc[item.primarySkill] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({
  inputRoot,
  outputPath,
  scannedJsonFiles: files.length,
  accepted: accepted.length,
  rejected: rejected.length,
  bySkill,
}, null, 2));
