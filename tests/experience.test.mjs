import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAnswers, missionIds } from '../public/legacy/validation.js';
import { affectedReviewSteps, restoreExperience, randomMission, ideaFilename,
  prototypeMarkup, buildIdeaDocument as buildDocument } from '../public/legacy/experience.js';

const logoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const buildIdeaDocument = (answers, mission) => buildDocument(answers, mission, logoDataUrl);

const answers = {
  ...cleanAnswers({}), appName: 'Agenda 5.º año', mission: 'entregas',
  problem: 'Los estudiantes no encuentran las fechas actualizadas de las actividades.',
  impact: 'Se olvidan algunas entregas y preguntaría a estudiantes para comprobarlo.',
  users: 'Los estudiantes consultan las fechas y los docentes publican las actividades.',
  f1: 'Consultar calendario', b1: 'Permite a estudiantes conocer las fechas de sus actividades.',
  f2: 'Publicar avisos', b2: 'Permite a los docentes informar cambios de una fecha.',
  f3: 'Recordar entregas', b3: 'Ayuda a estudiantes a recordar las entregas de sus trabajos.',
  priority: '1', reason: 'Primero hace falta conocer las fechas para poder organizar las actividades.',
  scenario: 'Pediría a estudiantes encontrar una fecha usando un prototipo de papel.',
  participants: '5', successes: '4', metric: 'Que lo logren sin ayuda y en menos de un minuto.',
  improve: 'Cambiaría las etiquetas confusas y repetiría la prueba con otras personas.'
};

test('cambiar una misión marca respuestas posteriores sin borrarlas', () => {
  const next = { ...answers, mission: 'avisos' };
  assert.deepEqual(affectedReviewSteps('mission', answers, next), [1, 2, 3, 4, 5]);
  assert.equal(next.problem, answers.problem);
  assert.equal(next.reason, answers.reason);
});

test('la primera elección y las etapas vacías no generan pendientes', () => {
  const empty = cleanAnswers({});
  assert.deepEqual(affectedReviewSteps('mission', empty, { ...empty, mission: 'avisos' }), []);
  assert.deepEqual(affectedReviewSteps('mission', { ...empty, mission: 'entregas' }, { ...empty, mission: 'avisos' }), []);
});

test('funciones y prioridad señalan el motivo y la prueba existentes', () => {
  assert.deepEqual(affectedReviewSteps('f1', answers, { ...answers, f1: 'Organizar eventos' }), [4, 5]);
  assert.deepEqual(affectedReviewSteps('priority', answers, { ...answers, priority: '2' }), [4, 5]);
  assert.deepEqual(affectedReviewSteps('reason', answers, { ...answers, reason: 'Otro motivo' }), [5]);
});

test('cambiar problema o usuarios conserva la revisión de sus dependencias', () => {
  assert.deepEqual(affectedReviewSteps('problem', answers, { ...answers, problem: 'Un problema diferente' }), [2, 3, 4, 5]);
  assert.deepEqual(affectedReviewSteps('users', answers, { ...answers, users: 'Otros usuarios' }), [3, 4, 5]);
});

test('el nombre y los cambios de espacios no marcan respuestas relacionadas', () => {
  assert.deepEqual(affectedReviewSteps('appName', answers, { ...answers, appName: 'Mi otra app' }), []);
  assert.deepEqual(affectedReviewSteps('problem', answers, { ...answers, problem: '  ' + answers.problem + '  ' }), []);
});

test('los borradores anteriores se conservan sin metadatos nuevos', () => {
  const restored = restoreExperience(JSON.stringify({ ...answers, _step: 6 }));
  assert.equal(restored.step, 6);
  assert.deepEqual(restored.reviewSteps, []);
  assert.equal(restored.answers.appName, answers.appName);
});

