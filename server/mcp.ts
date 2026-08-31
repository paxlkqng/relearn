import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createRelearnMcpServer } from "../src/lib/mcp-server";

async function main() {
  const server = createRelearnMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Relearn MCP server failed:", error);
  process.exitCode = 1;
});
