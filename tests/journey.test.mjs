import test from 'node:test';
import assert from 'node:assert/strict';
import { missions, branches, getOptions, changeChoice, proposalFor, choiceFields } from '../public/previous/journey.js';
import { cleanAnswers, validateField, errorsForStep, firstInvalidStep, allowedStep, parseSaved } from '../public/previous/validation.js';
import { answerRows, prototypeMarkup, buildIdeaDocument } from '../public/previous/experience.js';
const logo = 'data:image/png;base64,iVBORw0KGgo=';
const valid = { ...cleanAnswers({}), appName: 'Mi app', customSituation: 'Quiero organizar las actividades de mi barrio.', mission: 'entregas', mainFunction: 'calendar', audience: 'reader', mode: 'mode-0', test: 'test-0', improve: 'improve-0', note: '' };
test('Todas las combinaciones de los 13 recorridos son válidas y producen propuestas distintas', () => {
  let count = 0;
  for (const mission of missions) for (const mainFunction of mission.functions) {
    const signatures = new Set();
    const branch = branches[mainFunction];
    for (const audience of branch.audience) for (const mode of branch.mode) for (const task of branch.test) for (const improve of branch.improve) {
      const answers = { ...valid, mission: mission.id, mainFunction, audience: audience.id, mode: mode.id, test: task.id, improve: improve.id };
      assert.equal(firstInvalidStep(answers), -1);
      const proposal = proposalFor(answers);
      assert.ok(proposal.concept.includes(audience.title.toLocaleLowerCase('es')));
      assert.ok(proposal.firstVersion.includes(mode.detail));
      assert.ok(proposal.test.includes(task.detail));
      assert.ok(proposal.improve.includes(improve.detail));
      signatures.add(JSON.stringify(proposal)); count++;
    }
    assert.equal(signatures.size, 81);
  }
  assert.equal(count, 1053);
});
test('La función cambia realmente opciones de las cuatro decisiones siguientes', () => {
  for (const key of ['audience', 'mode', 'test', 'improve']) {
    const first = getOptions(key, valid).map(o => o.title);
    const second = getOptions(key, { ...valid, mainFunction: 'reminders' }).map(o => o.title);
    assert.notDeepEqual(first, second);
  }
});
test('Cambiar la función elimina elecciones incompatibles aunque los ids locales coincidan', () => {
  const before = { ...valid, note: 'Quiero letras grandes' };
  const { answers, cleared } = changeChoice(before, 'mainFunction', 'reminders');
  for (const key of ['audience', 'mode', 'test', 'improve']) assert.equal(answers[key], '');
  assert.equal(answers.appName, before.appName); assert.equal(answers.note, before.note);
  assert.equal(before.mode, 'mode-0'); assert.equal(cleared.length, 4); assert.equal(allowedStep(6, answers), 2);
});
test('Cambiar la misión conserva una función compartida y descarta una ajena', () => {
  assert.deepEqual(changeChoice(valid, 'mission', 'actividades').answers, { ...valid, mission: 'actividades' });
  const changed = changeChoice(valid, 'mission', 'avisos').answers;
  for (const key of choiceFields) assert.equal(changed[key], '');
  assert.equal(allowedStep(6, changed), 1);
});
test('No acepta opciones ajenas, inventadas ni rutas sin función previa', () => {
  assert.ok(validateField('mainFunction', 'registration', valid));
  for (const key of choiceFields) assert.ok(validateField(key, 'inventada', valid));
  assert.equal(proposalFor({ ...valid, mainFunction: 'official' }), null);
  assert.equal(getOptions('mode', { mission: 'avisos' }).length, 0);
});
test('Texto breve sin mínimo y comentario opcional', () => {
  for (const value of ['A', 'Mi app', 'Ñ', 'Mi app 💡']) assert.equal(validateField('appName', value, valid), '');
  assert.equal(validateField('note', '', valid), ''); assert.equal(validateField('note', 'Sí', valid), '');
  for (const value of ['', '   ', '🔔', '<b>App</b>', 'App\u200B', 'A'.repeat(61), 'App\nOtra']) assert.ok(validateField('appName', value, valid));
  assert.ok(validateField('note', 'A'.repeat(801), valid));
});
test('Recupera todos los datos y la etapa; rechaza guardados rotos o incompletos', () => {
  assert.deepEqual(parseSaved(JSON.stringify({ ...valid, _step: 6 })), { answers: valid, step: 6 });
  for (const raw of ['{', 'null', '[]', 'x'.repeat(50001)]) assert.equal(parseSaved(raw).step, 0);
  assert.equal(parseSaved(JSON.stringify({ ...valid, mode: 'ajena', _step: 6 })).step, 3);
  assert.equal(parseSaved(JSON.stringify({ ...valid, mission: 'avisos', _step: 6 })).step, 1);
  assert.equal(parseSaved(JSON.stringify({ ...valid, appName: 'A'.repeat(500), _step: 6 })).step, 0);
});
test('No se puede saltar una decisión ni obtener propuesta incompleta', () => {
  for (const [key, step] of [['mission', 0], ['mainFunction', 1], ['audience', 2], ['mode', 3], ['test', 4], ['improve', 5]]) {
    const incomplete = { ...valid, [key]: '' };
    assert.ok(Object.keys(errorsForStep(step, incomplete)).length);
    assert.equal(allowedStep(6, incomplete), step);
    assert.equal(proposalFor(incomplete), null);
    assert.throws(() => buildIdeaDocument(incomplete, 'Misión', logo));
  }
});
test('La ficha conserva todas las respuestas y la propuesta, con logo y sin recursos remotos', () => {
  const answers = { ...valid, appName: 'Agenda & compañía', note: 'Quiero texto grande & buen contraste' };
  const html = buildIdeaDocument(answers, '¿Era para hoy?', logo);
  for (const row of answerRows(answers)) assert.ok(html.includes(row.label.replaceAll('&', '&amp;')));
  assert.ok(html.includes('Quiero texto grande &amp; buen contraste'));
  assert.ok(html.includes('data:image/png;base64,')); assert.ok(html.includes('Todas tus respuestas'));
  assert.ok(html.includes('Propuesta según tus decisiones')); assert.ok(html.includes('Tecnicatura Superior en Desarrollo de Software'));
  assert.doesNotMatch(html, /<script|(?:src|href)=["']https?:/i);
  assert.throws(() => buildIdeaDocument(answers, 'Misión', 'https://externo/logo.png'));
});
test('El boceto y el resumen escapan texto incluso si una llamada interna omite validar', () => {
  const unsafe = { ...valid, appName: '<img src=x onerror=alert(1)>', note: '<script>alert(1)</script>' };
  assert.ok(prototypeMarkup(unsafe).includes('&lt;img'));
  assert.doesNotMatch(prototypeMarkup(unsafe), /<img src=x/);
  assert.throws(() => buildIdeaDocument(unsafe, 'Misión', logo));
});
