#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { validarCNJ, chamarTrava, itensParaTrava, type InventarioAutos } from "./lib.js";
import { consultarProcesso, credenciaisPorSigla } from "./services/mni.js";

const CHARACTER_LIMIT = 20000;
const texto = (o: unknown) => {
  const s = JSON.stringify(o, null, 2);
  return s.length > CHARACTER_LIMIT ? s.slice(0, CHARACTER_LIMIT) + "\n…(truncado)" : s;
};

const server = new McpServer({ name: "autos-mcp-server", version: "1.0.0" });

// 1) Inventário dos autos (via MNI) — entrega à ferramenta de extração do agente
server.registerTool(
  "autos_inventario",
  {
    title: "Inventariar autos (MNI)",
    description:
      "Lista os documentos/peças de um processo via MNI (PJe/eproc/Projudi/ESAJ), para que a FERRAMENTA DE EXTRAÇÃO já existente do agente ROM leia o conteúdo. NÃO re-extrai: apenas inventaria (id, título, tipo, páginas, data). Acesso credenciado por tribunal (procurador vinculado para sigilo).\n\nArgs: numero (CNJ), sigla (tribunal, p/ achar credenciais no REGISTRO_MNI).\nRetorna: { processo, sistema, total, documentos[] }.\nErros: orientam cadastro de endpoint/credenciais MNI e alertam que a cobertura varia por tribunal.",
    inputSchema: {
      numero: z.string().min(20).describe("Número CNJ"),
      sigla: z.string().min(2).describe("Sigla do tribunal (ex.: TJGO) para resolver credenciais MNI"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ numero, sigla }: { numero: string; sigla: string }) => {
    try {
      validarCNJ(numero);
      const inv = await consultarProcesso(numero, sigla, credenciaisPorSigla(sigla));
      return { content: [{ type: "text" as const, text: texto(inv) }], structuredContent: inv };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Erro: ${(e as Error).message}` }], isError: true };
    }
  }
);

// 2) Selar a extração integral (TRAVA — sem rollback)
server.registerTool(
  "autos_selar_extracao",
  {
    title: "Selar extração integral (trava sem rollback)",
    description:
      "Sela o inventário integral de um processo na trava de integridade (ledger forward-only). Registra todos os itens capturados pela extração. Se um novo selo tiver MENOS itens que o anterior (retrocesso/rollback), é RECUSADO, salvo autorização expressa — realizando o princípio anti-supressão (só reduz se autorizado).\n\nArgs: processo (CNJ), itens[] (ids/rótulos dos documentos/teses extraídos), autorizacao? (motivo, se for redução consentida).\nRetorna: { ok, bloqueado, exit, mensagem }.",
    inputSchema: {
      processo: z.string().min(20).describe("Número CNJ"),
      itens: z.array(z.string()).min(1).describe("Itens integrais extraídos (ids/rótulos de documentos/teses)"),
      autorizacao: z.string().optional().describe("Motivo da redução, se for selar estado menos completo"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async ({ processo, itens, autorizacao }: { processo: string; itens: string[]; autorizacao?: string }) => {
    const r = chamarTrava("selar", processo, itens, { autorizacao });
    return { content: [{ type: "text" as const, text: r.mensagem || "(sem saída)" }], structuredContent: r, isError: r.exit < 0 };
  }
);

// 3) Verificar integridade de um artefato (TRAVA — sem retrocesso)
server.registerTool(
  "autos_verificar_integridade",
  {
    title: "Verificar integridade do artefato (trava sem retrocesso)",
    description:
      "Confere se um artefato (ficha do caso, peça) preserva os itens selados do processo. Se omitir item selado, BLOQUEIA (sem retrocesso), salvo autorização expressa. Use antes de finalizar qualquer peticionamento.\n\nArgs: processo (CNJ), itens[] (itens presentes no artefato), autorizacao? (motivo da omissão consentida).\nRetorna: { ok, bloqueado, exit, mensagem }. bloqueado=true indica omissão de item selado.",
    inputSchema: {
      processo: z.string().min(20).describe("Número CNJ"),
      itens: z.array(z.string()).describe("Itens presentes no artefato a verificar"),
      autorizacao: z.string().optional().describe("Motivo, se a omissão for consentida"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ processo, itens, autorizacao }: { processo: string; itens: string[]; autorizacao?: string }) => {
    const r = chamarTrava("verificar", processo, itens, { autorizacao });
    return { content: [{ type: "text" as const, text: r.mensagem || "(sem saída)" }], structuredContent: r, isError: r.exit < 0 };
  }
);

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("autos-mcp-server em stdio.");
}
runStdio().catch((e) => { console.error("Erro no servidor:", e); process.exit(1); });

export { server };
