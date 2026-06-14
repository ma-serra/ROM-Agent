// Lógica pura do conector de autos. Não re-implementa extração: o agente ROM já
// tem ferramenta de extração; aqui SOMAMOS inventário (MNI) e a ponte com a TRAVA
// de integridade (sem rollback/sem retrocesso), delegando a extração de conteúdo.

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface DocumentoAutos {
  id: string;
  titulo?: string;
  tipo?: string;
  paginas?: number;
  data?: string;
  [k: string]: unknown;
}

export interface InventarioAutos {
  processo: string;
  sistema: string;
  total: number;
  documentos: DocumentoAutos[];
  [k: string]: unknown;
}

const CNJ_RE = /^\s*\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\s*$/;
export function validarCNJ(numero: string): void {
  if (!CNJ_RE.test(numero)) {
    throw new Error(`Número fora do padrão CNJ: "${numero}".`);
  }
}

// Itens normalizados para a trava (rótulos estáveis de documento).
export function itensParaTrava(inv: InventarioAutos): string[] {
  return inv.documentos.map((d) => `${d.id}${d.titulo ? "::" + d.titulo : ""}`);
}

export interface ResultadoTrava {
  ok: boolean;
  bloqueado: boolean;
  exit: number;
  mensagem: string;
  [k: string]: unknown;
}

// Ponte com a trava (fonte única de verdade em Python). Evita duplicar a lógica.
export function chamarTrava(
  subcomando: "selar" | "verificar" | "status",
  processo: string,
  itens: string[] | null,
  opts: { autorizacao?: string } = {}
): ResultadoTrava {
  const script = process.env.TRAVA_SCRIPT;
  const ledger = process.env.LEDGER || "selos-integridade.jsonl";
  if (!script) {
    return { ok: false, bloqueado: false, exit: -1, mensagem: "TRAVA_SCRIPT não configurado (caminho do trava-integridade.py)." };
  }
  const dir = mkdtempSync(join(tmpdir(), "rom-trava-"));
  try {
    const args = [script, subcomando, "--processo", processo, "--ledger", ledger];
    if (subcomando !== "status" && itens) {
      const arq = join(dir, "itens.json");
      writeFileSync(arq, JSON.stringify({ itens }), "utf-8");
      args.push(subcomando === "selar" ? "--inventario" : "--candidato", arq);
    }
    if (opts.autorizacao) args.push("--autorizacao", opts.autorizacao);
    const r = spawnSync("python3", args, { encoding: "utf-8" });
    const exit = r.status ?? -1;
    const mensagem = (r.stdout || "") + (r.stderr || "");
    // exit 2 (verificar) e 3 (selar) = bloqueio por retrocesso/rollback
    const bloqueado = exit === 2 || exit === 3;
    return { ok: exit === 0, bloqueado, exit, mensagem: mensagem.trim() };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
