import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import {
  completeSession,
  getMastery,
  getMistakeHistory,
  getProblems,
  getTodayPlan,
  getWeakSkills,
  recordAttempt,
  startSession,
} from "../src/lib/mcp-learning-service";

const server = new McpServer({ name: "relearn", version: "0.1.0" });

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

server.registerTool(
  "get_mastery",
  { description: "Read deterministic mastery state for every Relearn skill." },
  async () => textResult({ skills: getMastery() }),
);

server.registerTool(
  "get_weak_skills",
  {
    description: "Return the weakest skills by deterministic mastery evidence.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
  },
  async ({ limit }) => textResult({ skills: getWeakSkills(limit) }),
);

server.registerTool(
  "get_today_plan",
  { description: "Return Relearn's deterministic recommendation for the next skill to repair." },
  async () => textResult(getTodayPlan()),
);

server.registerTool(
  "get_problems",
  {
    description: "Fetch verified problems with source provenance. Correct answers are intentionally withheld until an attempt is recorded.",
    inputSchema: z.object({
      primarySkill: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      limit: z.number().int().min(1).max(50).default(10),
    }),
  },
  async (input) => textResult({ problems: getProblems(input) }),
);

server.registerTool(
  "get_mistake_history",
  {
    description: "Read recent incorrect attempts for tutoring and diagnosis.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(20) }),
  },
  async ({ limit }) => textResult({ mistakes: getMistakeHistory(limit) }),
);

server.registerTool(
  "start_session",
  {
    description: "Start a Relearn study session using verified problem ids.",
    inputSchema: z.object({ problemIds: z.array(z.string()).min(1).max(50) }),
  },
  async ({ problemIds }) => textResult(startSession(problemIds)),
);

server.registerTool(
  "record_attempt",
  {
    description: "Record one answer. Relearn computes correctness, mastery updates, explanation, and prerequisite diagnosis server-side.",
    inputSchema: z.object({
      sessionId: z.string().min(1),
      problemId: z.string().min(1),
      selectedChoiceId: z.string().min(1),
      durationMs: z.number().nonnegative(),
      mistakeCategory: z.enum(["concept", "algebra-manipulation", "prerequisite", "careless", "unknown"]).optional(),
    }),
  },
  async (input) => textResult(recordAttempt(input)),
);

server.registerTool(
  "complete_session",
  {
    description: "Complete a Relearn study session and return its summary.",
    inputSchema: z.object({ sessionId: z.string().min(1) }),
  },
  async ({ sessionId }) => textResult(completeSession(sessionId)),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Relearn MCP server failed:", error);
  process.exitCode = 1;
});