test('recargar conserva pendientes y edición, descartando valores alterados', () => {
  const restored = restoreExperience(JSON.stringify({ ...answers, _step: 3, _review: [4, 5, 5, 0, 6, '2', null], _editingFromSummary: true }));
  assert.deepEqual(restored.reviewSteps, [4, 5]);
  assert.equal(restored.editingFromSummary, true);
  assert.equal(restoreExperience(JSON.stringify({ ...answers, _step: 6, _editingFromSummary: true })).editingFromSummary, false);
  assert.equal(restoreExperience(JSON.stringify({ ...answers, _step: 3, _editingFromSummary: 'true' })).editingFromSummary, false);
});

test('los metadatos no permiten saltear validaciones o revisar etapas vacías', () => {
  const restored = restoreExperience(JSON.stringify({ ...answers, f1: '', _step: 6, _review: [3, 4] }));
  assert.equal(restored.step, 3);
  assert.deepEqual(restoreExperience(JSON.stringify({ _step: 6, _review: [1, 2, 3] })).reviewSteps, []);
  for (const raw of ['{', 'null', '[]', null]) assert.equal(restoreExperience(raw).step, 0);
});

test('el azar siempre cambia la misión, incluidos ambos extremos del sorteo', () => {
  for (const current of missionIds) {
    for (const number of [0, .25, .5, .75, .999999]) {
      const next = randomMission(current, () => number);
      assert.ok(missionIds.includes(next));
      assert.notEqual(next, current);
    }
  }
  assert.equal(randomMission('', () => 0), missionIds[0]);
  assert.equal(randomMission('', () => .99999), missionIds.at(-1));
});

test('la ficha contiene todas las respuestas y no depende de recursos externos', () => {
  const html = buildIdeaDocument(answers, '¿Era para hoy?');
  for (const key of Object.keys(answers).filter(key => !['mission', 'priority'].includes(key))) assert.ok(html.includes(answers[key]), key);
  assert.ok(html.includes('¿Era para hoy?'));
  assert.ok(html.includes('4 de 5 personas'));
  assert.ok(html.includes('Tecnicatura Superior en Desarrollo de Software'));
  assert.doesNotMatch(html, /<script\b|<link\b|https?:\/\//i);
  assert.ok(html.includes(`src="${logoDataUrl}"`));
  assert.ok(html.includes("img-src data:"));
  assert.ok(html.includes('Desde tu dispositivo'));
  assert.equal((html.match(/<img\b/g) || []).length, 1);
});

test('la ficha y el boceto escapan texto para impedir HTML activo', () => {
  const unsafe = { ...answers, appName: '</title><script>alert(1)</script>', f1: '<img src=x onerror=alert(1)>', reason: 'A & B "prueba"' };
  const html = buildIdeaDocument(unsafe, '<svg onload=alert(1)>');
  assert.doesNotMatch(html, /<script\b|<svg\b/i);
  assert.equal((html.match(/<img\b/g) || []).length, 1);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('A &amp; B &quot;prueba&quot;'));
  assert.doesNotMatch(prototypeMarkup(unsafe), /<img\b|<script\b/i);
});

test('la ficha solo admite un logo PNG incluido y rechaza recursos remotos o atributos inyectados', () => {
  for (const source of [undefined, '', 'https://example.com/logo.png', './logo.png', 'data:image/svg+xml,<svg/>', logoDataUrl + '" onerror="alert(1)']) {
    assert.throws(() => buildDocument(answers, 'Una misión', source), /logo/);
  }
});

test('el boceto distingue exactamente una prioridad y no dibuja botones funcionales', () => {
  const html = prototypeMarkup({ ...answers, priority: '2' });
  assert.equal((html.match(/class="prototype-function prototype-primary"/g) || []).length, 1);
  assert.match(html, /Tu primer paso/);
  assert.match(html, /sin interacción/);
  assert.doesNotMatch(html, /<button\b|<a\b/);
});

test('el nombre descargable elimina rutas y caracteres inseguros', () => {
  assert.equal(ideaFilename('Mi Ágenda escolar'), 'mi-idea-mi-agenda-escolar.html');
  assert.equal(ideaFilename('../../<script>'), 'mi-idea-script.html');
  assert.equal(ideaFilename('😀'), 'mi-idea-universo-ices.html');
  assert.ok(ideaFilename('A'.repeat(500)).length <= 73);
});
