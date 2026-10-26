import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldRules, stepFields, validateField, errorsForStep, firstInvalidStep, allowedStep, cleanAnswers, parseSaved, migrateV3 } from '../public/validation.js';
import { missions, getOptions, changeChoice, proposalFor, functionTitle, taskFor, SUMMARY_STEP } from '../public/journey.js';
import { answerRows, prototypeMarkup, proposalMarkup, buildIdeaDocument, ideaText } from '../public/experience.js';
const logo = 'data:image/png;base64,iVBORw0KGgo=';
const valid = { ...cleanAnswers({}), mission: 'entregas', appName: 'Mi app 👩‍💻', audience: 'reader', functions: ['calendar', 'reminders', 'submissions'], mainFunction: 'calendar', reason: 'problem', mode: 'mode-0', test: 'test-0', participants: '5', target: '4', improve: 'improve-0' };
const own = { ...valid, mission: 'propia', customSituation: 'Informar residuos en el barrio', customAudience: 'Vecinos del barrio', functions: ['custom-1', 'custom-2', 'custom-3'], mainFunction: 'custom-1', customFunction1: 'Informar residuos', customFunction2: 'Ver puntos de recolección', customFunction3: 'Coordinar voluntarios' };
test('la propuesta completa representa problema, personas, tres funciones, prioridad, motivo y plan de prueba', () => {
  assert.equal(firstInvalidStep(valid), -1); assert.equal(firstInvalidStep(own), -1);
  const rows = answerRows(own), text = ideaText(own);
  for (const value of ['Vecinos del barrio', ...own.functions.map(id => functionTitle(id, own)), 'al menos 4 de 5']) assert.ok(text.includes(value));
  assert.equal(rows.find(row => row.step === 2).value.split('\n').length, 3);
  assert.ok(proposalFor(own).firstVersion.includes('Informar residuos'));
  assert.ok(proposalFor(own).observe.includes('al menos 4 de 5'));
});
test('todas las funciones y roles ofrecen diseños y tareas válidas', () => {
  let paths = 0;
  for (const mission of missions) {
    const base = { ...own, mission: mission.id };
    const ids = getOptions('functions', base).map(o => o.id);
    for (const mainFunction of ids) {
      const functions = [mainFunction, ...ids.filter(id => id !== mainFunction).slice(0, 2)];
      for (const audience of ['reader', 'creator', 'coordinator']) for (const mode of ['mode-0', 'mode-1', 'mode-2']) for (const task of ['test-0', 'test-1', 'test-2']) {
        const a = { ...base, functions, mainFunction, audience, mode, test: task };
        assert.equal(firstInvalidStep(a), -1, JSON.stringify(a));
        const p = proposalFor(a); assert.ok(p.test.includes(taskFor(a))); assert.equal(p.screens.length, 3); paths++;
      }
    }
  }
  assert.ok(paths > 600);
});
test('se exigen exactamente tres funciones conocidas, distintas y una prioridad entre ellas', () => {
  for (const value of [null, {}, '', [], ['calendar'], ['calendar', 'reminders'], ['calendar', 'calendar', 'reminders'], ['calendar', 'reminders', 'inventada'], ['calendar', 'reminders', 'submissions', 'official']]) assert.ok(validateField('functions', value, valid));
  assert.ok(validateField('mainFunction', 'official', valid));
  assert.equal(validateField('mainFunction', 'reminders', valid), '');
  for (const key of ['reason', 'mode', 'audience', 'test', 'improve', 'mission']) assert.ok(validateField(key, 'inventada', valid));
});
test('la idea propia exige situación, personas y nombre para cada función propia elegida', () => {
  for (const key of ['customSituation', 'customAudience', 'customFunction1', 'customFunction2', 'customFunction3']) assert.ok(validateField(key, '', own));
  assert.equal(validateField('customSituation', '', valid), '');
  assert.equal(validateField('customAudience', '', valid), '');
  assert.equal(validateField('customFunction1', '', valid), '');
  assert.ok(validateField('functions', own.functions, { ...own, customFunction2: 'INFORMAR RESIDUOS!!!' }));
  assert.ok(validateField('functions', own.functions, { ...own, customFunction2: 'Ínformar residuos' }));
});
test('solo se aceptan enteros estrictos de 1 a 20 y la meta no puede superar participantes', () => {
  for (const key of ['participants', 'target']) for (const value of ['', '0', '-1', '21', '1.5', '1,5', '1e1', ' 5 ', '+5', '05', 'cinco', '５', null, 5, 'Infinity', 'NaN']) assert.ok(validateField(key, value, valid), `${key}:${value}`);
  for (const value of ['1', '20']) assert.equal(validateField('participants', value, valid), '');
  assert.equal(validateField('target', '5', valid), ''); assert.ok(validateField('target', '6', valid));
  assert.equal(validateField('target', '20', { ...valid, participants: '20' }), '');
  assert.ok(validateField('target', '1', { ...valid, participants: 'abc' }));
});
test('los textos breves y emojis legítimos funcionan sin habilitar controles invisibles ni HTML', () => {
  for (const text of ['A', 'Á', 'Mi app 👩‍💻', 'Familias 👨‍👩‍👧‍👦', 'App 👩🏽‍💻']) assert.equal(validateField('appName', text, valid), '');
  for (const text of ['', '   ', '123', '🔔', 'App\u200B', 'App\u202E', 'App\u2066', 'A\u0000', '<img src=x>', '\u200DApp', 'App\u200D', 'A'.repeat(61), 'App\nOtra', 'App\u2028Otra']) assert.ok(validateField('appName', text, valid), JSON.stringify(text));
  assert.equal(validateField('note', '', valid), ''); assert.equal(validateField('customSituation', 'Una\nidea', own), '');
});
test('cada campo activo exige el tipo, longitud y valor apropiado', () => {
  for (const [key, rule] of Object.entries(fieldRules)) {
    if (rule.type === 'text') {
      assert.ok(validateField(key, 'A'.repeat(rule.max + 1), own));
      assert.equal(validateField(key, 'A'.repeat(rule.max), own), '');
      assert.ok(validateField(key, {}, own));
    }
  }
});
test('no se saltean decisiones ni se exporta una propuesta incompleta', () => {
  for (const [i, fields] of stepFields.entries()) {
    const key = fields.find(key => !key.startsWith('custom'));
    const a = { ...valid, [key]: key === 'functions' ? [] : '' };
    assert.ok(Object.keys(errorsForStep(i, a)).length); assert.equal(allowedStep(SUMMARY_STEP, a), i);
    assert.throws(() => buildIdeaDocument(a, 'Misión', logo)); assert.throws(() => ideaText(a));
  }
  for (const n of [-1, 99, 1.5, '2']) assert.equal(allowedStep(n, valid), 0);
});
test('cambiar prioridad, rol, misión o diseño obliga a revisar sus dependencias', () => {
  for (const [key, value] of [['mainFunction', 'reminders'], ['audience', 'creator'], ['mode', 'mode-1']]) {
    const changed = changeChoice(valid, key, value).answers;
    assert.equal(changed.test, ''); assert.equal(changed.appName, valid.appName);
  }
  const changed = changeChoice(valid, 'mission', 'propia').answers;
  for (const key of ['audience', 'mainFunction', 'reason', 'mode', 'test', 'improve']) assert.equal(changed[key], '');
  const removed = changeChoice(valid, 'functions', ['reminders', 'submissions', 'official']).answers;
  assert.equal(removed.mainFunction, ''); assert.equal(removed.mode, '');
});
test('las pruebas para lectores no piden publicar y las de autores sí pueden hacerlo', () => {
  const a = { ...valid, functions: ['official', 'calendar', 'reminders'], mainFunction: 'official' };
  assert.match(taskFor(a), /encontrar/); assert.doesNotMatch(taskFor(a), /publicar|preparar/);
  assert.match(taskFor({ ...a, audience: 'creator' }), /preparar un aviso/);
  for (const mode of getOptions('mode', { ...a, mission: 'propia' })) assert.doesNotMatch(mode.title + mode.detail, /materia|curso/);
});
test('recargar conserva todos los campos, y borradores alterados vuelven a una etapa válida', () => {
  assert.deepEqual(parseSaved(JSON.stringify({ ...own, _step: SUMMARY_STEP })), { answers: own, step: SUMMARY_STEP });
  for (const raw of ['null', '[]', '{', 'A'.repeat(50001)]) assert.equal(parseSaved(raw).step, 0);
  const changed = { ...valid, functions: [...valid.functions, 'inventada'], _step: SUMMARY_STEP };
  assert.equal(parseSaved(JSON.stringify(changed)).step, 2);
  assert.equal(parseSaved(JSON.stringify({ ...valid, target: '6', _step: 7 })).step, 5);
  assert.equal(parseSaved(JSON.stringify({ ...valid, appName: 'A'.repeat(1000), _step: 7 })).step, 0);
  assert.equal(cleanAnswers({ appName: { toString: 'Hola' }, injected: 'x' }).appName, '');
  assert.equal(Object.hasOwn(cleanAnswers({ injected: 'x' }), 'injected'), false);
});
test('migrar v3 conserva textos y no inventa las dos funciones o personas que faltan', () => {
  const old = { mission: 'propia', appName: 'Mi barrio', customSituation: 'Organizar vecinos', mainFunction: 'calendar', note: 'Texto anterior', _step: 6 };
  const raw = JSON.stringify(old), restored = migrateV3(raw);
  assert.equal(restored.answers.appName, old.appName); assert.equal(restored.answers.note, old.note);
  assert.deepEqual(restored.answers.functions, ['calendar']); assert.equal(restored.answers.customAudience, ''); assert.equal(restored.step, 1);
  assert.equal(raw, JSON.stringify(old)); for (const raw of ['', 'null', '{', 'x'.repeat(50001)]) assert.equal(migrateV3(raw), null);
});
test('ficha y resumen incluyen las decisiones, escapan texto y no cargan recursos externos', () => {
  const html = buildIdeaDocument(own, 'Tengo otra idea', logo), p = prototypeMarkup(own);
  for (const row of answerRows(own)) assert.ok(html.includes(row.label));
  assert.ok(html.includes('Vecinos del barrio')); assert.ok(html.includes('data:image/png;base64,'));
  assert.doesNotMatch(html, /<script|(?:src|href)=["']https?:/i);
  assert.equal((p.match(/prototype-primary/g) || []).length, 1); assert.match(p, /Para más adelante/);
  const unsafe = { ...own, appName: '<img src=x onerror=alert(1)>', customSituation: '<script>alert(1)</script>' };
  assert.doesNotMatch(prototypeMarkup(unsafe) + proposalMarkup(unsafe), /<img src=x|<script>/i);
  assert.throws(() => buildIdeaDocument(unsafe, 'Misión', logo));
  for (const url of ['https://externo/logo.png', 'data:image/svg+xml,abc', 'data:image/png;base64,abc" onerror="x']) assert.throws(() => buildIdeaDocument(own, 'Misión', url));
});
