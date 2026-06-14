#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROM Agent — montar dossiê de anexos da petição.

Lê um CSV de decisões com seus links (ver schema-anexos.csv) e gera:
  (1) o bloco "DOS DOCUMENTOS ANEXOS" pronto para colar na petição (numeração Doc. NN);
  (2) a lista de download com nomes de arquivo padronizados para anexar.

Uso:
    python3 montar-anexos.py anexos.csv
    python3 montar-anexos.py anexos.csv --inicio 3   # começa a numerar em Doc. 03

Colunas: finalidade, tribunal, classe_numero, relator, orgao, data_julgamento,
url_inteiro_teor, url_ementa_acordao, url_relatorio_voto, url_certidao, url_consulta
(finalidade = precedente | paradigma)
"""
import csv
import sys
import re
from datetime import date

COMPONENTES = [
    ("url_inteiro_teor", "inteiro-teor", "inteiro teor"),
    ("url_ementa_acordao", "ementa-acordao", "ementa/acórdão"),
    ("url_relatorio_voto", "relatorio-voto", "relatório e voto"),
    ("url_certidao", "certidao-julgamento", "certidão de julgamento"),
]


def slug(s):
    s = (s or "").strip()
    s = re.sub(r"[^\w\.-]+", "-", s)
    return s.strip("-") or "sem-id"


def carregar(caminho):
    with open(caminho, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    caminho = sys.argv[1]
    inicio = 1
    if "--inicio" in sys.argv:
        inicio = int(sys.argv[sys.argv.index("--inicio") + 1])

    linhas = carregar(caminho)
    if not linhas:
        print("Sem decisões no CSV.")
        sys.exit(1)

    hoje = date.today().isoformat()
    rol = ["DOS DOCUMENTOS ANEXOS", ""]
    downloads = ["LISTA DE DOWNLOAD (nomear assim ao anexar):", ""]
    pendencias = []

    n = inicio
    for r in linhas:
        trib = (r.get("tribunal") or "").strip()
        cn = (r.get("classe_numero") or "").strip()
        rel = (r.get("relator") or "").strip()
        org = (r.get("orgao") or "").strip()
        dj = (r.get("data_julgamento") or "").strip()
        fin = (r.get("finalidade") or "precedente").strip()

        cabeca = f"Doc. {n:02d} — {trib} {cn} ({org}, Rel. {rel}, j. {dj}) — {fin}"
        rol.append(cabeca)

        sub = "a"
        algum = False
        for col, slugcomp, rotulo in COMPONENTES:
            url = (r.get(col) or "").strip()
            nome = f"Doc-{n:02d}{sub}_{slug(trib)}_{slug(cn)}_{slugcomp}.pdf"
            if url and not url.upper().startswith("NAO") and "VERIFICAR" not in url.upper():
                rol.append(f"   - {rotulo}: {url}  (acesso em {hoje}) → {nome}")
                downloads.append(f"{url}  ->  {nome}")
                algum = True
            else:
                rol.append(f"   - {rotulo}: ⚠️[NÃO VERIFICADO: obter o link oficial / Secretaria de Documentação]")
                pendencias.append(f"Doc. {n:02d} {trib} {cn} — {rotulo}")
            sub = chr(ord(sub) + 1)
        if not algum:
            pendencias.append(f"Doc. {n:02d} {trib} {cn} — nenhum link resolvido")
        rol.append("")
        n += 1

    print("\n".join(rol))
    print("\n" + "=" * 60)
    print("\n".join(downloads))
    if pendencias:
        print("\n" + "=" * 60)
        print("PENDÊNCIAS (resolver antes de protocolar):")
        for p in pendencias:
            print("  - " + p)
    print("\nObs.: anexar cópia de FONTE OFICIAL; no dissídio (alínea c) é requisito de admissibilidade.")


if __name__ == "__main__":
    main()
