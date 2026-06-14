#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  resolverLinks,
  siglaPorJTR,
  buscaInteiroTeorPorSegmento,
  partesCNJ,
} from "./lib.js";
import { buscarDJEN } from "./services/djen.js";

const CHARACTER_LIMIT = 20000;

function texto(obj: unknown): string {
  const s = JSON.stringify(obj, null, 2);
  return s.length > CHARACTER_LIMIT
    ? s.slice(0, CHARACTER_LIMIT) + `\n…(truncado em ${CHARACTER_LIMIT} caracteres)`
    : s;
}

const server = new McpServer({ name: "jurisprudencia-mcp-server", version: "1.0.0" });

// 1) Resolver links de uma decisão (determinístico) — alimenta o montar_anexos
server.registerTool(
  "jurisprudencia_resolver_links",
  {
    title: "Resolver links da decisão (inteiro teor, voto, certidão)",
    description:
      "A partir do número CNJ, devolve um objeto pronto para o montar_anexos com: URL de consulta processual (STJ/STF/DJEN), URL de consulta no DJEN e os quatro componentes (inteiro teor, ementa/acórdão, relatório e voto, certidão de julgamento). As entradas (consulta/DJEN) são determinísticas; componentes não informados ficam marcados como ⚠️[NÃO VERIFICADO] para resolução em runtime via jurisprudencia_buscar_djen. Se você já tiver as URLs de algum componente, passe-as que serão preservadas.\n\nArgs: numero (CNJ); opcionalmente url_inteiro_teor, url_ementa_acordao, url_relatorio_voto, url_certidao.\nRetorna: objeto LinksDecisao (compatível com tribunais_montar_anexos).",
    inputSchema: {
      numero: z.string().min(20).describe("Número CNJ, ex.: 5677110-87.2022.8.09.0051"),
      url_inteiro_teor: z.string().optional(),
      url_ementa_acordao: z.string().optional(),
      url_relatorio_voto: z.string().optional(),
      url_certidao: z.string().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (args: { numero: string; url_inteiro_teor?: string; url_ementa_acordao?: string; url_relatorio_voto?: string; url_certidao?: string }) => {
    try {
      const out = resolverLinks(args, siglaPorJTR);
      return { content: [{ type: "text" as const, text: texto(out) }], structuredContent: out };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Erro: ${(e as Error).message}` }], isError: true };
    }
  }
);

// 2) Buscar publicações no DJEN (ementa/dispositivo/intimações + link inteiro teor)
server.registerTool(
  "jurisprudencia_buscar_djen",
  {
    title: "Buscar publicações no DJEN/Comunica (CNJ)",
    description:
      "Consulta a API de comunicações do CNJ (DJEN) por número de processo e devolve as publicações (ementa de acórdãos, dispositivo, intimações) e o link de inteiro teor quando disponível. Cobertura nacional. Use para resolver o link de inteiro teor que falta no resolver_links.\n\nArgs: numero (CNJ).\nRetorna: { total, publicacoes[] }.\nErros: orienta confirmar o endpoint vigente da API do CNJ.",
    inputSchema: { numero: z.string().min(20).describe("Número CNJ") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ numero }: { numero: string }) => {
    try {
      partesCNJ(numero); // valida formato
      const resp = await buscarDJEN(numero);
      return { content: [{ type: "text" as const, text: texto(resp) }], structuredContent: resp };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Erro: ${(e as Error).message}` }], isError: true };
    }
  }
);

// 3) Indicar o portal de inteiro teor por segmento (entrada para busca manual/assistida)
server.registerTool(
  "jurisprudencia_portal_inteiro_teor",
  {
    title: "Portal de inteiro teor por segmento",
    description:
      "Devolve o portal oficial de inteiro teor adequado ao segmento do processo (STJ SCON, STF pesquisarInteiroTeor, ou DJEN nacional), a partir do número CNJ. Útil quando o inteiro teor precisa ser localizado manualmente ou por busca textual.\n\nArgs: numero (CNJ).\nRetorna: { segmento, portal_inteiro_teor }.",
    inputSchema: { numero: z.string().min(20).describe("Número CNJ") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ numero }: { numero: string }) => {
    try {
      const { j } = partesCNJ(numero);
      const out = { segmento: j, portal_inteiro_teor: buscaInteiroTeorPorSegmento(j) };
      return { content: [{ type: "text" as const, text: texto(out) }], structuredContent: out };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Erro: ${(e as Error).message}` }], isError: true };
    }
  }
);

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("jurisprudencia-mcp-server em stdio.");
}

runStdio().catch((e) => {
  console.error("Erro no servidor:", e);
  process.exit(1);
});
