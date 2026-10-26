import test from 'node:test';
import assert from 'node:assert/strict';
import { startIntro } from '../public/intro.js';

function element() {
  const events = new Map(), attributes = {};
  return { hidden: false, textContent: '', attributes,
    setAttribute: (key, value) => { attributes[key] = value; },
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: name => events.delete(name),
    fire: name => events.get(name)?.()
  };
}
function fixture(reduced = false) {
  const scenes = Array.from({ length: 4 }, element), choices = Array.from({ length: 4 }, element);
  const toggle = element(), controls = element(), root = element(), motion = element(), doc = element(), view = element();
  motion.matches = reduced; doc.hidden = false; doc.defaultView = view;
  root.querySelectorAll = key => key === '[data-scene]' ? scenes : choices;
  root.querySelector = key => key === '[data-motion-toggle]' ? toggle : controls;
  let nextId = 0; const timers = new Map();
  const controller = startIntro(root, { motion, doc, schedule: (fn, ms) => { assert.equal(ms, 5000); timers.set(++nextId, fn); return nextId; }, cancel: id => timers.delete(id) });
  return { scenes, choices, toggle, motion, doc, view, controller, timers, tick: () => [...timers.values()].forEach(fn => fn()), active: () => scenes.findIndex(scene => scene.attributes['data-active'] === 'true') };
}

test('las cuatro escenas cambian en bucle y solo la actual es accesible durante el fundido', () => {
  const f = fixture();
  for (let i = 0; i < 9; i++) {
    assert.equal(f.active(), i % 4);
    assert.equal(f.scenes.filter(scene => scene.attributes['aria-hidden'] === 'false').length, 1);
    assert.equal(f.scenes.filter(scene => !scene.inert).length, 1);
    assert.ok(f.scenes.every(scene => !scene.hidden), 'las capas se conservan para desvanecerse');
    assert.equal(f.choices[i % 4].attributes['aria-pressed'], 'true'); f.tick();
  }
});
test('pausar y elegir una escena permiten leer sin cambios automáticos', () => {
  const f = fixture(); f.toggle.fire('click'); f.tick(); assert.equal(f.active(), 0); assert.equal(f.timers.size, 0);
  f.toggle.fire('click'); f.tick(); assert.equal(f.active(), 1);
  f.choices[3].fire('click'); f.tick(); assert.equal(f.active(), 3); assert.equal(f.timers.size, 0);
  assert.equal(f.toggle.textContent, 'Reanudar animación');
});
test('reducción de movimiento empieza en pausa y se puede recorrer manualmente', () => {
  const f = fixture(true); assert.equal(f.timers.size, 0); f.choices[2].fire('click'); assert.equal(f.active(), 2);
  const g = fixture(); g.motion.matches = true; g.motion.fire('change'); assert.equal(g.timers.size, 0);
});
test('la página oculta detiene el reloj, volver no duplica intervalos y respeta una pausa elegida', () => {
  const f = fixture(); f.doc.hidden = true; f.doc.fire('visibilitychange'); assert.equal(f.timers.size, 0);
  f.doc.hidden = false; f.doc.fire('visibilitychange'); f.view.fire('pageshow'); assert.equal(f.timers.size, 1);
  f.view.fire('pagehide'); assert.equal(f.timers.size, 0); f.view.fire('pageshow'); assert.equal(f.timers.size, 1);
  f.toggle.fire('click'); f.doc.fire('visibilitychange'); assert.equal(f.timers.size, 0);
  f.controller.destroy(); f.toggle.fire('click'); assert.equal(f.timers.size, 0);
});
