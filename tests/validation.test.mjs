import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldRules, stepFields, validateField, errorsForStep, firstInvalidStep,
  allowedStep, cleanAnswers, parseSaved } from '../public/validation.js';

const valid = {
  appName: 'Agenda 5.º año', mission: 'entregas',
  problem: 'Los estudiantes no encuentran las fechas actualizadas de las actividades.',
  impact: 'Se olvidan algunas entregas y preguntaría a estudiantes para comprobarlo.',
  users: 'Los estudiantes consultan las fechas y los docentes publican las actividades.',
  f1: 'Consultar calendario', b1: 'Permite a estudiantes conocer las fechas de sus actividades.',
  f2: 'Publicar avisos', b2: 'Permite a los docentes informar cambios de una fecha.',
  f3: 'Recordar entregas', b3: 'Ayuda a estudiantes a recordar las entregas de sus trabajos.',
  priority: '1', reason: 'Primero hace falta conocer las fechas para poder organizar las actividades.',
  scenario: 'Pediría a estudiantes encontrar una fecha usando un prototipo de papel.',
  participants: '5', successes: '4',
  metric: 'Que lo logren sin ayuda y en menos de un minuto.',
  improve: 'Cambiaría las etiquetas confusas y repetiría la prueba con otras personas.'
};

test('una propuesta completa válida habilita el resumen', () => {
  for (let index = 0; index < 6; index++) assert.deepEqual(errorsForStep(index, valid), {});
  assert.equal(firstInvalidStep(valid), -1);
  assert.equal(allowedStep(6, valid), 6);
});

for (const key of Object.keys(fieldRules)) {
  test(`${key}: rechaza vacío, espacios y tipos incorrectos`, () => {
    for (const value of ['', ' \n\t ', null, 3, {}, []]) assert.ok(validateField(key, value, valid));
    const modified = { ...valid, [key]: '' };
    assert.notEqual(firstInvalidStep(modified), -1);
    assert.notEqual(allowedStep(6, modified), 6);
  });
}

test('no se pueden saltar etapas ni entrar al resumen con campos inválidos', () => {
  const empty = cleanAnswers({});
  for (let requested = 0; requested <= 6; requested++) assert.equal(allowedStep(requested, empty), 0);
  for (let index = 0; index < stepFields.length; index++) {
    const modified = { ...valid, [stepFields[index][0]]: '' };
    assert.equal(allowedStep(6, modified), index);
    assert.equal(allowedStep(0, modified), 0);
  }
  for (const requested of [-1, 7, 1.5, '6', NaN, Infinity]) assert.equal(allowedStep(requested, valid), 0);
});

test('solo acepta misiones y prioridades de la lista exacta', () => {
  for (const mission of ['otra', 'ENTREGAS', 'entregas ', '__proto__', '<script>']) assert.ok(validateField('mission', mission, valid));
  for (const priority of ['0', '4', '1 ', '1.0', '01', 'f1', '-1']) assert.ok(validateField('priority', priority, valid));
  assert.ok(validateField('priority', '1', { ...valid, f1: '' }));
});

test('rechaza solo números, símbolos, emojis, controles, HTML y relleno evidente en texto', () => {
  for (const value of ['123456789012345678901234', '!!!!!!!!!!!!!!!!!!!!!!!', '😀😀😀😀😀😀😀😀😀😀😀😀',
    'Texto de ejemplo con un carácter\u200Binvisible.', 'Texto de ejemplo con un carácter\u202Eoculto.',
    '<script>alert("texto de ejemplo")</script>', 'https://ejemplo.com/una-direccion',
    'Esto es aaaaaaaaaaaaaa de prueba.']) assert.ok(validateField('problem', value, valid), value);
});

