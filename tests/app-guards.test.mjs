import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { cleanAnswers, fieldRules } from '../public/validation.js';
import { escapeHTML } from '../public/experience.js';

const source = await readFile('public/app.js', 'utf8');
const between = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
function fixture(ok = true) {
  const elements = new Map(), messages = [], writes = [];
  const get = id => {
    if (!elements.has(id)) elements.set(id, { hidden: false, textContent: '', close() {}, scrollIntoView() {} });
    return elements.get(id);
  };
  const context = { $: get, fieldRules, escape: escapeHTML, cleanAnswers,
    answers: cleanAnswers({ appName: 'Borrador anterior', mission: 'tareas' }), currentStep: 3, conflict: true,
    touched: new Set(['appName']), editing: new Set(['appName']), attempted: new Set([0]),
    store: { write: (raw, force) => { writes.push({ data: JSON.parse(raw), force }); return { ok, conflict: false }; } },
    showConflict() {}, notify: message => messages.push(message), render() {}, history: { pushState() {} }, scrollBehavior: () => 'instant'
  };
  vm.createContext(context);
  vm.runInContext(between('function persist(', 'function cards('), context);
  vm.runInContext(between("$('confirm-reset').onclick", "$('close-copy').onclick"), context);
  vm.runInContext(between("$('keep-mine').onclick", "addEventListener('storage'"), context);
  return { context, get, messages, writes };
}
test('el campo numérico conserva tres cifras para rechazarlas, en lugar de recortar 100 a 10', () => {
  const f = fixture();
  for (const key of ['participants', 'target']) {
    const markup = f.context.field(key, 'Número');
    assert.match(markup, /inputmode="numeric"/);
    const limit = Number(/maxlength="(\d+)"/.exec(markup)[1]);
    assert.ok(limit > 2); assert.ok(limit <= 100);
    assert.equal('100'.slice(0, limit), '100');
  }
});
test('reiniciar después de un conflicto reemplaza explícitamente el borrador y libera el guardado', () => {
  const f = fixture(); f.get('confirm-reset').onclick();
  assert.equal(f.context.conflict, false); assert.equal(f.get('tab-conflict').hidden, true);
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].force, true);
  assert.equal(f.writes[0].data.appName, ''); assert.equal(f.writes[0].data._step, 0);
  f.context.persist(); assert.equal(f.writes.length, 2);
});
test('un fallo al reiniciar avisa que el borrador anterior podría volver al recargar', () => {
  const f = fixture(false); f.get('confirm-reset').onclick();
  assert.equal(f.get('storage-warning').hidden, false);
  assert.match(f.messages[0], /no pudimos guardar el reinicio/);
  assert.doesNotMatch(f.messages[0], /nuevo recorrido está listo/);
});
test('conservar esta pestaña anuncia éxito solo si el guardado se completó', () => {
  const f = fixture(false); f.get('keep-mine').onclick();
  assert.equal(f.context.conflict, true); assert.equal(f.get('tab-conflict').hidden, false);
  assert.match(f.messages[0], /No pudimos guardar/);
  const g = fixture(); g.get('keep-mine').onclick();
  assert.equal(g.context.conflict, false); assert.equal(g.get('tab-conflict').hidden, true);
  assert.match(g.messages[0], /^Guardamos/);
});
