#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROM Agent — resolvedor de tribunal (2º grau, nacional).

A partir do número único CNJ (Res. 65/2008) NNNNNNN-DD.AAAA.J.TR.OOOO, identifica
segmento (J), tribunal (TR) e origem (OOOO); deriva a sigla, o alias do DataJud
(regra: api_publica_<sigla>) e consulta o registro de sistemas/portais
(registro-tribunais.json) para devolver onde obter jurisprudência, consulta
processual e inteiro teor — independentemente da unidade judiciária do país.

Uso:
    python3 resolver-tribunal.py 5677110-87.2022.8.09.0051
    python3 resolver-tribunal.py 0001234-56.2023.8.04.0001
"""
import sys
import os
import re
import json

# Justiça Estadual (J=8): TR por ordem alfabética de estado
ESTADUAL = {
    "01": "TJAC", "02": "TJAL", "03": "TJAP", "04": "TJAM", "05": "TJBA",
    "06": "TJCE", "07": "TJDFT", "08": "TJES", "09": "TJGO", "10": "TJMA",
    "11": "TJMT", "12": "TJMS", "13": "TJMG", "14": "TJPA", "15": "TJPB",
    "16": "TJPR", "17": "TJPE", "18": "TJPI", "19": "TJRJ", "20": "TJRN",
    "21": "TJRS", "22": "TJRO", "23": "TJRR", "24": "TJSC", "25": "TJSE",
    "26": "TJSP", "27": "TJTO",
}
SEGMENTOS = {
    "1": "STF", "2": "CNJ", "3": "STJ", "4": "Justiça Federal",
    "5": "Justiça do Trabalho", "6": "Justiça Eleitoral",
    "7": "Justiça Militar da União", "8": "Justiça Estadual",
    "9": "Justiça Militar Estadual",
}

CNJ_RE = re.compile(r"^\s*(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})\s*$")


def sigla_por_jtr(j, tr):
    if j == "1":
        return "STF"
    if j == "3":
        return "STJ"
    if j == "4":
        return f"TRF{int(tr)}"          # 4.01 -> TRF1
    if j == "5":
        return f"TRT{int(tr)}"          # 5.03 -> TRT3
    if j == "8":
        return ESTADUAL.get(tr, f"TJ?({tr})")
    if j == "6":
        return f"TRE({tr})"             # eleitoral: confirmar UF pelo anexo Res.65
    if j == "9":
        return f"TJM({tr})"
    return f"?({j}.{tr})"


def carregar_registro():
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "registro-tribunais.json")
    if os.path.exists(p):
        return json.load(open(p, encoding="utf-8"))
    return {}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    numero = sys.argv[1]
    m = CNJ_RE.match(numero)
    if not m:
        print("Número fora do padrão CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO).")
        sys.exit(1)

    seq, dv, ano, j, tr, origem = m.groups()
    sigla = sigla_por_jtr(j, tr)
    alias = f"api_publica_{sigla.lower()}" if "?" not in sigla and "(" not in sigla else "(verificar no anexo da Res. CNJ 65/2008)"
    datajud = f"https://api-publica.datajud.cnj.jus.br/{alias}/_search" if alias.startswith("api_publica") else alias

    reg = carregar_registro().get(sigla, {})

    print("=" * 60)
    print("RESOLUÇÃO DE TRIBUNAL (2º grau / nacional)")
    print("=" * 60)
    print(f"Número:        {numero}")
    print(f"Segmento (J):  {j} — {SEGMENTOS.get(j, '?')}")
    print(f"Tribunal (TR): {tr} — {sigla}")
    print(f"Origem (OOOO): {origem}  (vara/comarca/seção de origem)")
    print(f"Ano:           {ano}")
    print("-" * 60)
    print(f"DataJud (metadados/movimentos): {datajud}")
    print(f"DJEN (publicações/ementa/intimações): https://comunica.pje.jus.br/  (filtro pelo nº)")
    if reg:
        print(f"Sistema processual: {reg.get('sistema','⚠️[NÃO VERIFICADO]')}")
        print(f"Jurisprudência:     {reg.get('jurisprudencia_url','⚠️[NÃO VERIFICADO]')}")
        print(f"Consulta processo:  {reg.get('consulta_url','⚠️[NÃO VERIFICADO]')}")
        if reg.get("observacao"):
            print(f"Obs.: {reg['observacao']}")
    else:
        print("Sistema/portal: ⚠️[NÃO VERIFICADO: completar registro-tribunais.json para esta sigla]")
    print("-" * 60)
    print("Componentes a baixar/anexar (skill dossie-decisoes-anexos):")
    print("  inteiro teor · ementa/acórdão · relatório e voto (Desembargador relator) · certidão de julgamento (sessão da câmara/turma)")
    print("=" * 60)


if __name__ == "__main__":
    main()
