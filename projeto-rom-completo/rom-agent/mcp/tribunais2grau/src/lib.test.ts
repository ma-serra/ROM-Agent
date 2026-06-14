import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCNJ,
  siglaPorJTR,
  buildDatajudQueryPorNumero,
  buildDatajudQueryPorFiltros,
  montarAnexos,
  entradaRegistro,
} from "./lib.js";

test("decodeCNJ identifica TJGO (8.09) e deriva alias DataJud", () => {
  const d = decodeCNJ("5677110-87.2022.8.09.0051");
  assert.equal(d.segmento, "Justiça Estadual");
  assert.equal(d.sigla, "TJGO");
  assert.equal(d.datajudAlias, "api_publica_tjgo");
  assert.equal(d.datajudUrl, "https://api-publica.datajud.cnj.jus.br/api_publica_tjgo/_search");
  assert.equal(d.ano, "2022");
});

test("decodeCNJ identifica TJES (8.08), TJSP (8.26), TRF1 (4.01), TRT3 (5.03)", () => {
  assert.equal(decodeCNJ("0000001-00.2024.8.08.0001").sigla, "TJES");
  assert.equal(decodeCNJ("0000001-00.2024.8.26.0001").sigla, "TJSP");
  assert.equal(decodeCNJ("0000001-00.2024.4.01.3500").sigla, "TRF1");
  assert.equal(decodeCNJ("0000001-00.2024.5.03.0001").sigla, "TRT3");
});

test("siglaPorJTR cobre superiores e eleitoral/militar com marcação", () => {
  assert.equal(siglaPorJTR("3", "00"), "STJ");
  assert.equal(siglaPorJTR("1", "00"), "STF");
  assert.ok(siglaPorJTR("6", "06").includes("TRE"));
});

test("decodeCNJ rejeita número malformado", () => {
  assert.throws(() => decodeCNJ("123.456"), /padrão CNJ/);
});

test("buildDatajudQueryPorNumero remove máscara", () => {
  const q = buildDatajudQueryPorNumero("5677110-87.2022.8.09.0051") as { query: { match: { numeroProcesso: string } } };
  assert.equal(q.query.match.numeroProcesso, "56771108720228090051");
});

test("buildDatajudQueryPorFiltros monta bool/must e match_all", () => {
  const comFiltro = buildDatajudQueryPorFiltros({ classeCodigo: "7", dataInicial: "2025-01-01" }) as { query: { bool: { must: unknown[] } } };
  assert.equal(comFiltro.query.bool.must.length, 2);
  const semFiltro = buildDatajudQueryPorFiltros({}) as { query: Record<string, unknown> };
  assert.ok("match_all" in semFiltro.query);
});

test("montarAnexos numera Doc. NN, gera nomes e aponta pendências", () => {
  const r = montarAnexos([
    {
      finalidade: "paradigma", tribunal: "STJ", classe_numero: "REsp 1234567",
      relator: "Min. A", orgao: "3a Turma", data_julgamento: "2024-08-15",
      url_inteiro_teor: "https://scon.stj.jus.br/it1",
      url_certidao: "NAO_DISPONIVEL",
    },
  ], 3, "2026-06-14");
  assert.match(r.rol, /Doc\. 03 — STJ REsp 1234567/);
  assert.match(r.downloads, /Doc-03a_STJ_REsp-1234567_inteiro-teor\.pdf/);
  assert.ok(r.pendencias.some((p) => p.includes("certidão de julgamento")));
});

test("entradaRegistro usa fallback DJEN quando sigla ausente", () => {
  const e = entradaRegistro({}, "TJAM", "https://x/api_publica_tjam/_search");
  assert.equal(e.fonte, "fallback");
  assert.equal(e.djen_url, "https://comunica.pje.jus.br/");
  assert.ok(String(e.jurisprudencia_url).includes("NÃO VERIFICADO"));
});
