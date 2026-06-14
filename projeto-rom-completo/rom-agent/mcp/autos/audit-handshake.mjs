import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";

const t = new StdioClientTransport({
  command: "node", args: ["dist/index.js"],
  env: { ...process.env, TRAVA_SCRIPT: "/home/claude/build/rom-agent/skills/analise-integral-documentos/trava-integridade.py", LEDGER: "/home/claude/build/rom-agent/mcp/autos/.handshake-selos.jsonl" },
});
const c = new Client({ name: "rom-audit", version: "1.0.0" }, { capabilities: {} });
await c.connect(t);
const tools = (await c.listTools()).tools.map(x => x.name).sort();
console.log("Ferramentas (autos):", tools.join(", "));
assert.deepEqual(tools, ["autos_inventario","autos_selar_extracao","autos_verificar_integridade"]);

const proc = "5677110-87.2022.8.09.0051";
const s = await c.callTool({ name: "autos_selar_extracao", arguments: { processo: proc, itens: ["d1::Inicial","d2::Contrato","d3::Laudo"] } });
console.log("selar -> ok:", s.structuredContent.ok);
assert.equal(s.structuredContent.ok, true);

const okv = await c.callTool({ name: "autos_verificar_integridade", arguments: { processo: proc, itens: ["d1::Inicial","d2::Contrato","d3::Laudo"] } });
console.log("verificar (íntegro) -> ok:", okv.structuredContent.ok);
assert.equal(okv.structuredContent.ok, true);

const bloq = await c.callTool({ name: "autos_verificar_integridade", arguments: { processo: proc, itens: ["d1::Inicial"] } });
console.log("verificar (omite d2/d3) -> bloqueado:", bloq.structuredContent.bloqueado, "| exit:", bloq.structuredContent.exit);
assert.equal(bloq.structuredContent.bloqueado, true);
assert.equal(bloq.structuredContent.exit, 2);

const aut = await c.callTool({ name: "autos_verificar_integridade", arguments: { processo: proc, itens: ["d1::Inicial"], autorizacao: "cliente pediu remover anexos" } });
console.log("verificar (omite, COM autorização) -> ok:", aut.structuredContent.ok);
assert.equal(aut.structuredContent.ok, true);

const inv = await c.callTool({ name: "autos_inventario", arguments: { numero: proc, sigla: "TJGO" } });
console.log("inventario sem credencial -> isError:", inv.isError === true);
assert.equal(inv.isError, true);

await c.close();
console.log("\nHANDSHAKE AUTOS + TRAVA: OK");
