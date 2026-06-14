import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env, REGISTRO: "/home/claude/build/rom-agent/skills/segundo-grau-nacional/registro-tribunais.json" },
});
const client = new Client({ name: "rom-audit", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
const nomes = tools.tools.map(t => t.name).sort();
console.log("Ferramentas expostas:", nomes.join(", "));
assert.deepEqual(nomes, ["tribunais_buscar_datajud","tribunais_montar_anexos","tribunais_resolver_processo"]);

const r1 = await client.callTool({ name: "tribunais_resolver_processo", arguments: { numero: "5677110-87.2022.8.09.0051" } });
const sc = r1.structuredContent;
console.log("resolver_processo -> sigla:", sc.processo.sigla, "| alias:", sc.processo.datajudAlias, "| fonte:", sc.roteamento.fonte, "| sistema:", sc.roteamento.sistema);
assert.equal(sc.processo.sigla, "TJGO");
assert.equal(sc.processo.datajudAlias, "api_publica_tjgo");
assert.equal(sc.roteamento.fonte, "registro");

const r2 = await client.callTool({ name: "tribunais_resolver_processo", arguments: { numero: "0001234-56.2023.8.04.0001" } });
console.log("resolver_processo (TJAM, fora do registro) -> fonte:", r2.structuredContent.roteamento.fonte);
assert.equal(r2.structuredContent.processo.sigla, "TJAM");
assert.equal(r2.structuredContent.roteamento.fonte, "fallback");

const r3 = await client.callTool({ name: "tribunais_montar_anexos", arguments: { decisoes: [{ tribunal:"STJ", classe_numero:"REsp 1234567", relator:"Min. A", orgao:"3a Turma", data_julgamento:"2024-08-15", url_inteiro_teor:"https://scon.stj.jus.br/it1" }], inicio: 3 } });
console.log("montar_anexos -> pendências:", r3.structuredContent.pendencias.length);
assert.ok(r3.structuredContent.rol.includes("Doc. 03"));

const r4 = await client.callTool({ name: "tribunais_resolver_processo", arguments: { numero: "abc" } });
console.log("resolver_processo (inválido) -> isError:", r4.isError === true);
assert.equal(r4.isError, true);

await client.close();
console.log("\nHANDSHAKE MCP: OK — todas as asserções passaram.");
