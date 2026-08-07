const PROTOCOL_VERSION = "2025-06-18";

function result(id, value) { return { jsonrpc: "2.0", id, result: value }; }
function error(id, code, message) { return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }; }

export function createMcpHandler(service) {
  return async function handle(message) {
    if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string")
      return error(message?.id, -32600, "Invalid Request");
    if (message.id === undefined) return null;
    try {
      switch (message.method) {
        case "initialize":
          return result(message.id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: "conversation-archive", version: "0.1.0" }
          });
        case "ping": return result(message.id, {});
        case "tools/list": return result(message.id, { tools: service.listTools() });
        case "tools/call": {
          const output = await service.callTool(message.params?.name, message.params?.arguments || {});
          return result(message.id, {
            content: [{ type: "text", text: JSON.stringify(output) }],
            structuredContent: output,
            isError: false
          });
        }
        default: return error(message.id, -32601, "Method not found");
      }
    } catch (cause) {
      if (message.method === "tools/call") {
        return result(message.id, {
          content: [{ type: "text", text: cause.message }],
          isError: true
        });
      }
      return error(message.id, cause.code || -32603, cause.message || "Internal error");
    }
  };
}
