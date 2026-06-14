import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";

// servidor de jurisprudência
const tJur = new StdioClientTransport({ command: "node", args: ["dist/index.js"], env: { ...process.env } });
const cJur = new Client({ name: "rom-audit", version: "1.0.0" }, { capabilities: {} });
await cJur.connect(tJur);
const tools = (await cJur.listTools()).tools.map(t => t.name).sort();
console.log("Ferramentas (jurisprudencia):", tools.join(", "));
assert.deepEqual(tools, ["jurisprudencia_buscar_djen","jurisprudencia_portal_inteiro_teor","jurisprudencia_resolver_links"]);

const r = await cJur.callTool({ name: "jurisprudencia_resolver_links", arguments: { numero: "5677110-87.2022.8.09.0051", url_inteiro_teor: "https://scon.stj.jus.br/it-exemplo.pdf" } });
const links = r.structuredContent;
console.log("resolver_links -> sigla:", links.sigla, "| inteiro teor:", links.url_inteiro_teor, "| certidão:", links.url_certidao.slice(0,20)+"...");
assert.equal(links.sigla, "TJGO");
assert.equal(links.url_inteiro_teor, "https://scon.stj.jus.br/it-exemplo.pdf");
assert.match(links.url_certidao, /NÃO VERIFICADO/);

// CICLO FECHADO: alimentar o montar_anexos do servidor tribunais-2grau
const tTrib = new StdioClientTransport({ command: "node", args: ["dist/index.js"], cwd: "/home/claude/build/rom-agent/mcp/tribunais2grau", env: { ...process.env } });
const cTrib = new Client({ name: "rom-audit", version: "1.0.0" }, { capabilities: {} });
await cTrib.connect(tTrib);
const decisao = { tribunal: links.sigla, classe_numero: "REsp 1234567", relator: "Min. A", orgao: "3a Turma", data_julgamento: "2024-08-15", url_inteiro_teor: links.url_inteiro_teor, url_ementa_acordao: links.url_ementa_acordao, url_relatorio_voto: links.url_relatorio_voto, url_certidao: links.url_certidao };
const a = await cTrib.callTool({ name: "tribunais_montar_anexos", arguments: { decisoes: [decisao], inicio: 3 } });
console.log("montar_anexos -> pendências:", a.structuredContent.pendencias.length);
assert.ok(a.structuredContent.rol.includes("scon.stj.jus.br/it-exemplo.pdf"));
assert.ok(a.structuredContent.pendencias.some(p => p.includes("certidão")));

await cJur.close(); await cTrib.close();
console.log("\nHANDSHAKE + CICLO FECHADO: OK — jurisprudencia.resolver_links -> tribunais.montar_anexos");