test('acepta acentos, números dentro de frases, signos y caracteres Unicode legítimos', () => {
  assert.equal(validateField('appName', '5.º al día', valid), '');
  assert.equal(validateField('problem', 'Los alumnos de 5.º tienen 3 tareas y no encuentran sus fechas.', valid), '');
  assert.equal(validateField('metric', 'Que 4 de 5 logren terminar en < 1 minuto sin ayuda.', valid), '');
  assert.equal(validateField('appName', 'Agenda 📅', valid), '');
  assert.equal(validateField('appName', 'Mi A\u0301genda', valid), '');
});

test('controla mínimos, máximos, espacios de relleno y cantidad de palabras', () => {
  assert.ok(validateField('problem', 'Idea muy corta', valid));
  assert.ok(validateField('problem', 'Idea' + ' '.repeat(100) + 'breve', valid));
  assert.ok(validateField('problem', 'Unapalabralargaparaevitarlosminimos', valid));
  assert.ok(validateField('appName', 'Agenda\nEscolar', valid));
  for (const [key, rule] of Object.entries(fieldRules)) {
    if (rule.type !== 'text') continue;
    const text = 'Agenda escolar de estudiantes y docentes '.repeat(30).slice(0, rule.max + 1);
    assert.match(validateField(key, text, valid), /máximo/);
  }
  assert.equal(validateField('appName', 'App', valid), '');
});

test('detecta funciones repetidas ignorando mayúsculas, acentos, signos y espacios', () => {
  const errors = errorsForStep(3, { ...valid, f2: '  CONSULTÁR   CALENDARIO!!! ' });
  assert.ok(errors.f1);
  assert.ok(errors.f2);
  assert.equal(errors.f3, undefined);
  assert.equal(firstInvalidStep({ ...valid, f2: valid.f1 }), 3);
});

for (const value of ['0', '-1', '51', '100', '1.5', '1,5', '1e1', '+5', 'cinco', '5 personas', ' 5 ', '５', 'Infinity', 'NaN']) {
  test(`participantes: rechaza ${JSON.stringify(value)}`, () => assert.ok(validateField('participants', value, valid)));
}
test('acepta extremos enteros y controla que la meta no supere a los participantes', () => {
  assert.equal(validateField('participants', '1', valid), '');
  assert.equal(validateField('participants', '50', valid), '');
  assert.equal(validateField('successes', '1', { ...valid, participants: '1' }), '');
  assert.equal(validateField('successes', '50', { ...valid, participants: '50' }), '');
  assert.ok(validateField('successes', '6', valid));
  assert.ok(validateField('successes', '1', { ...valid, participants: '' }));
  assert.ok(validateField('successes', '4.5', valid));
});

test('rehidrata solo claves y tipos conocidos sin convertir objetos en texto válido', () => {
  const restored = cleanAnswers({ ...valid, appName: { injected: true }, unknown: 'x', priority: 1 });
  assert.equal(restored.appName, '');
  assert.equal(restored.priority, '');
  assert.equal('unknown' in restored, false);
  assert.equal(Object.keys(restored).length, Object.keys(fieldRules).length);
  const polluted = Object.create({ appName: 'No debería aceptarse' });
  assert.equal(cleanAnswers(polluted).appName, '');
});
test('un borrador demasiado largo permanece inválido en lugar de volverse válido al recortarlo', () => {
  const restored = cleanAnswers({ ...valid, problem: valid.problem.repeat(1000) });
  assert.equal(restored.problem.length, fieldRules.problem.max + 1);
  assert.ok(validateField('problem', restored.problem, restored));
});
test('un borrador manipulado no salta validaciones al recargar', () => {
  assert.equal(parseSaved(JSON.stringify({ ...valid, _step: 6 })).step, 6);
  assert.equal(parseSaved(JSON.stringify({ ...valid, reason: '', _step: 6 })).step, 4);
  assert.equal(parseSaved(JSON.stringify({ ...valid, _step: 999 })).step, 0);
  assert.equal(parseSaved(JSON.stringify({ _step: 6 })).step, 0);
  for (const raw of ['{no es json', 'null', '[]', 'true', 'x'.repeat(60000), null]) {
    assert.equal(parseSaved(raw).step, 0);
  }
  assert.equal({}.polluted, undefined);
});
