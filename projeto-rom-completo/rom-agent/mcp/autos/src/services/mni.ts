// Cliente MNI (Modelo Nacional de Interoperabilidade) — consultarProcesso.
// Acesso CREDENCIADO por tribunal (procurador vinculado para sigilo). Cobertura
// varia por tribunal; WSDL publicado não garante funcionamento. Erros acionáveis.

import type { DocumentoAutos, InventarioAutos } from "../lib.js";

const TIMEOUT_MS = 30000;

export interface CredenciaisMNI {
  endpoint?: string; // endpoint MNI do tribunal (REST/SOAP)
  usuario?: string;
  senha?: string;
}

// Resolve credenciais por sigla a partir do env (REGISTRO_MNI = JSON {sigla:{endpoint,...}}).
export function credenciaisPorSigla(sigla: string): CredenciaisMNI {
  try {
    const reg = JSON.parse(process.env.REGISTRO_MNI || "{}") as Record<string, CredenciaisMNI>;
    return reg[sigla] || {};
  } catch {
    return {};
  }
}

export async function consultarProcesso(
  numero: string,
  sigla: string,
  cred: CredenciaisMNI
): Promise<InventarioAutos> {
  if (!cred.endpoint) {
    throw new Error(
      `Sem endpoint MNI para ${sigla}. Cadastre em REGISTRO_MNI {"${sigla}":{"endpoint":"...","usuario":"...","senha":"..."}}. ` +
      `Nem todo tribunal expõe MNI funcional; confirme com a TI do tribunal (credenciamento de procurador vinculado).`
    );
  }
  if (!cred.usuario || !cred.senha) {
    throw new Error(
      `Credenciais MNI ausentes para ${sigla}. O acesso aos autos (sobretudo sob sigilo) exige procurador vinculado. ` +
      `Forneça usuario/senha do PJe no REGISTRO_MNI.`
    );
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Operação consultarProcesso (movimentos=false, documentos=true) — payload depende
    // de o tribunal expor REST ou SOAP; aqui assume-se um gateway REST do escritório.
    const resp = await fetch(cred.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        operacao: "consultarProcesso",
        numeroProcesso: numero.replace(/\D/g, ""),
        usuario: cred.usuario,
        senha: cred.senha,
        incluirDocumentos: true,
        incluirCabecalho: true,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      throw new Error(
        `MNI ${sigla} respondeu ${resp.status}. ` +
        (resp.status === 401 || resp.status === 403
          ? "Credenciais inválidas ou sem vínculo no processo (sigilo). "
          : "") +
        `Endpoint: ${cred.endpoint}.`
      );
    }
    const data = (await resp.json()) as { documentos?: DocumentoAutos[] } & Record<string, unknown>;
    const documentos = (data.documentos as DocumentoAutos[]) ?? [];
    return { processo: numero, sistema: sigla, total: documentos.length, documentos };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`MNI ${sigla} excedeu ${TIMEOUT_MS}ms (timeout).`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
