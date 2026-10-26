import test from 'node:test';
import assert from 'node:assert/strict';
import { byteRange } from '../range.mjs';
test('el video admite rangos completos, abiertos, sufijos y extremos', () => {
  for (const [header, expected] of [['bytes=0-9', { start: 0, end: 9 }], ['bytes=90-', { start: 90, end: 99 }], ['bytes=-10', { start: 90, end: 99 }], ['bytes=50-200', { start: 50, end: 99 }], ['bytes=-200', { start: 0, end: 99 }], ['bytes=0-0', { start: 0, end: 0 }]]) assert.deepEqual(byteRange(header, 100), expected);
});
test('los rangos inválidos no producen lecturas fuera del archivo', () => {
  for (const header of ['', 'bytes=-', 'bytes=100-', 'bytes=20-10', 'bytes=-0', 'bytes=0-1,3-4', 'bytes=1.5-5', 'bytes=-1-3', 'bytes=999999999999999999999-', 'items=0-5']) assert.equal(byteRange(header, 100), null, header);
  assert.equal(byteRange('bytes=0-0', 0), null);
});
