import { test } from "node:test";
import assert from "node:assert/strict";
import {
  partesCNJ,
  consultaPorSegmento,
  buscaInteiroTeorPorSegmento,
  djenConsulta,
  resolverLinks,
  siglaPorJTR,
} from "./lib.js";

test("partesCNJ extrai J/TR e remove máscara", () => {
  const p = partesCNJ("5677110-87.2022.8.09.0051");
  assert.equal(p.j, "8");
  assert.equal(p.tr, "09");
  assert.equal(p.semMascara, "56771108720228090051");
});

test("partesCNJ rejeita malformado", () => {
  assert.throws(() => partesCNJ("xyz"), /padrão CNJ/);
});

test("consultaPorSegmento roteia STJ, STF e DJEN", () => {
  assert.match(consultaPorSegmento("3", "1.2022.3.00.0000".padStart(25, "0")), /processo\.stj\.jus\.br/);
  assert.match(consultaPorSegmento("1", "1.2022.1.00.0000".padStart(25, "0")), /portal\.stf\.jus\.br/);
  assert.match(consultaPorSegmento("8", "5677110-87.2022.8.09.0051"), /comunica\.pje\.jus\.br/);
});

test("buscaInteiroTeorPorSegmento dá o portal certo", () => {
  assert.match(buscaInteiroTeorPorSegmento("3"), /scon\.stj/);
  assert.match(buscaInteiroTeorPorSegmento("1"), /pesquisarInteiroTeor/);
  assert.match(buscaInteiroTeorPorSegmento("8"), /comunica\.pje/);
});

test("djenConsulta usa número sem máscara", () => {
  assert.match(djenConsulta("5677110-87.2022.8.09.0051"), /numeroProcesso=56771108720228090051/);
});

test("resolverLinks: componentes ausentes ficam marcados; informados são preservados", () => {
  const r = resolverLinks(
    { numero: "5677110-87.2022.8.09.0051", url_inteiro_teor: "https://x/it.pdf" },
    siglaPorJTR
  );
  assert.equal(r.sigla, "TJGO");
  assert.equal(r.url_inteiro_teor, "https://x/it.pdf");
  assert.match(r.url_certidao, /NÃO VERIFICADO/);
  assert.match(r.consulta_url, /comunica\.pje\.jus\.br/);
  assert.ok(typeof r.djen_consulta_url === "string");
});

test("resolverLinks em STJ aponta consulta do STJ", () => {
  const r = resolverLinks({ numero: "0001234-56.2022.3.00.0000" }, siglaPorJTR);
  assert.equal(r.sigla, "STJ");
  assert.match(r.consulta_url, /processo\.stj\.jus\.br/);
});
