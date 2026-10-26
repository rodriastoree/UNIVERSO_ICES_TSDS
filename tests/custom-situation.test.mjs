import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAnswers, validateField, errorsForStep, allowedStep, parseSaved } from '../public/validation.js';
import { changeChoice, proposalFor } from '../public/journey.js';
import { answerRows, proposalMarkup, buildIdeaDocument } from '../public/experience.js';

const situation = 'Quiero coordinar actividades para las personas de mi barrio.';
const valid = { ...cleanAnswers({}), mission: 'propia', appName: 'Mi barrio', customSituation: situation,
  mainFunction: 'calendar', audience: 'reader', mode: 'mode-0', test: 'test-0', improve: 'improve-0', note: 'Con letras grandes' };
const logo = 'data:image/png;base64,iVBORw0KGgo=';

test('la situación propia es obligatoria solo cuando se elige Tengo otra idea', () => {
  for (const value of ['', '   ', '\n\t']) {
    assert.ok(validateField('customSituation', value, valid));
    assert.equal(validateField('customSituation', value, { ...valid, mission: 'entregas' }), '');
  }
  for (const value of ['A', 'Mi idea', 'Organizar el barrio']) assert.equal(validateField('customSituation', value, valid), '');
  assert.deepEqual(errorsForStep(0, valid), {});
  assert.equal(allowedStep(6, { ...valid, customSituation: '' }), 0);
});

test('la descripción respeta los límites y los controles del resto de textos libres', () => {
  for (const value of [null, 1, {}, 'A'.repeat(801), '<script>alert(1)</script>', 'Mi\u200Bidea']) {
    assert.ok(validateField('customSituation', value, valid));
  }
  assert.equal(validateField('customSituation', 'A'.repeat(800), valid), '');
  assert.equal(validateField('customSituation', 'Quiero organizar\nlas actividades del barrio.', valid), '');
});

test('se conserva al recargar, cambiar de función y cambiar de misión', () => {
  assert.deepEqual(parseSaved(JSON.stringify({ ...valid, _step: 6 })), { answers: valid, step: 6 });
  const otherFunction = changeChoice(valid, 'mainFunction', 'reminders').answers;
  assert.equal(otherFunction.customSituation, situation);
  const standard = changeChoice(valid, 'mission', 'entregas').answers;
  assert.equal(standard.customSituation, situation);
  assert.equal(changeChoice(standard, 'mission', 'propia').answers.customSituation, situation);
});

test('el borrador anterior de una misión propia pide completar la situación sin perder elecciones', () => {
  const old = { ...valid, _step: 6 };
  delete old.customSituation;
  const restored = parseSaved(JSON.stringify(old));
  assert.equal(restored.step, 0);
  assert.equal(restored.answers.mainFunction, valid.mainFunction);
  assert.equal(restored.answers.note, valid.note);
  assert.equal(restored.answers.customSituation, '');
  assert.equal(proposalFor(restored.answers), null);
  assert.throws(() => buildIdeaDocument(restored.answers, 'Tengo otra idea', logo));
});

test('situación propia visible en la propuesta, resumen y ficha sin recursos externos', () => {
  assert.equal(proposalFor(valid).situation, situation);
  assert.equal(answerRows(valid).find(row => row.label === 'Tu situación').value, situation);
  assert.ok(proposalMarkup(valid).includes(situation));
  const html = buildIdeaDocument(valid, 'Tengo otra idea', logo);
  assert.ok(html.includes(situation));
  assert.doesNotMatch(html, /<script|(?:src|href)=["']https?:/i);
});

test('el texto conservado no se mezcla con resultados de otras misiones', () => {
  const standard = { ...valid, mission: 'entregas' };
  assert.equal(proposalFor(standard).situation, '');
  assert.ok(!answerRows(standard).some(row => row.label === 'Tu situación'));
  assert.ok(!buildIdeaDocument(standard, '¿Era para hoy?', logo).includes(situation));
});

test('la situación se escapa incluso si un render interno recibe datos sin validar', () => {
  const unsafe = { ...valid, customSituation: '<img src=x onerror=alert(1)>' };
  assert.ok(proposalMarkup(unsafe).includes('&lt;img'));
  assert.doesNotMatch(proposalMarkup(unsafe), /<img src=x/);
  assert.throws(() => buildIdeaDocument(unsafe, 'Tengo otra idea', logo));
});
