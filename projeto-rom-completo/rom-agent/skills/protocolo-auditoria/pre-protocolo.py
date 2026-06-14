#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROM Agent — gate PRÉ-PROTOCOLO (GO/NO-GO).

Agrega o resultado das auditorias e exige autorização humana. Só emite GO se
TODOS os itens forem verdadeiros E autorizacao_humana=true. Caso contrário,
NO-GO e bloqueia (exit 2). O protocolo eletrônico em si nunca é automático.

Uso:
  pre-protocolo.py --resultados r.json
  pre-protocolo.py --resultados r.json --recurso     (exige também admissibilidade)

Formato de r.json (booleanos):
{
  "integridade": true,
  "admissibilidade": true,
  "citacoes": true,
  "fidedignidade": true,
  "anexos": true,
  "tempestividade": true,
  "autorizacao_humana": false
}
"""
import argparse
import json
import sys

OBRIGATORIOS_BASE = ["integridade", "citacoes", "fidedignidade", "anexos", "tempestividade", "autorizacao_humana"]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--resultados", required=True)
    p.add_argument("--recurso", action="store_true", help="exige também 'admissibilidade'")
    a = p.parse_args()

    r = json.load(open(a.resultados, encoding="utf-8"))
    exigidos = list(OBRIGATORIOS_BASE)
    if a.recurso:
        exigidos.insert(1, "admissibilidade")

    faltando = [k for k in exigidos if not bool(r.get(k))]

    print("=" * 52)
    print("GATE PRÉ-PROTOCOLO — ROM")
    print("=" * 52)
    for k in exigidos:
        print(f"  [{'x' if r.get(k) else ' '}] {k}")
    if faltando:
        print("\nNO-GO. Pendências que impedem o protocolo:", file=sys.stderr)
        for k in faltando:
            rotulo = "AUTORIZAÇÃO HUMANA ausente" if k == "autorizacao_humana" else k
            print("   ✗ " + rotulo, file=sys.stderr)
        print("\nO protocolo NÃO está liberado. Resolva os itens e reautorize.", file=sys.stderr)
        sys.exit(2)
    print("\nGO — auditorias aprovadas e autorização humana presente.")
    print("Lembrete: o peticionamento eletrônico é executado pelo advogado, não pelo agente.")


if __name__ == "__main__":
    main()
