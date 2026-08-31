import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterEach, describe, expect, test } from "vitest";
import { POST } from "../../app/api/mcp/route";
import { resetLearningStateForTests } from "./mcp-learning-service";

const expectedTools = [
  "complete_session",
  "get_mastery",
  "get_mistake_history",
  "get_problems",
  "get_today_plan",
  "get_weak_skills",
  "record_attempt",
  "start_session",
].sort();

function createClient() {
  return new Client({ name: "relearn-contract-test", version: "0.1.0" });
}

function structured<T>(result: { structuredContent?: unknown }): T {
  expect(result.structuredContent).toBeDefined();
  return result.structuredContent as T;
}

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function bridgeToRoute(request: IncomingMessage, response: ServerResponse) {
  const body = await readRequestBody(request);
  const url = `http://127.0.0.1${request.url ?? "/api/mcp"}`;
  const webRequest = new Request(url, {
    method: request.method,
    headers: request.headers as HeadersInit,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : body,
  });

  const webResponse = await POST(webRequest);
  response.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => response.setHeader(key, value));
  response.end(Buffer.from(await webResponse.arrayBuffer()));
}

async function startRouteServer() {
  const server = createServer((request, response) => {
    bridgeToRoute(request, response).catch((error) => {
      response.statusCode = 500;
      response.end(String(error));
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to bind MCP test server.");
  return { server, url: new URL(`http://127.0.0.1:${address.port}/api/mcp`) };
}

afterEach(() => {
  resetLearningStateForTests();
});

describe("MCP transport contracts", () => {
  test("stdio server exposes the expected Relearn tools", async () => {
    const client = createClient();
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const transport = new StdioClientTransport({
      command,
      args: ["tsx", "server/mcp.ts"],
      cwd: process.cwd(),
    });

    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual(expectedTools);
    } finally {
      await client.close();
    }
  }, 20_000);

  test("Streamable HTTP preserves hidden answers and server-calculated attempt state", async () => {
    const { server, url } = await startRouteServer();
    const client = createClient();
    const transport = new StreamableHTTPClientTransport(url);

    try {
      await client.connect(transport);

      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual(expectedTools);

      const problemsResult = await client.callTool({
        name: "get_problems",
        arguments: { primarySkill: "factoring", limit: 1 },
      });
      const problems = structured<{ problems: Array<Record<string, unknown>> }>(problemsResult).problems;
      expect(problems).toHaveLength(1);
      expect(problems[0]).toMatchObject({ id: "sample-factoring-001", source: "Relearn seed" });
      expect(problems[0]).not.toHaveProperty("correctChoiceId");
      expect(problems[0]).not.toHaveProperty("explanation");

      const sessionResult = await client.callTool({
        name: "start_session",
        arguments: { problemIds: ["sample-factoring-001"] },
      });
      const sessionId = structured<{ session: { id: string } }>(sessionResult).session.id;

      const attemptResult = await client.callTool({
        name: "record_attempt",
        arguments: {
          sessionId,
          problemId: "sample-factoring-001",
          selectedChoiceId: "a",
          durationMs: 1200,
        },
      });
      const attempt = structured<{
        result: { correct: boolean; explanation: string; mastery: number };
      }>(attemptResult).result;
      expect(attempt.correct).toBe(true);
      expect(attempt.explanation).toContain("difference of squares");
      expect(attempt.mastery).toBeGreaterThan(0.58);

      const invalidResult = await client.callTool({
        name: "get_weak_skills",
        arguments: { limit: 0 },
      });
      expect(invalidResult.isError).toBe(true);
    } finally {
      await client.close();
      server.close();
      await once(server, "close");
    }
  }, 20_000);
});
