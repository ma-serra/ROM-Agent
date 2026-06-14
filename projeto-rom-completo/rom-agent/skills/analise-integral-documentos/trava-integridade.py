#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROM Agent — TRAVA DE INTEGRIDADE (sem rollback, sem retrocesso).

Garante o princípio anti-supressão: uma vez extraído integralmente o processo,
nada do que foi capturado pode ser silenciosamente reduzido, omitido ou revertido
em etapas posteriores. Só há redução MEDIANTE AUTORIZAÇÃO EXPRESSA.

Mecânica:
- Ledger append-only (selos-integridade.jsonl): selos só avançam (forward-only).
  Nunca se apaga nem se sobrescreve um selo anterior  => SEM ROLLBACK.
- selar: registra o inventário integral de um processo. Se o novo inventário tiver
  MENOS documentos/itens que o último selo, ou perder itens antes presentes, é
  RETROCESSO => recusado (exit 3), salvo --autorizacao.
- verificar: confere um artefato (ficha/peça) contra o selo vigente. Se faltar
  item selado, BLOQUEIA (exit 2) => SEM RETROCESSO, salvo --autorizacao.

Uso:
  trava-integridade.py selar    --processo <num> --inventario inv.json [--autorizacao TOKEN] [--ledger arq]
  trava-integridade.py verificar --processo <num> --candidato cand.json [--autorizacao TOKEN] [--ledger arq]
  trava-integridade.py status   --processo <num> [--ledger arq]

Formato de inv.json / cand.json: {"itens": ["<id ou rótulo de doc/tese>", ...]}
"""
import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

LEDGER_PADRAO = "selos-integridade.jsonl"


def carregar_itens(caminho):
    with open(caminho, encoding="utf-8") as f:
        d = json.load(f)
    itens = d.get("itens", d if isinstance(d, list) else [])
    return [str(x).strip() for x in itens if str(x).strip()]


def fingerprint(itens):
    base = "\n".join(sorted(itens)).encode("utf-8")
    return hashlib.sha256(base).hexdigest()[:16]


def ler_selos(ledger, processo):
    selos = []
    if os.path.exists(ledger):
        with open(ledger, encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if not linha:
                    continue
                try:
                    r = json.loads(linha)
                    if r.get("processo") == processo:
                        selos.append(r)
                except json.JSONDecodeError:
                    continue
    return selos


def ultimo_selo(ledger, processo):
    selos = ler_selos(ledger, processo)
    return selos[-1] if selos else None


def cmd_selar(args):
    itens = set(carregar_itens(args.inventario))
    anterior = ultimo_selo(args.ledger, args.processo)
    if anterior:
        ant_itens = set(anterior.get("itens", []))
        perdidos = ant_itens - itens
        if (len(itens) < anterior.get("n_docs", 0) or perdidos) and not args.autorizacao:
            print("⛔ TRAVA: RETROCESSO/ROLLBACK bloqueado ao selar.", file=sys.stderr)
            print(f"  Selo anterior (v{anterior['versao']}): {anterior.get('n_docs')} itens.", file=sys.stderr)
            print(f"  Novo inventário: {len(itens)} itens.", file=sys.stderr)
            if perdidos:
                print(f"  Itens que sumiram: {sorted(perdidos)}", file=sys.stderr)
            print("  Para reduzir, repita com --autorizacao <motivo> (princípio: só suprime se autorizado).", file=sys.stderr)
            sys.exit(3)
    versao = (anterior["versao"] + 1) if anterior else 1
    registro = {
        "processo": args.processo,
        "versao": versao,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "n_docs": len(itens),
        "itens": sorted(itens),
        "fingerprint": fingerprint(list(itens)),
        "autorizacao": args.autorizacao or None,
    }
    with open(args.ledger, "a", encoding="utf-8") as f:
        f.write(json.dumps(registro, ensure_ascii=False) + "\n")
    print(f"✔ Selo v{versao} gravado para {args.processo}: {len(itens)} itens (fp {registro['fingerprint']}).")
    if args.autorizacao:
        print(f"  (redução autorizada: {args.autorizacao})")


def cmd_verificar(args):
    selo = ultimo_selo(args.ledger, args.processo)
    if not selo:
        print(f"⚠️ Sem selo para {args.processo}. Sele a extração integral antes de peticionar.", file=sys.stderr)
        sys.exit(4)
    cand = set(carregar_itens(args.candidato))
    selados = set(selo.get("itens", []))
    faltando = selados - cand
    if faltando and not args.autorizacao:
        print("⛔ TRAVA: RETROCESSO bloqueado. O artefato omite itens selados:", file=sys.stderr)
        for x in sorted(faltando):
            print("   - " + x, file=sys.stderr)
        print("  Reinclua os itens ou repita com --autorizacao <motivo> (só suprime se autorizado).", file=sys.stderr)
        sys.exit(2)
    if faltando:
        print(f"✔ Verificado COM autorização ({args.autorizacao}). Omissões consentidas: {len(faltando)}.")
    else:
        print(f"✔ Integridade preservada: {len(selados)} itens selados presentes no artefato.")


def cmd_status(args):
    selos = ler_selos(args.ledger, args.processo)
    if not selos:
        print(f"Sem selos para {args.processo}.")
        return
    print(f"Histórico de selos — {args.processo} (forward-only, {len(selos)} versões):")
    for s in selos:
        aut = f" [autorizado: {s['autorizacao']}]" if s.get("autorizacao") else ""
        print(f"  v{s['versao']} {s['timestamp']} — {s['n_docs']} itens — fp {s['fingerprint']}{aut}")


def main():
    p = argparse.ArgumentParser(description="Trava de integridade ROM (sem rollback/sem retrocesso).")
    sub = p.add_subparsers(dest="cmd", required=True)
    for nome in ("selar", "verificar", "status"):
        sp = sub.add_parser(nome)
        sp.add_argument("--processo", required=True)
        sp.add_argument("--ledger", default=LEDGER_PADRAO)
        if nome == "selar":
            sp.add_argument("--inventario", required=True)
            sp.add_argument("--autorizacao", default=None)
        if nome == "verificar":
            sp.add_argument("--candidato", required=True)
            sp.add_argument("--autorizacao", default=None)
    args = p.parse_args()
    {"selar": cmd_selar, "verificar": cmd_verificar, "status": cmd_status}[args.cmd](args)


if __name__ == "__main__":
    main()
