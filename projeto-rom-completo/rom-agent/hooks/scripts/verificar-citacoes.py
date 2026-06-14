#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ROM Agent — hook PostToolUse de verificação de citações.

Recebe JSON do Claude Code via stdin (evento PostToolUse para Write/Edit).
Varre o arquivo gravado em busca de citações jurídicas (súmulas, acórdãos,
artigos). Se houver citação que NÃO esteja:
  (a) no registro `citacoes-verificadas.txt` da raiz do projeto, nem
  (b) marcada com ⚠️[NÃO VERIFICADO]
então BLOQUEIA (exit 2) e devolve a lista para o agente revisar.

Filosofia ROM: conferibilidade é determinista, não confiada ao prompt.
"""
import sys
import os
import re
import json

# Padrões de citação jurídica brasileira
PADROES = [
    re.compile(r"S[úu]mula\s+n?º?\s*\d+", re.IGNORECASE),
    re.compile(r"\b(?:REsp|RE|AgRg|AREsp|ARE|HC|RHC|EREsp|AI)\s*n?º?\s*[\d\.\-/]+", re.IGNORECASE),
    re.compile(r"Tema\s+(?:repetitivo\s+)?n?º?\s*\d+", re.IGNORECASE),
]

MARCA_NAO_VERIFICADO = "NÃO VERIFICADO"
# Captura cada span do tipo [NÃO VERIFICADO: ...] para amarrar a marca à citação certa
SPAN_NAO_VERIFICADO = re.compile(r"\[\s*NÃO VERIFICADO[^\]]*\]", re.IGNORECASE)


def ler_evento():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def caminho_arquivo(evento):
    # O caminho do arquivo gravado costuma vir em tool_input.file_path
    ti = evento.get("tool_input", {}) or {}
    return ti.get("file_path") or ti.get("path")


def carregar_registro(raiz):
    reg = os.path.join(raiz, "citacoes-verificadas.txt")
    verificadas = set()
    if os.path.exists(reg):
        with open(reg, encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if linha and not linha.startswith("#"):
                    verificadas.add(linha.lower())
    return verificadas


def main():
    evento = ler_evento()
    arquivo = caminho_arquivo(evento)

    # Só audita peças de texto jurídico
    if not arquivo or not arquivo.lower().endswith((".md", ".txt", ".docx.md")):
        sys.exit(0)
    if not os.path.exists(arquivo):
        sys.exit(0)

    raiz = evento.get("cwd") or os.getcwd()
    verificadas = carregar_registro(raiz)

    with open(arquivo, encoding="utf-8", errors="ignore") as f:
        texto = f.read()

    # Posições de todos os spans [NÃO VERIFICADO: ...]
    spans_nv = [(m.start(), m.end()) for m in SPAN_NAO_VERIFICADO.finditer(texto)]

    def dentro_de_marca(pos):
        return any(ini <= pos < fim for ini, fim in spans_nv)

    pendentes = []
    for padrao in PADROES:
        for m in padrao.finditer(texto):
            cit = m.group(0).strip()
            # excusada apenas se a citação está DENTRO de um span [NÃO VERIFICADO: ...]
            if dentro_de_marca(m.start()):
                continue
            if cit.lower() in verificadas:
                continue
            # normalização simples para casar com o registro
            if any(cit.lower() in v or v in cit.lower() for v in verificadas):
                continue
            pendentes.append(cit)

    if pendentes:
        unicas = sorted(set(pendentes))
        msg = (
            "⛔ ROM — VERIFICAÇÃO DE CITAÇÕES BLOQUEOU A GRAVAÇÃO.\n"
            "As citações abaixo não constam de citacoes-verificadas.txt "
            "nem estão marcadas com ⚠️[NÃO VERIFICADO]:\n  - "
            + "\n  - ".join(unicas)
            + "\n\nAÇÃO: confirme cada uma em fonte oficial e adicione ao registro, "
            "ou marque-a no texto como ⚠️[NÃO VERIFICADO: ...]. "
            "Não remova a marcação silenciosamente (princípio da conferibilidade)."
        )
        # Saída estruturada para o Claude Code; exit 2 sinaliza bloqueio.
        print(json.dumps({"decision": "block", "reason": msg}, ensure_ascii=False))
        print(msg, file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
