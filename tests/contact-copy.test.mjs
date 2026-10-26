import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { careerMarkup } from '../public/experience.js';
test('el pie, resumen y ficha orientan las consultas a alumnado/secretaría', async () => {
  const message = 'Para consultar por la carrera y la inscripción, acercate a alumnado/secretaría.';
  const index = await readFile('public/index.html', 'utf8');
  const activity = await readFile('public/actividad.html', 'utf8');
  assert.ok(index.includes(message)); assert.ok(careerMarkup.includes(message));
  assert.ok(activity.includes(message));
  assert.ok(!index.includes('Para consultar por la carrera y la inscripción, acercate a nuestro stand.'));
});
