#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROM Agent — roteador de modelos por custo (desonerar sem perder qualidade).

Escalona a tarefa ao modelo mais barato que ATENDE À BARRA: operacional->Haiku,
intermediário->Sonnet, jurídico crítico->Opus. Tarefas críticas NUNCA são
rebaixadas (trava de qualidade). Estima custo e mantém um ledger de gasto por
sessão com teto (não bloqueia tarefa crítica; alerta e pede autorização).

Uso:
  roteador.py escolher  --tarefa <nome> [--forcar <tier>] [--politica f]
  roteador.py custo     --modelo <haiku|sonnet|opus> --in <Mtok> --out <Mtok> [--batch] [--politica f]
  roteador.py registrar --modelo <tier> --in <Mtok> --out <Mtok> [--tarefa t] [--ledger f] [--politica f]
  roteador.py status    [--ledger f] [--politica f]
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))
POLITICA_PADRAO = os.path.join(AQUI, "politica-modelos.json")
LEDGER_PADRAO = "gasto-sessao.jsonl"


def carregar_politica(p):
    return json.load(open(p, encoding="utf-8"))


def cmd_escolher(a, pol):
    tarefa = a.tarefa
    tier_rec = pol["tarefas"].get(tarefa)
    if not tier_rec:
        print(f"⚠️ Tarefa '{tarefa}' não mapeada. Tarefas: {', '.join(pol['tarefas'])}", file=sys.stderr)
        sys.exit(1)
    critica = tarefa in pol["criticas_nunca_rebaixar"]
    if a.forcar and a.forcar != tier_rec:
        if critica and _ordem(a.forcar) < _ordem(tier_rec):
            print(f"⛔ TRAVA DE QUALIDADE: '{tarefa}' é crítica e não pode ser rebaixada de {tier_rec} para {a.forcar}.", file=sys.stderr)
            print("  Cost-cutting não se aplica ao julgamento jurídico/verificação. Mantido em " + tier_rec + ".", file=sys.stderr)
            sys.exit(2)
        tier_rec = a.forcar  # subir de tier é permitido
    m = pol["modelos"][tier_rec]
    print(json.dumps({
        "tarefa": tarefa, "tier": tier_rec, "modelo": m["id"],
        "in_usd_mtok": m["in"], "out_usd_mtok": m["out"],
        "critica": critica, "racional": m["uso"]
    }, ensure_ascii=False))


def _ordem(tier):
    return {"aberto_bedrock": 0, "haiku": 1, "sonnet": 2, "opus": 3}.get(tier, 1)


def cmd_custo(a, pol):
    m = pol["modelos"][a.modelo]
    custo = a._in * m["in"] + a.out * m["out"]
    if a.batch:
        custo *= 0.5
    print(f"Custo estimado ({a.modelo}{' batch' if a.batch else ''}): ${custo:.4f}  "
          f"[{a._in} Mtok in × ${m['in']} + {a.out} Mtok out × ${m['out']}]")


def _gasto_sessao(ledger):
    total = 0.0
    if os.path.exists(ledger):
        for linha in open(ledger, encoding="utf-8"):
            try:
                total += json.loads(linha).get("custo", 0.0)
            except json.JSONDecodeError:
                pass
    return total


def cmd_registrar(a, pol):
    m = pol["modelos"][a.modelo]
    custo = a._in * m["in"] + a.out * m["out"]
    reg = {"ts": datetime.now(timezone.utc).isoformat(), "tarefa": a.tarefa,
           "modelo": m["id"], "tier": a.modelo, "custo": round(custo, 4)}
    with open(a.ledger, "a", encoding="utf-8") as f:
        f.write(json.dumps(reg, ensure_ascii=False) + "\n")
    total = _gasto_sessao(a.ledger)
    cap = pol["orcamento"]["cap_sessao_usd"]
    alerta = cap * pol["orcamento"]["alerta_pct"] / 100.0
    print(f"Registrado ${custo:.4f} ({m['id']}). Gasto na sessão: ${total:.4f} / teto ${cap:.2f}.")
    if total >= cap:
        print(f"⚠️ TETO EXCEDIDO. Para tarefas operacionais, prefira Haiku/batch/cache ou autorize aumento. "
              f"Tarefas críticas seguem em qualidade plena.", file=sys.stderr)
    elif total >= alerta:
        print(f"⚠️ Atenção: {100*total/cap:.0f}% do teto. Considere batch/cache e Haiku no operacional.", file=sys.stderr)


def cmd_status(a, pol):
    total = _gasto_sessao(a.ledger)
    cap = pol["orcamento"]["cap_sessao_usd"]
    print(f"Gasto na sessão: ${total:.4f} / teto ${cap:.2f} ({100*total/cap:.0f}%).")


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("escolher"); e.add_argument("--tarefa", required=True); e.add_argument("--forcar"); e.add_argument("--politica", default=POLITICA_PADRAO)
    c = sub.add_parser("custo"); c.add_argument("--modelo", required=True); c.add_argument("--in", dest="_in", type=float, required=True); c.add_argument("--out", type=float, required=True); c.add_argument("--batch", action="store_true"); c.add_argument("--politica", default=POLITICA_PADRAO)
    r = sub.add_parser("registrar"); r.add_argument("--modelo", required=True); r.add_argument("--in", dest="_in", type=float, required=True); r.add_argument("--out", type=float, required=True); r.add_argument("--tarefa", default=""); r.add_argument("--ledger", default=LEDGER_PADRAO); r.add_argument("--politica", default=POLITICA_PADRAO)
    s = sub.add_parser("status"); s.add_argument("--ledger", default=LEDGER_PADRAO); s.add_argument("--politica", default=POLITICA_PADRAO)
    a = p.parse_args()
    pol = carregar_politica(a.politica)
    {"escolher": cmd_escolher, "custo": cmd_custo, "registrar": cmd_registrar, "status": cmd_status}[a.cmd](a, pol)


if __name__ == "__main__":
    main()
