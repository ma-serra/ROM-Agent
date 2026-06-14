// Lógica pura (sem rede) — testável isoladamente.
// Decodifica número CNJ, roteia tribunal, deriva alias DataJud e monta anexos.

export interface ProcessoDecodificado {
  numero: string;
  sequencial: string;
  digito: string;
  ano: string;
  segmentoCodigo: string;
  segmento: string;
  tribunalCodigo: string;
  sigla: string;
  origem: string;
  datajudAlias: string | null;
  datajudUrl: string | null;
}

export const SEGMENTOS: Record<string, string> = {
  "1": "STF",
  "2": "CNJ",
  "3": "STJ",
  "4": "Justiça Federal",
  "5": "Justiça do Trabalho",
  "6": "Justiça Eleitoral",
  "7": "Justiça Militar da União",
  "8": "Justiça Estadual",
  "9": "Justiça Militar Estadual",
};

// Justiça Estadual (J=8): TR por ordem alfabética de estado (Anexo Res. CNJ 65/2008)
export const ESTADUAL: Record<string, string> = {
  "01": "TJAC", "02": "TJAL", "03": "TJAP", "04": "TJAM", "05": "TJBA",
  "06": "TJCE", "07": "TJDFT", "08": "TJES", "09": "TJGO", "10": "TJMA",
  "11": "TJMT", "12": "TJMS", "13": "TJMG", "14": "TJPA", "15": "TJPB",
  "16": "TJPR", "17": "TJPE", "18": "TJPI", "19": "TJRJ", "20": "TJRN",
  "21": "TJRS", "22": "TJRO", "23": "TJRR", "24": "TJSC", "25": "TJSE",
  "26": "TJSP", "27": "TJTO",
};

const CNJ_RE = /^\s*(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})\s*$/;

export function siglaPorJTR(j: string, tr: string): string {
  switch (j) {
    case "1": return "STF";
    case "3": return "STJ";
    case "4": return `TRF${parseInt(tr, 10)}`;
    case "5": return `TRT${parseInt(tr, 10)}`;
    case "8": return ESTADUAL[tr] ?? `TJ?(${tr})`;
    case "6": return `TRE(${tr})`;
    case "9": return `TJM(${tr})`;
    default: return `?(${j}.${tr})`;
  }
}

export function decodeCNJ(numero: string): ProcessoDecodificado {
  const m = CNJ_RE.exec(numero);
  if (!m) {
    throw new Error(
      `Número fora do padrão CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO): "${numero}". ` +
      `Verifique pontuação e dígitos.`
    );
  }
  const [, sequencial, digito, ano, j, tr, origem] = m;
  const sigla = siglaPorJTR(j, tr);
  const roteavel = !sigla.includes("?") && !sigla.includes("(");
  const datajudAlias = roteavel ? `api_publica_${sigla.toLowerCase()}` : null;
  const datajudUrl = datajudAlias
    ? `https://api-publica.datajud.cnj.jus.br/${datajudAlias}/_search`
    : null;
  return {
    numero,
    sequencial,
    digito,
    ano,
    segmentoCodigo: j,
    segmento: SEGMENTOS[j] ?? "?",
    tribunalCodigo: tr,
    sigla,
    origem,
    datajudAlias,
    datajudUrl,
  };
}

// Monta uma query Elasticsearch para o DataJud por número de processo.
// O DataJud guarda o número sem máscara em numeroProcesso.
export function buildDatajudQueryPorNumero(numero: string, size = 10): unknown {
  const semMascara = numero.replace(/\D/g, "");
  return {
    size,
    query: { match: { numeroProcesso: semMascara } },
  };
}

// Query por filtros de jurimetria (classe/órgão/intervalo de datas).
export function buildDatajudQueryPorFiltros(args: {
  classeCodigo?: string;
  orgaoJulgador?: string;
  dataInicial?: string;
  dataFinal?: string;
  size?: number;
  from?: number;
}): unknown {
  const must: unknown[] = [];
  if (args.classeCodigo) must.push({ match: { "classe.codigo": args.classeCodigo } });
  if (args.orgaoJulgador) must.push({ match: { "orgaoJulgador.nome": args.orgaoJulgador } });
  if (args.dataInicial || args.dataFinal) {
    must.push({
      range: {
        dataAjuizamento: {
          ...(args.dataInicial ? { gte: args.dataInicial } : {}),
          ...(args.dataFinal ? { lte: args.dataFinal } : {}),
        },
      },
    });
  }
  return {
    size: args.size ?? 50,
    from: args.from ?? 0,
    query: must.length ? { bool: { must } } : { match_all: {} },
  };
}

