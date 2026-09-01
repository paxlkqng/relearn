#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const issueArg = argv.find((arg) => arg.startsWith("--issue="));
const baseArg = argv.find((arg) => arg.startsWith("--base="));
const issue = issueArg?.split("=")[1] ?? process.env.RELEARN_AGENT_ISSUE;
const baseBranch = baseArg?.split("=")[1] ?? process.env.RELEARN_AGENT_BASE ?? "main";

if (!issue || !/^\d+$/.test(issue)) {
  console.error("Missing or invalid issue number. Use --issue=<number> or RELEARN_AGENT_ISSUE.");
  process.exit(2);
}

const config = JSON.parse(readFileSync(resolve("automation/round-robin.config.json"), "utf8"));

function shell(command, options = {}) {
  return execSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
}

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
}

function commandExists(command) {
  try {
    execFileSync(command, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function assertCleanWorktree() {
  const status = git(["status", "--porcelain"]).trim();
  if (status) {
    throw new Error("Working tree must be clean before an unattended run.");
  }
}

function changedFiles() {
  return git(["diff", "--name-only", `${baseBranch}...HEAD`])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function matchesPattern(path, pattern) {
  if (pattern.endsWith("/**")) return path.startsWith(pattern.slice(0, -3));
  if (pattern.endsWith("*")) return path.startsWith(pattern.slice(0, -1));
  return path === pattern;
}

function assertNoProtectedPaths(files) {
  const protectedPatterns = config.protectedPathPatterns ?? [];
  const violations = files.filter((file) => protectedPatterns.some((pattern) => matchesPattern(file, pattern)));
  if (violations.length) {
    throw new Error(`Protected paths changed during unattended run: ${violations.join(", ")}`);
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

const branch = `agent/issue-${issue}-${timestamp().toLowerCase()}`;

if (dryRun) {
  console.log(`[dry-run] issue: #${issue}`);
  console.log(`[dry-run] base: ${baseBranch}`);
  console.log(`[dry-run] would create branch: ${branch}`);
  console.log(`[dry-run] protected paths: ${(config.protectedPathPatterns ?? []).join(", ") || "none"}`);
  shell(`npm run agent:dry-run -- --issue=${issue}`, { inherit: true });
  process.exit(0);
}

try {
  assertCleanWorktree();

  shell("git fetch origin --prune");
  git(["checkout", baseBranch]);
  shell(`git pull --ff-only origin ${baseBranch}`);
  git(["checkout", "-b", branch]);

  shell(`npm run agent:run -- --issue=${issue}`, { inherit: true });

  const status = git(["status", "--porcelain"]).trim();
  if (!status) {
    console.log("Agent run passed but produced no repository changes; no PR created.");
    process.exit(0);
  }

  const filesBeforeCommit = git(["status", "--porcelain"])
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
  assertNoProtectedPaths(filesBeforeCommit);

  git(["add", "-A"]);
  git(["commit", "-m", `agent: address issue #${issue}`]);

  const files = changedFiles();
  assertNoProtectedPaths(files);

  shell(`git push -u origin ${branch}`);

  if (!commandExists("gh")) {
    console.log(`Changes pushed to ${branch}. GitHub CLI is unavailable, so draft PR creation was skipped.`);
    process.exit(0);
  }

  const body = [
    `Automated bounded implementation for #${issue}.`,
    "",
    "## Safety boundary",
    "- draft only; never self-merges",
    "- required test/typecheck/build gates passed before push",
    "- protected unattended paths were checked before commit/push",
    "",
    "## Review",
    "Please inspect the generated diff and the latest `automation/reports/` output from the run environment before merging.",
    "",
    `Closes #${issue}`,
  ].join("\n");

  execFileSync(
    "gh",
    ["pr", "create", "--draft", "--base", baseBranch, "--head", branch, "--title", `Agent: address issue #${issue}`, "--body", body],
    { cwd: process.cwd(), stdio: "inherit", env: process.env },
  );

  console.log(`Nightly run completed on ${branch}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
