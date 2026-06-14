// Lógica pura (sem rede) do conector de jurisprudência.
// Roteia por número CNJ e monta as URLs OFICIAIS de entrada para resolver os
// componentes da decisão: inteiro teor, ementa/acórdão, relatório e voto e
// certidão de julgamento. URLs de entrada (consulta/portal) são determinísticas;
// os links de documento (PDF) são resolvidos em runtime pela busca DJEN/portal.

const NAO_VERIFICADO = "⚠️[NÃO VERIFICADO: resolver via jurisprudencia_buscar_djen]";

export interface LinksDecisao {
  numero: string;
  segmento: string;
  sigla: string;
  // entradas determinísticas (alta confiança como ponto de partida):
  consulta_url: string;
  djen_consulta_url: string;
  // componentes para anexo (preenchidos em runtime; default = pendência marcada):
  url_inteiro_teor: string;
  url_ementa_acordao: string;
  url_relatorio_voto: string;
  url_certidao: string;
  observacao: string;
  [k: string]: unknown;
}

const SEGMENTOS: Record<string, string> = {
  "1": "STF", "2": "CNJ", "3": "STJ", "4": "Justiça Federal",
  "5": "Justiça do Trabalho", "6": "Justiça Eleitoral",
  "7": "Justiça Militar da União", "8": "Justiça Estadual", "9": "Justiça Militar Estadual",
};

const CNJ_RE = /^\s*(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})\s*$/;

export function partesCNJ(numero: string): { j: string; tr: string; semMascara: string } {
  const m = CNJ_RE.exec(numero);
  if (!m) {
    throw new Error(`Número fora do padrão CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO): "${numero}".`);
  }
  return { j: m[4], tr: m[5], semMascara: numero.replace(/\D/g, "") };
}

// URL de consulta processual por segmento (ponto de entrada oficial).
export function consultaPorSegmento(j: string, numero: string): string {
  switch (j) {
    case "3": // STJ
      return `https://processo.stj.jus.br/processo/pesquisa/?aplicacao=processos.ea&termo=${encodeURIComponent(numero)}`;
    case "1": // STF
      return `https://portal.stf.jus.br/processos/listarProcessos.asp?termo=${encodeURIComponent(numero)}`;
    default:
      // demais: DJEN nacional é o ponto de entrada mais estável
      return `https://comunica.pje.jus.br/consulta?numeroProcesso=${encodeURIComponent(numero.replace(/\D/g, ""))}`;
  }
}

// Busca de jurisprudência (inteiro teor) por segmento.
export function buscaInteiroTeorPorSegmento(j: string): string {
  if (j === "3") return "https://scon.stj.jus.br/SCON/";
  if (j === "1") return "https://portal.stf.jus.br/jurisprudencia/pesquisarInteiroTeor.asp";
  return "https://comunica.pje.jus.br/";
}

export function djenConsulta(numero: string): string {
  return `https://comunica.pje.jus.br/consulta?numeroProcesso=${encodeURIComponent(numero.replace(/\D/g, ""))}`;
}

export interface ResolverArgs {
  numero: string;
  url_inteiro_teor?: string;
  url_ementa_acordao?: string;
  url_relatorio_voto?: string;
  url_certidao?: string;
}

// Constrói o objeto de links. Componentes informados pelo chamador passam direto;
// os ausentes ficam marcados como pendência (a resolver via DJEN/portal em runtime).
export function resolverLinks(args: ResolverArgs, siglaResolver: (j: string, tr: string) => string): LinksDecisao {
  const { j, tr } = partesCNJ(args.numero);
  const sigla = siglaResolver(j, tr);
  return {
    numero: args.numero,
    segmento: SEGMENTOS[j] ?? "?",
    sigla,
    consulta_url: consultaPorSegmento(j, args.numero),
    djen_consulta_url: djenConsulta(args.numero),
    url_inteiro_teor: args.url_inteiro_teor || NAO_VERIFICADO,
    url_ementa_acordao: args.url_ementa_acordao || NAO_VERIFICADO,
    url_relatorio_voto: args.url_relatorio_voto || NAO_VERIFICADO,
    url_certidao: args.url_certidao || NAO_VERIFICADO,
    observacao:
      "Entradas (consulta/DJEN) determinísticas; componentes não informados devem ser resolvidos via jurisprudencia_buscar_djen ou no portal de inteiro teor (" +
      buscaInteiroTeorPorSegmento(j) + "). Confirmar na fonte; não inventar URL.",
  };
}

// Reaproveita a derivação de sigla (igual à do servidor tribunais-2grau).
export const ESTADUAL: Record<string, string> = {
  "01": "TJAC", "02": "TJAL", "03": "TJAP", "04": "TJAM", "05": "TJBA",
  "06": "TJCE", "07": "TJDFT", "08": "TJES", "09": "TJGO", "10": "TJMA",
  "11": "TJMT", "12": "TJMS", "13": "TJMG", "14": "TJPA", "15": "TJPB",
  "16": "TJPR", "17": "TJPE", "18": "TJPI", "19": "TJRJ", "20": "TJRN",
  "21": "TJRS", "22": "TJRO", "23": "TJRR", "24": "TJSC", "25": "TJSE",
  "26": "TJSP", "27": "TJTO",
};
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