export interface RegistroTribunal {
  nome?: string;
  segmento?: string;
  datajud_alias?: string;
  sistema?: string;
  jurisprudencia_url?: string;
  consulta_url?: string;
  observacao?: string;
}

const NAO_VERIFICADO = "⚠️[NÃO VERIFICADO]";

export function entradaRegistro(
  registro: Record<string, RegistroTribunal>,
  sigla: string,
  datajudUrl: string | null
): RegistroTribunal & { datajud_url: string | null; djen_url: string; fonte: string } {
  const base = registro[sigla];
  if (base) {
    return { ...base, datajud_url: datajudUrl, djen_url: "https://comunica.pje.jus.br/", fonte: "registro" };
  }
  return {
    nome: sigla,
    sistema: `${NAO_VERIFICADO}: completar registro-tribunais.json`,
    jurisprudencia_url: NAO_VERIFICADO,
    consulta_url: NAO_VERIFICADO,
    datajud_url: datajudUrl,
    djen_url: "https://comunica.pje.jus.br/",
    fonte: "fallback",
  };
}

// ---------- Anexos ----------
export interface DecisaoAnexo {
  finalidade?: string;
  tribunal?: string;
  classe_numero?: string;
  relator?: string;
  orgao?: string;
  data_julgamento?: string;
  url_inteiro_teor?: string;
  url_ementa_acordao?: string;
  url_relatorio_voto?: string;
  url_certidao?: string;
}

const COMPONENTES: Array<[keyof DecisaoAnexo, string, string]> = [
  ["url_inteiro_teor", "inteiro-teor", "inteiro teor"],
  ["url_ementa_acordao", "ementa-acordao", "ementa/acórdão"],
  ["url_relatorio_voto", "relatorio-voto", "relatório e voto"],
  ["url_certidao", "certidao-julgamento", "certidão de julgamento"],
];

function slug(s: string | undefined): string {
  const v = (s ?? "").trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return v || "sem-id";
}

function urlValida(u: string | undefined): boolean {
  if (!u) return false;
  const up = u.toUpperCase();
  return !up.startsWith("NAO") && !up.includes("VERIFICAR") && !up.includes("VERIFICADO");
}

export interface ResultadoAnexos {
  rol: string;
  downloads: string;
  pendencias: string[];
  [k: string]: unknown;
}

export function montarAnexos(decisoes: DecisaoAnexo[], inicio = 1, hoje?: string): ResultadoAnexos {
  const data = hoje ?? new Date().toISOString().slice(0, 10);
  const rol: string[] = ["DOS DOCUMENTOS ANEXOS", ""];
  const downloads: string[] = ["LISTA DE DOWNLOAD (nomear assim ao anexar):", ""];
  const pendencias: string[] = [];

  let n = inicio;
  for (const r of decisoes) {
    const nn = String(n).padStart(2, "0");
    rol.push(
      `Doc. ${nn} — ${r.tribunal ?? ""} ${r.classe_numero ?? ""} ` +
      `(${r.orgao ?? ""}, Rel. ${r.relator ?? ""}, j. ${r.data_julgamento ?? ""}) — ${r.finalidade ?? "precedente"}`
    );
    let sub = "a";
    let algum = false;
    for (const [col, slugcomp, rotulo] of COMPONENTES) {
      const url = r[col];
      const nome = `Doc-${nn}${sub}_${slug(r.tribunal)}_${slug(r.classe_numero)}_${slugcomp}.pdf`;
      if (urlValida(url)) {
        rol.push(`   - ${rotulo}: ${url}  (acesso em ${data}) → ${nome}`);
        downloads.push(`${url}  ->  ${nome}`);
        algum = true;
      } else {
        rol.push(`   - ${rotulo}: ${NAO_VERIFICADO}: obter o link oficial / Secretaria de Documentação`);
        pendencias.push(`Doc. ${nn} ${r.tribunal ?? ""} ${r.classe_numero ?? ""} — ${rotulo}`);
      }
      sub = String.fromCharCode(sub.charCodeAt(0) + 1);
    }
    if (!algum) pendencias.push(`Doc. ${nn} ${r.tribunal ?? ""} ${r.classe_numero ?? ""} — nenhum link resolvido`);
    rol.push("");
    n += 1;
  }
  return { rol: rol.join("\n"), downloads: downloads.join("\n"), pendencias };
}
