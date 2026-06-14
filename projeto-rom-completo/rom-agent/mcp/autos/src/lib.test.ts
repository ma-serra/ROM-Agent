import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validarCNJ, itensParaTrava, chamarTrava, type InventarioAutos } from "./lib.js";

test("validarCNJ aceita válido e rejeita inválido", () => {
  validarCNJ("5677110-87.2022.8.09.0051");
  assert.throws(() => validarCNJ("abc"), /padrão CNJ/);
});

test("itensParaTrava gera rótulos estáveis id::titulo", () => {
  const inv: InventarioAutos = {
    processo: "x", sistema: "TJGO", total: 2,
    documentos: [{ id: "1", titulo: "Inicial" }, { id: "2", titulo: "Contrato" }],
  };
  assert.deepEqual(itensParaTrava(inv), ["1::Inicial", "2::Contrato"]);
});

test("ponte com a trava: selar -> verificar (integro) -> verificar (retrocesso bloqueia)", () => {
  const dir = mkdtempSync(join(tmpdir(), "autos-test-"));
  const ledger = join(dir, "selos.jsonl");
  // localizar o script da trava (relativo ao repo)
  const script = process.env.TRAVA_SCRIPT;
  if (!script) {
    // sem script configurado, a ponte deve reportar erro controlado (não lançar)
    const r = chamarTrava("status", "X", null);
    assert.equal(r.ok, false);
    return;
  }
  process.env.LEDGER = ledger;
  const selar = chamarTrava("selar", "5677110-87.2022.8.09.0051", ["d1", "d2", "d3"]);
  assert.equal(selar.ok, true);
  const okv = chamarTrava("verificar", "5677110-87.2022.8.09.0051", ["d1", "d2", "d3"]);
  assert.equal(okv.ok, true);
  const bloq = chamarTrava("verificar", "5677110-87.2022.8.09.0051", ["d1"]);
  assert.equal(bloq.bloqueado, true);
  assert.equal(bloq.exit, 2);
});
