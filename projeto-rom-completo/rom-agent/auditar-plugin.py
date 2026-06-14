#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Auditoria estrutural do plugin ROM. Verifica integridade e cruzamentos.
Sai com código !=0 se houver falha. Gera relatório no stdout."""
import json
import os
import re
import glob
import subprocess
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
falhas = []
avisos = []
oks = []


def ok(m): oks.append(m)
def falha(m): falhas.append(m)
def aviso(m): avisos.append(m)


def frontmatter(path):
    t = open(path, encoding="utf-8").read()
    seg = t.split("---")
    return (seg[1] if len(seg) >= 3 else ""), t


# 1) JSON válidos
for j in ["/.claude-plugin/plugin.json", "/hooks/hooks.json", "/.mcp.json",
          "/skills/segundo-grau-nacional/registro-tribunais.json"]:
    p = RAIZ + j
    try:
        json.load(open(p, encoding="utf-8"))
        ok(f"JSON válido: {j}")
    except Exception as e:
        falha(f"JSON inválido {j}: {e}")

# plugin.json tem name
try:
    if not json.load(open(RAIZ + "/.claude-plugin/plugin.json")).get("name"):
        falha("plugin.json sem 'name'")
    else:
        ok("plugin.json possui 'name'")
except Exception:
    pass

# 2) Skills: frontmatter + nome == diretório
skills = {}
for sk in glob.glob(RAIZ + "/skills/*/SKILL.md"):
    nomedir = os.path.basename(os.path.dirname(sk))
    fm, _ = frontmatter(sk)
    m = re.search(r"name:\s*(\S+)", fm)
    if "name:" not in fm or "description:" not in fm:
        falha(f"skill {nomedir}: frontmatter incompleto")
        continue
    nome = m.group(1) if m else ""
    skills[nome] = nomedir
    if nome != nomedir:
        aviso(f"skill '{nome}' difere do diretório '{nomedir}'")
    else:
        ok(f"skill ok: {nomedir}")

# 3) Agentes e comandos
for ag in glob.glob(RAIZ + "/agents/*.md"):
    fm, _ = frontmatter(ag)
    if "name:" not in fm or "description:" not in fm:
        falha(f"agente {os.path.basename(ag)}: frontmatter incompleto")
    else:
        ok(f"agente ok: {os.path.basename(ag)}")
for cm in glob.glob(RAIZ + "/commands/*.md"):
    fm, _ = frontmatter(cm)
    if "description:" not in fm:
        falha(f"comando {os.path.basename(cm)}: sem description")
    else:
        ok(f"comando ok: {os.path.basename(cm)}")

# 4) Hook: script existe e compila
hk = json.load(open(RAIZ + "/hooks/hooks.json"))
cmd = hk["hooks"]["PostToolUse"][0]["hooks"][0]["command"]
mscript = re.search(r"/([\w./-]+\.py)", cmd)
if mscript:
    rel = mscript.group(1)
    cand = os.path.join(RAIZ, "hooks", "scripts", os.path.basename(rel))
    if os.path.exists(cand):
        ok("hook: script existe")
    else:
        falha("hook: script não encontrado")

# 5) Scripts Python compilam
for py in glob.glob(RAIZ + "/**/*.py", recursive=True):
    r = subprocess.run([sys.executable, "-m", "py_compile", py], capture_output=True)
    if r.returncode == 0:
        ok(f"py compila: {os.path.relpath(py, RAIZ)}")
    else:
        falha(f"py NÃO compila: {os.path.relpath(py, RAIZ)}: {r.stderr.decode()[:200]}")

# 6) Cross-ref: arquivos ${CLAUDE_SKILL_DIR}/x referidos existem
for sk in glob.glob(RAIZ + "/skills/*/SKILL.md"):
    d = os.path.dirname(sk)
    _, t = frontmatter(sk)
    for ref in re.findall(r"\$\{CLAUDE_SKILL_DIR\}/([\w.\-/]+)", t):
        if os.path.exists(os.path.join(d, ref)):
            ok(f"ref ok: {os.path.basename(d)}/{ref}")
        else:
            falha(f"ref quebrada em {os.path.basename(d)}: {ref}")

# 7) Cross-ref: skills citadas (`skill X` em crase) existem como diretório
nomes_dir = set(os.path.basename(os.path.dirname(s)) for s in glob.glob(RAIZ + "/skills/*/SKILL.md"))
for sk in glob.glob(RAIZ + "/skills/*/SKILL.md"):
    _, t = frontmatter(sk)
    for ref in re.findall(r"skill[s]?\s+`([a-z0-9\-]+)`", t):
        if ref in nomes_dir:
            pass
        else:
            aviso(f"{os.path.basename(os.path.dirname(sk))}: cita skill `{ref}` (não é diretório)")

# 8) Comandos que citam skills existentes
for cm in glob.glob(RAIZ + "/commands/*.md"):
    t = open(cm, encoding="utf-8").read()
    for ref in re.findall(r"`([a-z0-9\-]+)`", t):
        if ref in nomes_dir:
            ok(f"comando {os.path.basename(cm)} -> skill {ref}")

# 9) MCP builds presentes
for srv in ["tribunais2grau", "jurisprudencia", "autos"]:
    if os.path.exists(RAIZ + f"/mcp/{srv}/dist/index.js"):
        ok(f"MCP {srv}: dist/index.js presente")
    else:
        aviso(f"MCP {srv}: rodar npm install && npm run build")
# 10) Trava de integridade presente e compila
if os.path.exists(RAIZ + "/skills/analise-integral-documentos/trava-integridade.py"):
    ok("trava-integridade.py presente")
else:
    falha("trava-integridade.py ausente")


# 11) Artefatos de orquestração / bootstrap / multi-tenant
for arq, rotulo in [("/ORQUESTRACAO.md","runbook de orquestração"),
                     ("/bootstrap.sh","bootstrap"),
                     ("/config/tenancy.example.json","tenancy de exemplo"),
                     ("/agents/orquestrador.md","subagente orquestrador")]:
    if os.path.exists(RAIZ + arq):
        ok(f"presente: {rotulo}")
    else:
        falha(f"ausente: {rotulo}")

# Relatório
print("=" * 60)
print("AUDITORIA ESTRUTURAL — PLUGIN ROM")
print("=" * 60)
print(f"OK: {len(oks)} | AVISOS: {len(avisos)} | FALHAS: {len(falhas)}")
if avisos:
    print("\n-- AVISOS --")
    for a in avisos:
        print("  • " + a)
if falhas:
    print("\n-- FALHAS --")
    for f in falhas:
        print("  ✗ " + f)
    print("\nRESULTADO: REPROVADO")
    sys.exit(1)
print("\nRESULTADO: APROVADO (sem falhas)")
