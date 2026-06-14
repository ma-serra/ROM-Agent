#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "node:fs";
import {
  decodeCNJ,
  entradaRegistro,
  buildDatajudQueryPorNumero,
  buildDatajudQueryPorFiltros,
  montarAnexos,
  type RegistroTribunal,
  type DecisaoAnexo,
} from "./lib.js";
import { consultarDatajud } from "./services/datajud.js";

const CHARACTER_LIMIT = 20000;

function carregarRegistro(): Record<string, RegistroTribunal> {
  const p = process.env.REGISTRO;
  if (!p) return {};
  try {
    const raw = JSON.parse(readFileSync(p, "utf-8")) as Record<string, RegistroTribunal>;
    delete (raw as Record<string, unknown>)["_nota"];
    return raw;
  } catch {
    return {};
  }
}

function texto(obj: unknown): string {
  const s = JSON.stringify(obj, null, 2);
  return s.length > CHARACTER_LIMIT
    ? s.slice(0, CHARACTER_LIMIT) + `\n…(truncado em ${CHARACTER_LIMIT} caracteres; refine a consulta)`
    : s;
}

const server = new McpServer({ name: "tribunais-2grau-mcp-server", version: "1.0.0" });

// 1) Resolver processo pelo número CNJ
server.registerTool(
  "tribunais_resolver_processo",
  {
    title: "Resolver tribunal pelo número CNJ",
    description:
      "Decodifica o número único CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO) de qualquer unidade judiciária do país e devolve: segmento, tribunal (sigla), alias e URL do DataJud (regra api_publica_<sigla>), URL do DJEN e, do registro, o sistema processual e os portais de jurisprudência/consulta. Use para saber para ONDE rotear a busca de uma decisão de 1º ou 2º grau.\n\nArgs: numero (string, formato CNJ).\nRetorna: objeto com segmento, sigla, datajud_url, djen_url, sistema, jurisprudencia_url, consulta_url, fonte.\nErros: 'Número fora do padrão CNJ' se a máscara estiver incorreta.",
    inputSchema: { numero: z.string().min(20).describe("Número CNJ, ex.: 5677110-87.2022.8.09.0051") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ numero }: { numero: string }) => {
    try {
      const d = decodeCNJ(numero);
      const reg = entradaRegistro(carregarRegistro(), d.sigla, d.datajudUrl);
      const out = { processo: d, roteamento: reg };
      return { content: [{ type: "text" as const, text: texto(out) }], structuredContent: out };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Erro: ${(e as Error).message}` }], isError: true };
    }
  }
);

// 2) Buscar no DataJud (metadados/movimentos) — jurimetria
server.registerTool(
  "tribunais_buscar_datajud",
  {
    title: "Buscar metadados no DataJud (CNJ)",
    description:
      "Consulta a API pública do DataJud (Elasticsearch) por número de processo OU por filtros (classe, órgão, intervalo de datas), em qualquer tribunal. Traz metadados e movimentos — base para jurimetria e tempo de tramitação. NÃO traz voto/inteiro teor (use o portal do tribunal para isso).\n\nArgs: numero (resolve o tribunal sozinho) OU sigla + filtros; size, from para paginação.\nRetorna: { total, hits[] } com capa e movimentos.\nErros: exige DATAJUD_APIKEY (chave pública do CNJ); mensagens orientam a atualização da chave.",
    inputSchema: {
      numero: z.string().optional().describe("Número CNJ; quando informado, resolve o tribunal automaticamente"),
      sigla: z.string().optional().describe("Sigla do tribunal (ex.: TJGO) quando não houver número"),
      classeCodigo: z.string().optional().describe("Código da classe processual (filtro)"),
      orgaoJulgador: z.string().optional().describe("Nome do órgão julgador (filtro)"),
      dataInicial: z.string().optional().describe("Data inicial AAAA-MM-DD (filtro por ajuizamento)"),
      dataFinal: z.string().optional().describe("Data final AAAA-MM-DD"),
      size: z.number().int().min(1).max(1000).default(20).describe("Itens por página (máx. 1000)"),
      from: z.number().int().min(0).default(0).describe("Deslocamento de paginação"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (args: {
    numero?: string; sigla?: string; classeCodigo?: string; orgaoJulgador?: string;
    dataInicial?: string; dataFinal?: string; size: number; from: number;
  }) => {
    try {
      let datajudUrl: string | null = null;
      if (args.numero) {
        datajudUrl = decodeCNJ(args.numero).datajudUrl;
      } else if (args.sigla) {
        datajudUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${args.sigla.toLowerCase()}/_search`;
      }
      if (!datajudUrl) {
        return { content: [{ type: "text" as const, text: "Erro: informe 'numero' (CNJ) ou 'sigla' do tribunal." }], isError: true };
      }
      const query = args.numero
        ? buildDatajudQueryPorNumero(args.numero, args.size)
        : buildDatajudQueryPorFiltros(args);
      const resp = await consultarDatajud(datajudUrl, query, process.env.DATAJUD_APIKEY);
      return { content: [{ type: "text" as const, text: texto(resp) }], structuredContent: resp };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Erro: ${(e as Error).message}` }], isError: true };
    }
  }
);

// 3) Montar rol de anexos (inteiro teor, ementa, voto, certidão)
server.registerTool(
  "tribunais_montar_anexos",
  {
    title: "Montar rol de documentos anexos",
    description:
      "Recebe a lista de decisões (com os links já resolvidos de inteiro teor, ementa/acórdão, relatório e voto e certidão de julgamento) e devolve o bloco 'DOS DOCUMENTOS ANEXOS' pronto para a petição (numeração Doc. NN), a lista de download com nomes padronizados e as pendências (links faltantes marcados como NÃO VERIFICADO). Vale para 1º e 2º grau, qualquer tribunal.\n\nArgs: decisoes[] (cada uma com tribunal, classe_numero, relator, orgao, data_julgamento e as URLs dos componentes), inicio (número do primeiro Doc.).\nRetorna: { rol, downloads, pendencias[] }.",
    inputSchema: {
      decisoes: z.array(z.object({
        finalidade: z.string().optional(),
        tribunal: z.string().optional(),
        classe_numero: z.string().optional(),
        relator: z.string().optional(),
        orgao: z.string().optional(),
        data_julgamento: z.string().optional(),
        url_inteiro_teor: z.string().optional(),
        url_ementa_acordao: z.string().optional(),
        url_relatorio_voto: z.string().optional(),
        url_certidao: z.string().optional(),
      })).min(1).describe("Decisões a anexar"),
      inicio: z.number().int().min(1).default(1).describe("Número do primeiro documento (Doc. NN)"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ decisoes, inicio }: { decisoes: DecisaoAnexo[]; inicio: number }) => {
    const r = montarAnexos(decisoes, inicio);
    return {
      content: [{ type: "text" as const, text: `${r.rol}\n\n${r.downloads}\n\nPENDÊNCIAS: ${r.pendencias.join("; ") || "nenhuma"}` }],
      structuredContent: r,
    };
  }
);

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("tribunais-2grau-mcp-server em stdio.");
}

runStdio().catch((e) => {
  console.error("Erro no servidor:", e);
  process.exit(1);
});
