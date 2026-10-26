import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { parseSaved, migrateV3 } from '../public/validation.js';
const script = (await readFile('public/welcome.js', 'utf8')).split('\n').filter(line => !line.startsWith('import ')).join('\n');
function entry({ current = null, previous = null, hash = '', blocked = false } = {}) {
  const elements = new Map(), events = {};
  let writes = 0, redirect = null, offline = false, intro = false;
  const document = { getElementById: id => { if (!elements.has(id)) elements.set(id, { hidden: true, textContent: '' }); return elements.get(id); } };
  vm.runInNewContext(script, { document, URL, parseSaved, migrateV3,
    location: { hash, href: 'https://universo-ices.vercel.app/' + hash, replace: value => { redirect = value; } },
    localStorage: { getItem: key => { if (blocked) throw new Error('Bloqueado'); return key.endsWith('v4') ? current : previous; }, setItem: () => { writes++; } },
    addEventListener: (name, action) => { events[name] = action; }, prepareOffline: () => { offline = true; }, startIntro: () => { intro = true; }
  });
  return { elements, events, redirect, get intro() { return intro; }, get writes() { return writes; }, get offline() { return offline; } };
}
test('una visita nueva ofrece comenzar, sin escribir respuestas ni entrar automáticamente', () => {
  const result = entry();
  assert.equal(result.elements.get('begin-label').textContent, 'Comenzar mi desafío');
  assert.equal(result.elements.get('draft-hint').hidden, true);
  assert.equal(result.redirect, null); assert.equal(result.writes, 0); assert.equal(result.offline, true);
});
test('un borrador actual o anterior se puede continuar sin modificarlo desde la bienvenida', () => {
  const draft = JSON.stringify({ mission: 'propia', appName: 'Mi idea', customSituation: 'Mejorar el barrio', functions: [], _step: 0 });
  for (const options of [{ current: draft }, { previous: draft }]) {
    const result = entry(options);
    assert.equal(result.elements.get('begin-label').textContent, 'Continuar mi idea');
    assert.equal(result.elements.get('draft-hint').hidden, false); assert.equal(result.writes, 0);
  }
});
test('almacenamiento bloqueado, borrador roto o vacío no impiden comenzar', () => {
  for (const options of [{ blocked: true }, { current: '{' }, { current: 'null' }, { current: '{}' }]) {
    const result = entry(options); assert.equal(result.elements.get('begin-label').textContent, 'Comenzar mi desafío'); assert.equal(result.redirect, null);
  }
});
test('los enlaces anteriores con etapas van a la actividad; otros fragmentos permanecen en la bienvenida', () => {
  for (let n = 1; n <= 8; n++) assert.equal(entry({ hash: `#paso-${n}` }).redirect, `https://universo-ices.vercel.app/actividad.html#paso-${n}`);
  for (const hash of ['', '#video-idea', '#el-desafio', '#paso-99', '#javascript:alert(1)']) assert.equal(entry({ hash }).redirect, null);
});
test('la bienvenida inicia la animación integrada sin modificar respuestas', () => {
  const result = entry(); assert.equal(result.intro, true); assert.equal(result.writes, 0);
});

test('la entrada y la actividad son documentos distintos, con animación nativa y alternativa textual', async () => {
  const [index, activity] = await Promise.all(['public/index.html', 'public/actividad.html'].map(path => readFile(path, 'utf8')));
  assert.match(index, /href="\.\/actividad.html"/); assert.doesNotMatch(index, /id="activity-form"|id="workspace"/);
  assert.doesNotMatch(index, /<video|<source|\.mp4|poster=|Desarrollo de Software en 20 segundos/);
  assert.match(index, /Leer toda la secuencia/); assert.match(index, /data-motion-toggle/);
  assert.equal((index.match(/data-scene(?: hidden)?>/g) || []).length, 4);
  assert.match(index, /intro\.css/); assert.match(activity, /src="\.\/app.js"/);
  assert.match(activity, /Volver a la bienvenida/);
});
