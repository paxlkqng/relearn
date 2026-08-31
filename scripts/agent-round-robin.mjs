#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const issueArg = process.argv.find((arg) => arg.startsWith("--issue="));
const issue = issueArg ? issueArg.split("=")[1] : process.env.RELEARN_AGENT_ISSUE;

if (!issue) {
  console.error("Missing issue number. Use --issue=<number> or RELEARN_AGENT_ISSUE.");
  process.exit(2);
}

const config = JSON.parse(readFileSync(resolve("automation/round-robin.config.json"), "utf8"));
const reportDir = resolve("automation/reports");
mkdirSync(reportDir, { recursive: true });

const startedAt = new Date().toISOString();
const report = {
  issue,
  startedAt,
  dryRun,
  maxRepairRounds: config.maxRepairRounds,
  rounds: [],
  status: "running",
  stopReason: null,
};

function run(command, label) {
  if (dryRun) {
    return { label, command, ok: true, output: "dry-run: command not executed" };
  }

  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { label, command, ok: true, output: output.slice(-12000) };
  } catch (error) {
    const stdout = error?.stdout?.toString?.() ?? "";
    const stderr = error?.stderr?.toString?.() ?? "";
    return {
      label,
      command,
      ok: false,
      output: `${stdout}\n${stderr}`.slice(-12000),
      exitCode: error?.status ?? 1,
    };
  }
}

function roleCommand(role) {
  const envName = `RELEARN_${role.toUpperCase()}_CMD`;
  return process.env[envName] ?? null;
}

let repeatedFailureSignature = null;
let repeatedFailureCount = 0;

for (let repairRound = 0; repairRound <= config.maxRepairRounds; repairRound += 1) {
  const round = {
    number: repairRound + 1,
    roles: [],
    checks: [],
  };

  const roles = repairRound === 0
    ? ["planner", "builder", "reviewer", "tester"]
    : ["fixer", "reviewer", "tester"];

  for (const role of roles) {
    const command = roleCommand(role);
    if (!command) {
      round.roles.push({ role, skipped: true, reason: `RELEARN_${role.toUpperCase()}_CMD is not configured` });
      continue;
    }

    const result = run(command, role);
    round.roles.push({ role, ...result });

    if (!result.ok && role !== "tester") {
      report.rounds.push(round);
      report.status = "stopped";
      report.stopReason = `${role} command failed`;
      break;
    }
  }

  if (report.status === "stopped") break;

  for (const check of config.requiredChecks) {
    const result = run(check, "check");
    round.checks.push(result);
  }

  report.rounds.push(round);
  const failed = round.checks.filter((item) => !item.ok);

  if (failed.length === 0) {
    report.status = "passed";
    report.stopReason = "All required checks passed";
    break;
  }

  const signature = failed.map((item) => `${item.command}:${item.exitCode ?? 1}`).join("|");
  if (signature === repeatedFailureSignature) repeatedFailureCount += 1;
  else {
    repeatedFailureSignature = signature;
    repeatedFailureCount = 1;
  }

  if (repeatedFailureCount >= config.repeatFailureLimit) {
    report.status = "stopped";
    report.stopReason = `Same check failure repeated ${repeatedFailureCount} times`;
    break;
  }

  if (repairRound === config.maxRepairRounds) {
    report.status = "stopped";
    report.stopReason = `Maximum repair rounds reached (${config.maxRepairRounds})`;
  }
}

report.completedAt = new Date().toISOString();
const reportPath = resolve(reportDir, `issue-${issue}-${Date.now()}.json`);
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Round-robin status: ${report.status}`);
console.log(`Stop reason: ${report.stopReason}`);
console.log(`Report: ${reportPath}`);

if (report.status !== "passed") process.exitCode = 1;
