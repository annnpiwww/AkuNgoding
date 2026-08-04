// Health runner utk /api/mcp/status — spawn MCP server & cek koneksi.
// Run: node health.cjs  (print JSON, exit)
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");

(async () => {
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(__dirname, "dist", "index.js")],
    env: { ...process.env },
  });
  const client = new Client({ name: "akungoding-health", version: "1.0.0" });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const h = await client.callTool({ name: "akungoding_health", arguments: {} });
    let health;
    try { health = JSON.parse(h.content[0].text); } catch { health = h.content[0].text; }
    console.log(JSON.stringify({ connected: true, tools: tools.tools.map((t) => t.name), health }));
  } catch (e) {
    console.log(JSON.stringify({ connected: false, error: String((e && e.message) || e) }));
  }
  try { await client.close(); } catch {}
  process.exit(0);
})();