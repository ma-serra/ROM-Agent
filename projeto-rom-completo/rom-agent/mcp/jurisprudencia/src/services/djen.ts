// Cliente do DJEN/Comunica (CNJ) — publicações: ementa, dispositivo, intimações,
// e link de inteiro teor quando disponível. Endpoint público (confirmar vigência).

export interface PublicacaoDJEN {
  numeroProcesso?: string;
  tipoComunicacao?: string;
  texto?: string;
  link?: string;            // inteiro teor / detalhe, quando fornecido
  data_disponibilizacao?: string;
  meio?: string;
  [k: string]: unknown;
}

export interface RespostaDJEN {
  total: number;
  publicacoes: PublicacaoDJEN[];
  [k: string]: unknown;
}

const TIMEOUT_MS = 20000;
// Endpoint da API de comunicações (confirmar na documentação do CNJ/PJe).
const DJEN_API = process.env.DJEN_API || "https://comunicaapi.pje.jus.br/api/v1/comunicacao";

export async function buscarDJEN(numeroProcesso: string): Promise<RespostaDJEN> {
  const semMascara = numeroProcesso.replace(/\D/g, "");
  const url = `${DJEN_API}?numeroProcesso=${encodeURIComponent(semMascara)}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!resp.ok) {
      throw new Error(
        `DJEN respondeu ${resp.status}. Endpoint: ${url}. ` +
        `Confirme o endereço vigente da API de comunicações do CNJ (pode exigir parâmetros adicionais).`
      );
    }
    const data = (await resp.json()) as { items?: PublicacaoDJEN[]; count?: number } & Record<string, unknown>;
    const items = (data.items as PublicacaoDJEN[]) ?? [];
    return { total: (data.count as number) ?? items.length, publicacoes: items };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`DJEN excedeu ${TIMEOUT_MS}ms (timeout).`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
