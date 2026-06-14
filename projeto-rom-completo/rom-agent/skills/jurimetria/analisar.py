#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROM Agent — análise jurimétrica (stdlib, sem dependências).

Lê um corpus de decisões em CSV (ver schema-decisoes.csv) e produz métricas de
posicionamento do julgador: taxa de conhecimento (admissibilidade empírica),
taxa de provimento, recortes por órgão / relator / fundamento, tempo de
tramitação e janela temporal. Imprime sempre os limites estatísticos.

Uso:
    python3 analisar.py corpus.csv
    python3 analisar.py corpus.csv --por relator
    python3 analisar.py corpus.csv --por fundamento_principal

Colunas esperadas (cabeçalho): tribunal, orgao, relator, materia, classe,
fundamento_principal, sumula_aplicada, conhecido, resultado,
data_distribuicao, data_julgamento, processo, fonte
"""
import csv
import sys
import statistics
from datetime import date

N_MINIMO_CONFIAVEL = 30


def parse_data(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        a, m, d = s.split("-")
        return date(int(a), int(m), int(d))
    except Exception:
        return None


def norm(s):
    return (s or "").strip().lower()


def carregar(caminho):
    with open(caminho, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def taxa(qtd, total):
    return (100.0 * qtd / total) if total else 0.0


def metricas(linhas):
    total = len(linhas)
    conhecidos = [r for r in linhas if norm(r.get("conhecido")) in ("sim", "s", "1", "true")]
    n_conh = len(conhecidos)
    providos = [r for r in conhecidos if norm(r.get("resultado")) in ("provido", "parcial", "parcialmente provido")]
    n_prov = len(providos)

    dias = []
    for r in linhas:
        dd = parse_data(r.get("data_distribuicao"))
        dj = parse_data(r.get("data_julgamento"))
        if dd and dj and dj >= dd:
            dias.append((dj - dd).days)

    julg = [parse_data(r.get("data_julgamento")) for r in linhas]
    julg = [d for d in julg if d]

    return {
        "n": total,
        "taxa_conhecimento": taxa(n_conh, total),
        "n_conhecidos": n_conh,
        "taxa_provimento": taxa(n_prov, n_conh),
        "n_providos": n_prov,
        "tempo_mediano_dias": int(statistics.median(dias)) if dias else None,
        "tempo_medio_dias": int(statistics.mean(dias)) if dias else None,
        "janela": (min(julg).isoformat(), max(julg).isoformat()) if julg else None,
    }


def imprime_bloco(titulo, m):
    print(f"\n## {titulo}")
    print(f"  n = {m['n']}", end="")
    if m["n"] < N_MINIMO_CONFIAVEL:
        print("  ⚠️ amostra reduzida — indicativo, não conclusivo", end="")
    print()
    print(f"  Taxa de conhecimento (admissibilidade): {m['taxa_conhecimento']:.1f}%  ({m['n_conhecidos']}/{m['n']})")
    print(f"  Taxa de provimento (entre conhecidos):  {m['taxa_provimento']:.1f}%  ({m['n_providos']}/{m['n_conhecidos']})")
    if m["tempo_mediano_dias"] is not None:
        print(f"  Tempo de tramitação: mediana {m['tempo_mediano_dias']} dias | média {m['tempo_medio_dias']} dias")
    if m["janela"]:
        print(f"  Janela analisada: {m['janela'][0]} a {m['janela'][1]}")


def por_dimensao(linhas, coluna):
    grupos = {}
    for r in linhas:
        grupos.setdefault((r.get(coluna) or "(vazio)").strip(), []).append(r)
    # ordena por taxa de provimento desc, depois por n desc
    itens = []
    for chave, ls in grupos.items():
        m = metricas(ls)
        itens.append((chave, m))
    itens.sort(key=lambda x: (x[1]["taxa_provimento"], x[1]["n"]), reverse=True)
    return itens


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    caminho = sys.argv[1]
    coluna = None
    if "--por" in sys.argv:
        coluna = sys.argv[sys.argv.index("--por") + 1]

    linhas = carregar(caminho)
    if not linhas:
        print("Corpus vazio.")
        sys.exit(1)

    print("=" * 64)
    print("RELATÓRIO JURIMÉTRICO ROM")
    print("=" * 64)
    imprime_bloco("Agregado do corpus", metricas(linhas))

    dimensoes = [coluna] if coluna else ["orgao", "relator", "fundamento_principal"]
    for dim in dimensoes:
        if dim not in linhas[0]:
            continue
        print(f"\n{'-'*64}\nRECORTE POR: {dim}\n{'-'*64}")
        for chave, m in por_dimensao(linhas, dim):
            imprime_bloco(f"{dim} = {chave}", m)

    print("\n" + "=" * 64)
    print("LIMITES (registrar sempre na peça/parecer):")
    print("  • Taxa sobre n pequeno é frágil (n<30 = indicativo).")
    print("  • Viés de seleção: decisões ementadas ≠ universo real.")
    print("  • Correlação ≠ causalidade; passado ≠ futuro (composição muda).")
    print("  • Usar só dados públicos; respeitar LGPD; não substitui o mérito.")
    print("=" * 64)


if __name__ == "__main__":
    main()
