import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { askWorker, waitForInstall } from '../public/update-protocol.js';

const workerSource = await readFile('public/sw.js', 'utf8');
async function message(type, paths) {
  const handlers = {}; let result, activated = 0, pending;
  vm.runInNewContext(workerSource, { URL, Set, self: {
    location: 'https://app.test/sw.js', addEventListener: (key, fn) => { handlers[key] = fn; },
    clients: { matchAll: async () => paths.map(path => ({ url: 'https://app.test' + path })) },
    skipWaiting: async () => { activated++; }
  } });
  handlers.message({ data: { type }, ports: [{ postMessage: value => { result = value; } }], waitUntil: promise => { pending = promise; } });
  await pending;
  return { result, activated };
}
test('la actualización informa su versión y solo se activa con pestañas de bienvenida', async () => {
  assert.match((await message('GET_VERSION', [])).result.version, /^ices-activity-/);
  const allowed = await message('ACTIVATE_WELCOME_UPDATE', ['/', '/index.html#idea-en-movimiento', '/actualizar.html']);
  assert.equal(allowed.result.ok, true); assert.equal(allowed.activated, 1);
  for (const path of ['/actividad.html#paso-2', '/previous/index.html', '/legacy/index.html']) {
    const blocked = await message('ACTIVATE_WELCOME_UPDATE', ['/actualizar.html', path]);
    assert.equal(blocked.result.ok, false); assert.equal(blocked.activated, 0);
  }
});

const offlineSource = (await readFile('public/offline.js', 'utf8')).replace(/^import .*\n/, '').replace('export async function', 'async function');
async function offline({ path = '/', waiting = true, allowed = true } = {}) {
  const events = {}; let reloads = 0, requests = 0;
  const target = { textContent: '', children: [], append(link) { this.children.push(link); } };
  const registration = { waiting: waiting ? {} : null, addEventListener() {}, update: async () => {} };
  const context = { URL, document: { createElement: () => ({}) },
    location: { pathname: path, href: 'https://app.test' + path, reload: () => { reloads++; } },
    navigator: { serviceWorker: { register: async () => registration, ready: Promise.resolve(registration), addEventListener: (name, fn) => { events[name] = fn; } } },
    askWorker: async () => { requests++; return { ok: allowed }; }
  };
  vm.createContext(context); vm.runInContext(offlineSource, context);
  await context.prepareOffline(target);
  events.controllerchange?.(); events.controllerchange?.();
  return { target, requests, reloads };
}
test('una bienvenida aplica la actualización y se recarga una sola vez', async () => {
  const r = await offline(); assert.equal(r.requests, 1); assert.equal(r.reloads, 1);
  assert.match(r.target.textContent, /Actualizando/);
});
test('un formulario abierto conserva su versión y ofrece actualizar al terminar', async () => {
  const r = await offline({ path: '/actividad.html' });
  assert.equal(r.requests, 0); assert.equal(r.reloads, 0);
  assert.equal(r.target.children[0].href, './actualizar.html');
});
test('el bloqueo por otra actividad ofrece un enlace y no anuncia falsamente estar actualizado', async () => {
  const r = await offline({ allowed: false }); assert.equal(r.reloads, 0);
  assert.match(r.target.textContent, /otra pestaña/); assert.equal(r.target.children.length, 1);
  const current = await offline({ waiting: false }); assert.equal(current.requests, 0); assert.equal(current.reloads, 0);
  assert.match(current.target.textContent, /preparada/);
});
test('el protocolo obtiene la versión de un controlador y comunica la falta de respuesta', async () => {
  const worker = { postMessage(data, [port]) { port.postMessage({ version: 'actual' }); port.close(); } };
  assert.equal((await askWorker(worker, 'GET_VERSION')).version, 'actual');
  await assert.rejects(askWorker(null, 'GET_VERSION'), /No hay/);
  await assert.rejects(askWorker({ postMessage(_data, [port]) { port.close(); } }, 'GET_VERSION', 5), /no respondió/);
});
test('la verificación espera la instalación y no da por lista una descarga fallida', async () => {
  await waitForInstall({ installing: null });
  let listener;
  const worker = { state: 'installing', addEventListener: (_name, fn) => { listener = fn; }, removeEventListener() {} };
  const ready = waitForInstall({ installing: worker }); worker.state = 'installed'; listener(); await ready;
  worker.state = 'installing'; const failed = waitForInstall({ installing: worker }); worker.state = 'redundant'; listener();
  await assert.rejects(failed, /No se pudo/);
});
