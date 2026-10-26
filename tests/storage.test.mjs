import test from 'node:test';
import assert from 'node:assert/strict';
import { DraftStore } from '../public/storage.js';
test('el guardado detecta conflictos entre pestañas y permite elegir cuál conservar', () => {
  let value = null;
  const storage = { getItem: () => value, setItem: (_key, next) => { value = next; } };
  const a = new DraftStore('draft', () => storage), b = new DraftStore('draft', () => storage);
  a.read(); b.read(); assert.equal(a.write('primero').ok, true);
  assert.equal(b.write('segundo').conflict, true); assert.equal(value, 'primero');
  assert.equal(b.write('elegí este', true).ok, true); assert.equal(value, 'elegí este');
  assert.equal(a.write('anterior').conflict, true);
  a.read(); assert.equal(a.write('actualizado').ok, true);
});
test('el sitio puede continuar en memoria si el almacenamiento está bloqueado o lleno', () => {
  const disabled = new DraftStore('draft', () => { throw new Error('Bloqueado'); });
  assert.equal(disabled.read().ok, false); assert.equal(disabled.write('x').ok, false);
  const full = new DraftStore('draft', () => ({ getItem: () => null, setItem: () => { throw new Error('Lleno'); } }));
  assert.equal(full.read().ok, true); assert.equal(full.write('x').ok, false);
});
