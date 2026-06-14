// Cliente HTTP do DataJud (Elasticsearch público do CNJ).
// Autenticação por APIKey pública (env DATAJUD_APIKEY). Erros acionáveis.

export interface DatajudHit {
  numeroProcesso?: string;
  classe?: { codigo?: number; nome?: string };
  orgaoJulgador?: { codigo?: number; nome?: string };
  dataAjuizamento?: string;
  movimentos?: Array<{ codigo?: number; nome?: string; dataHora?: string }>;
  [k: string]: unknown;
}

export interface DatajudResposta {
  total: number;
  hits: DatajudHit[];
  [k: string]: unknown;
}

const TIMEOUT_MS = 20000;

export async function consultarDatajud(
  datajudUrl: string,
  query: unknown,
  apiKey: string | undefined
): Promise<DatajudResposta> {
  if (!apiKey) {
    throw new Error(
      "DATAJUD_APIKEY ausente. Obtenha a chave pública vigente na wiki do CNJ " +
      "(datajud-wiki.cnj.jus.br/api-publica/acesso) e exporte em DATAJUD_APIKEY."
    );
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(datajudUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `APIKey ${apiKey}`,
      },
      body: JSON.stringify(query),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(
        `DataJud respondeu ${resp.status}. ` +
        (resp.status === 401 || resp.status === 403
          ? "Chave inválida/expirada — atualize DATAJUD_APIKEY na wiki do CNJ. "
          : "") +
        `Endpoint: ${datajudUrl}. Detalhe: ${txt.slice(0, 300)}`
      );
    }
    const data = (await resp.json()) as {
      hits?: { total?: { value?: number }; hits?: Array<{ _source?: DatajudHit }> };
    };
    const hitsArr = data.hits?.hits ?? [];
    return {
      total: data.hits?.total?.value ?? hitsArr.length,
      hits: hitsArr.map((h) => h._source ?? {}),
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`DataJud excedeu ${TIMEOUT_MS}ms (timeout). Tente novamente ou reduza o size.`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
