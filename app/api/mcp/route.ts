import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import { createRelearnMcpServer } from "@/src/lib/mcp-server";

export const runtime = "nodejs";

async function handleMcp(request: Request) {
  const server = createRelearnMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  return transport.handleRequest(request);
}

export const GET = handleMcp;
export const POST = handleMcp;
export const DELETE = handleMcp;
