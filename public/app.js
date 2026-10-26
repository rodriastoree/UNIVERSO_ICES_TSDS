import { fieldRules, stepFields, isActive, errorsForStep, firstInvalidStep, allowedStep, cleanAnswers, parseSaved, migrateV3, normalizeText } from './validation.js';
import { missions, steps, SUMMARY_STEP, getOptions, selectedOption, functionTitle, problemFor, audienceFor, changeChoice } from './journey.js';
import { escapeHTML as escape, randomMission, ideaFilename, ideaText, answerRows, prototypeMarkup, proposalMarkup, careerMarkup, buildIdeaDocument } from './experience.js';
import { DraftStore } from './storage.js';
import { prepareOffline } from './offline.js';
const $ = id => document.getElementById(id);
const store = new DraftStore('ices-hackea-stand-v4', () => window.localStorage);
let answers = cleanAnswers({}), currentStep = 0, previousAvailable = false, legacyAvailable = false;
let conflict = false, toastTimer, printDetails = [];
const touched = new Set(), editing = new Set(), attempted = new Set();
const loaded = store.read();
if (loaded.ok && loaded.raw) ({ answers, step: currentStep } = parseSaved(loaded.raw));
try {
  const previous = localStorage.getItem('ices-hackea-stand-v3');
  previousAvailable = Boolean(migrateV3(previous));
  legacyAvailable = Boolean(localStorage.getItem('ices-hackea-stand-v2'));
  if (!loaded.raw && previousAvailable) ({ answers, step: currentStep } = migrateV3(previous));
} catch { /* El estado de guardado se muestra por separado. */ }
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => motion.matches ? 'instant' : 'smooth';
function notify(message) {
  $('toast').textContent = message;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').textContent = ''; }, 7000);
}
function showConflict() {
  conflict = true; $('tab-conflict').hidden = false;
  $('saved').textContent = 'Hay cambios en otra pestaña';
}
function persist(force = false) {
  if (conflict && !force) return { ok: false, conflict: true };
  const result = store.write(JSON.stringify({ ...answers, _step: currentStep, _schema: 4 }), force);
  if (result.conflict) { showConflict(); return result; }
  $('storage-warning').hidden = result.ok;
  const message = result.ok ? 'Guardado en este navegador' : 'Guardado no disponible';
  if ($('saved').textContent !== message) $('saved').textContent = message;
  return result;
}
function field(key, label, help = '', short = false) {
  const r = fieldRules[key], numeric = r.type === 'number';
  const attrs = `data-answer="${key}" id="${key}" ${r.optional ? '' : 'required'} aria-invalid="false" aria-describedby="help-${key} error-${key}" maxlength="${numeric ? 32 : r.max}" ${numeric ? 'inputmode="numeric" pattern="[0-9]{1,2}"' : ''}`;
  return `<div class="field"><label for="${key}">${escape(label)}${r.optional ? ' <span>(opcional)</span>' : ' *'}</label><p class="help" id="help-${key}">${escape(help)} ${numeric ? 'Enteros de 1 a 20.' : `Hasta ${r.max} caracteres. Sin mínimo de palabras. No incluyas datos personales.`}</p>${short || numeric ? `<input type="text" ${attrs} value="${escape(answers[key])}">` : `<textarea ${attrs} rows="3">${escape(answers[key])}</textarea>`}<p class="field-error" id="error-${key}" hidden></p></div>`;
}
function cards(key, title, options, multiple = false) {
  return `<fieldset><legend>${escape(title)}</legend>${multiple ? `<p id="function-count" class="help" role="status">${answers.functions.length} de 3 funciones elegidas</p>` : ''}<div class="choices ${key === 'mission' ? 'mission-grid' : ''}">${options.map(o => `<label class="choice"><input type="${multiple ? 'checkbox' : 'radio'}" data-answer="${key}" name="${key}" value="${escape(o.id)}" ${multiple ? answers.functions.includes(o.id) ? 'checked' : '' : answers[key] === o.id ? 'checked' : ''} ${multiple ? '' : 'required'} aria-invalid="false" aria-describedby="error-${key}"><span><strong>${escape(o.title)}</strong><span>${escape(o.description || o.detail)}</span></span></label>`).join('')}</div><p class="field-error" id="error-${key}" hidden></p></fieldset>`;
}
function customSituation() { return answers.mission === 'propia' ? field('customSituation', '¿De qué situación querés partir?', 'Puede ser de tu escuela, tu barrio o tu vida cotidiana.') : ''; }
function customFunctions() { return [1, 2, 3].filter(n => isActive(`customFunction${n}`, answers)).map(n => field(`customFunction${n}`, `¿Qué permite hacer tu función ${n}?`, 'Por ejemplo: informar un problema o encontrar un objeto perdido.', true)).join(''); }
function context() {
  return `<details class="context"><summary>Recordar mi idea: ${escape(answers.appName)}</summary><p><strong>Problema:</strong> ${escape(problemFor(answers))}</p>${answers.audience ? `<p><strong>Personas:</strong> ${escape(audienceFor(answers))}</p>` : ''}${answers.mainFunction ? `<p><strong>Primero:</strong> ${escape(functionTitle(answers.mainFunction, answers))}</p>` : ''}</details>`;
}
function question() {
  if (currentStep === 0) return `${previousAvailable || legacyAvailable ? `<details class="previous"><summary>Mis recorridos anteriores</summary><p>Conservamos las respuestas de versiones anteriores. El recorrido nuevo también recupera tu nombre y situación para completarlos con las nuevas decisiones.</p>${previousAvailable ? '<a href="./previous/index.html">Abrir mi recorrido anterior</a>' : ''}${legacyAvailable ? '<a href="./legacy/index.html">Abrir mi primer recorrido</a>' : ''}</details>` : ''}<p class="activity-intro">Convertí un problema en una propuesta: personas, tres funciones, una prioridad y una prueba. Al final te llevás tu resumen.</p>${cards('mission', 'Elegí una situación', missions)}<div id="custom-situation-slot">${customSituation()}</div><button class="text-button" id="random-mission" type="button">Elegir otra misión al azar ↻</button>${field('appName', 'Nombre de tu app', 'Inventá un nombre.', true)}`;
  let content = '';
  if (currentStep === 1) content = (answers.mission === 'propia' ? field('customAudience', '¿Quiénes usarían tu app?', 'Por ejemplo: vecinos del barrio o personas que buscan un libro.', true) : '') + cards('audience', answers.mission === 'propia' ? '¿Qué necesitan hacer principalmente?' : '¿A quién ayudarías primero?', getOptions('audience', answers));
  if (currentStep === 2) {
    const all = getOptions('functions', answers), own = answers.mission === 'propia';
    content = cards('functions', 'Elegí exactamente tres funciones', own ? all.filter(o => o.id.startsWith('custom-')) : all, true)
      + (own ? `<div id="custom-functions-slot">${customFunctions()}</div><details class="suggestions"><summary>También puedo elegir funciones sugeridas</summary><div class="choices">${all.filter(o => !o.id.startsWith('custom-')).map(o => `<label class="choice"><input type="checkbox" name="functions" data-answer="functions" value="${escape(o.id)}" ${answers.functions.includes(o.id) ? 'checked' : ''} aria-describedby="error-functions"><span><strong>${escape(o.title)}</strong><span>${escape(o.detail)}</span></span></label>`).join('')}</div></details>` : '');
  }
  if (currentStep === 3) content = cards('mainFunction', '¿Cuál desarrollarías primero?', getOptions('mainFunction', answers)) + cards('reason', '¿Por qué empezarías por esa?', getOptions('reason', answers));
  if (currentStep === 4) content = cards('mode', '¿Cómo sería esa primera versión?', getOptions('mode', answers)) + '<div class="tip">Diseñar también es decidir qué mostrar y en qué orden. Podés dibujar el boceto en papel antes de programar.</div>';
  if (currentStep === 5) content = cards('test', '¿Qué pedirías hacer con el boceto?', getOptions('test', answers)) + `<div class="number-grid">${field('participants', '¿Con cuántas personas probarías?', 'Elegí un grupo pequeño que represente a tus usuarios.')}${field('target', '¿Cuántas deberían lograrlo?', 'Que completen la tarea sin pistas sobre el diseño.')}</div><p class="tip">Es una meta para una prueba futura. Observá dudas y errores; no ayudes a encontrar los controles. Para una primera prueba, cinco personas puede ser un punto de partida.</p>`;
  if (currentStep === 6) content = cards('improve', 'Si la prueba muestra dificultades, ¿qué revisarías?', getOptions('improve', answers)) + field('note', 'Tu toque personal', 'Agregá un detalle si querés.') + '<p class="tip">Después de cambiar el diseño, repetí la misma tarea y compará con tu meta. Mejorar es parte del proceso.</p>';
  return context() + content;
}
function summary() {
  const rows = answerRows(answers);
  return `<div class="print-brand print-only"><img src="./ices-logo-web.png" width="120" height="63" alt="ICES Educación Superior"><p><strong>UNIVERSO ICES · Hackeá la solución</strong><br>Tecnicatura Superior en Desarrollo de Software</p></div><div class="app-name"><span>Tu app</span><h3>${escape(answers.appName)}</h3></div><dl class="idea-brief"><dt>El problema</dt><dd>${escape(problemFor(answers))}</dd><dt>Para quién</dt><dd>${escape(audienceFor(answers))}</dd><dt>Tres funciones</dt><dd><ol>${answers.functions.map(id => `<li>${escape(functionTitle(id, answers))}${id === answers.mainFunction ? ' <strong>· Primero</strong>' : ''}</li>`).join('')}</ol></dd><dt>Tu prioridad</dt><dd>${escape(selectedOption('reason', answers).detail)}</dd><dt>Tu meta de prueba</dt><dd>Al menos ${escape(answers.target)} de ${escape(answers.participants)} personas completan la tarea sin ayuda sobre el diseño.</dd></dl><p class="summary-note">Es tu propuesta y tu plan de prueba; todavía no se realizó una prueba con personas.</p>${careerMarkup}<div class="summary-tools no-print"><div class="tool-buttons"><button class="button" id="save-idea">Guardar mi idea ↓</button><button class="button secondary" id="print-idea">Imprimir / PDF</button><button class="button secondary" id="copy-idea">Copiar resumen</button>${navigator.share ? '<button class="button secondary" id="share-idea">Compartir resumen</button>' : ''}</div><p>Guardar descarga una ficha <strong>HTML</strong> con todas tus respuestas, la conclusión y el boceto; se abre sin conexión. Para PDF, elegí Imprimir / PDF y luego la opción de guardar del navegador. La ficha no permite reanudar la actividad.</p></div><details class="summary-detail"><summary>Ver todas mis respuestas y editarlas</summary>${rows.map(row => `<section class="answer"><div class="answer-heading"><h3>${escape(row.label)}</h3><button type="button" class="edit-answer no-print" aria-label="Editar ${escape(row.label)}" data-go="${row.step}">Editar</button></div><p>${escape(row.value)}</p></section>`).join('')}</details><details class="summary-detail"><summary>Ver la conclusión y el plan completo</summary>${proposalMarkup(answers)}</details><details class="summary-detail"><summary>Ver un boceto ilustrativo de mi app</summary>${prototypeMarkup(answers)}</details>`;
}
function updateNavigation() {
  const completed = steps.filter((_, i) => !Object.keys(errorsForStep(i, answers)).length).length, invalid = firstInvalidStep(answers);
  $('count').textContent = `${completed} / ${SUMMARY_STEP}`;
  $('current-step').textContent = currentStep === SUMMARY_STEP ? 'Tu resumen' : `Paso ${currentStep + 1} de ${SUMMARY_STEP} · ${steps[currentStep].name}`;
  $('progress').setAttribute('aria-valuenow', completed); $('bar').value = completed;
  $('steps').innerHTML = [...steps, { name: 'Mi resumen' }].map((s, i) => `<button type="button" class="step-link" data-go="${i}" ${invalid !== -1 && i > invalid ? 'disabled' : ''} ${i === currentStep ? 'aria-current="step"' : ''}><span>${i === SUMMARY_STEP ? '↗' : i + 1}</span>${s.name}</button>`).join('');
}
function refreshFeedback() {
  const errors = errorsForStep(currentStep, answers);
  for (const key of stepFields[currentStep] || []) {
    const message = !editing.has(key) && (touched.has(key) || attempted.has(currentStep)) ? errors[key] || '' : '';
    const target = $('error-' + key);
    if (target) { target.textContent = message; target.hidden = !message; }
    document.querySelectorAll(`[data-answer="${key}"]`).forEach(el => { el.setAttribute('aria-invalid', String(Boolean(message))); el.setCustomValidity(message); });
  }
  const errorSummary = $('validation-summary');
  if (errorSummary) {
    const visible = Object.keys(errors).filter(key => attempted.has(currentStep) && !editing.has(key));
    errorSummary.hidden = !visible.length;
    errorSummary.textContent = visible.length ? 'Revisá los campos marcados para continuar.' : '';
  }
  if ($('function-count')) $('function-count').textContent = `${answers.functions.length} de 3 funciones elegidas`;
}
function render(focus = false) {
  editing.clear(); updateNavigation();
  const end = currentStep === SUMMARY_STEP;
  document.body.classList.toggle('showing-summary', end);
  $('view').innerHTML = `<div class="card-head"><p class="eyebrow">${end ? 'Tu resumen personal' : `Paso ${currentStep + 1} de ${SUMMARY_STEP}`}</p><h2 id="view-title" tabindex="-1">${end ? 'Tu idea, de principio a fin.' : steps[currentStep].title}</h2><p>${end ? 'Tus decisiones, una conclusión y un plan para seguir creando.' : steps[currentStep].description}</p></div><div class="card-body">${end ? summary() : `<div id="validation-summary" class="validation-summary" role="alert" hidden></div><form id="activity-form" novalidate>${question()}<p class="required-note">* Campos obligatorios. No hay una única respuesta correcta.</p></form>`}</div>`;
  $('actions').innerHTML = end ? '<button class="button secondary" data-go="6">← Volver a mis respuestas</button><button class="button" data-go="0">Revisar desde el inicio</button>' : `<button type="button" class="button secondary" data-go="${currentStep - 1}" ${currentStep === 0 ? 'disabled' : ''}>← Anterior</button><button type="submit" form="activity-form" class="button">${currentStep === 0 ? 'Empezar' : currentStep === SUMMARY_STEP - 1 ? 'Ver mi resultado' : 'Siguiente'} →</button>`;
  refreshFeedback();
  if (focus) $('view-title').focus({ preventScroll: true });
}
function focusField(key) {
  const el = document.querySelector(`[data-answer="${key}"]`);
  el?.focus({ preventScroll: true }); el?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
}
function navigate(index, historyMode = 'push') {
  if (!Number.isInteger(index) || index < 0 || index > SUMMARY_STEP) return;
  currentStep = allowedStep(index, answers);
  if (currentStep < index) attempted.add(currentStep);
  persist(); render(true);
  if (historyMode === 'push') history.pushState({ icesStep: currentStep }, '', `#paso-${currentStep + 1}`);
  if (currentStep < index) { focusField(Object.keys(errorsForStep(currentStep, answers))[0]); notify('Completá esta etapa antes de continuar.'); }
  else $('workspace').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}
function update(key, value) {
  const result = changeChoice(answers, key, value); answers = result.answers;
  if (result.cleared.length) {
    result.cleared.forEach(field => touched.delete(field));
    notify('Cambió una decisión anterior. Revisá las opciones relacionadas; tus textos se conservaron.');
  }
}
function updateAnswer(event) {
  const el = event.target, key = el.dataset.answer;
  if (!Object.hasOwn(fieldRules, key)) return;
  const option = ['radio', 'checkbox'].includes(el.type);
  if (option && event.type === 'input') return;
  if (!option && event.type === 'change') return;
  let value = normalizeText(el.value);
  if (el.type === 'checkbox') {
    value = el.checked ? [...answers.functions, value] : answers.functions.filter(id => id !== value);
    if (value.length > 3) { el.checked = false; notify('Ya elegiste tres. Desmarcá una para elegir otra.'); return; }
  }
  update(key, value);
  if (key === 'mission') $('custom-situation-slot').innerHTML = customSituation();
  if (key === 'functions' && $('custom-functions-slot')) $('custom-functions-slot').innerHTML = customFunctions();
  if (option) touched.add(key); else editing.add(key);
  persist(); updateNavigation(); refreshFeedback();
}
$('view').addEventListener('input', updateAnswer); $('view').addEventListener('change', updateAnswer);
$('view').addEventListener('focusout', event => {
  const el = event.target, key = el.dataset.answer;
  if (!Object.hasOwn(fieldRules, key) || ['radio', 'checkbox'].includes(el.type)) return;
  const value = fieldRules[key].type === 'number' ? el.value : normalizeText(el.value).trim();
  update(key, value); el.value = answers[key]; editing.delete(key); touched.add(key);
  persist();
  // Evitar que un error cambie la posición del botón entre presionar y soltar.
  if (event.relatedTarget?.matches('button,[data-go]')) return;
  updateNavigation(); refreshFeedback();
});
async function embeddedLogo() {
  const logo = document.querySelector('.brand-logo'); await logo.decode();
  const canvas = document.createElement('canvas'); canvas.width = Math.min(400, logo.naturalWidth); canvas.height = Math.round(canvas.width * logo.naturalHeight / logo.naturalWidth);
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Logo no disponible');
  ctx.drawImage(logo, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/png');
}
async function saveIdea() {
  if (firstInvalidStep(answers) !== -1) { navigate(SUMMARY_STEP); return; }
  const snapshot = structuredClone(answers), button = $('save-idea');
  if (button.disabled) return; button.disabled = true; button.textContent = 'Preparando ficha…';
  try {
    const html = buildIdeaDocument(snapshot, missions.find(m => m.id === snapshot.mission).title, await embeddedLogo());
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = ideaFilename(snapshot.appName); document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000); notify('Ficha HTML preparada. Revisá las descargas de tu navegador. También podés copiar el resumen o guardar un PDF.');
  } catch { notify('No se pudo preparar la ficha. Podés copiar el resumen o usar Imprimir / PDF.'); }
  finally { if (button.isConnected) { button.disabled = false; button.textContent = 'Guardar mi idea ↓'; } }
}
async function copyIdea() {
  if (firstInvalidStep(answers) !== -1) { navigate(SUMMARY_STEP); return; }
  const text = ideaText(answers);
  try { await navigator.clipboard.writeText(text); notify('Resumen copiado. Podés pegarlo donde quieras.'); }
  catch { $('copy-text').value = text; $('copy-dialog').showModal(); $('copy-text').focus(); $('copy-text').select(); }
}
document.addEventListener('click', async event => {
  if (event.target.closest('#save-idea')) { saveIdea(); return; }
  if (event.target.closest('#print-idea')) { window.print(); return; }
  if (event.target.closest('#copy-idea')) { copyIdea(); return; }
  if (event.target.closest('#share-idea')) {
    if (firstInvalidStep(answers) !== -1) { navigate(SUMMARY_STEP); return; }
    try { await navigator.share({ title: answers.appName, text: ideaText(answers) }); }
    catch (error) { if (error.name !== 'AbortError') copyIdea(); } return;
  }
  if (event.target.closest('#random-mission')) { update('mission', randomMission(answers.mission)); touched.add('mission'); persist(); render(); document.querySelector('input[name="mission"]:checked')?.focus(); return; }
  const button = event.target.closest('[data-go]');
  if (button && /^\d$/.test(button.dataset.go)) navigate(Number(button.dataset.go));
});
document.addEventListener('submit', event => { if (event.target.id === 'activity-form') { event.preventDefault(); navigate(currentStep + 1); } });
$('reset').onclick = () => $('reset-dialog').showModal();
$('cancel-reset').onclick = () => $('reset-dialog').close();
$('confirm-reset').onclick = () => {
  answers = cleanAnswers({}); currentStep = 0; touched.clear(); editing.clear(); attempted.clear();
  conflict = false; $('tab-conflict').hidden = true;
  const result = persist(true);
  $('reset-dialog').close(); render(true); history.pushState({ icesStep: 0 }, '', '#paso-1');
  $('workspace').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  notify(result.ok ? 'Tu nuevo recorrido está listo. Los recorridos anteriores se conservaron.' : 'Reiniciamos esta pestaña, pero no pudimos guardar el reinicio. Al recargar podría volver el borrador anterior.');
};
$('close-copy').onclick = () => $('copy-dialog').close();
$('load-other').onclick = () => {
  const result = store.read();
  if (!result.ok) { $('storage-warning').hidden = false; return; }
  ({ answers, step: currentStep } = parseSaved(result.raw || '{}'));
  conflict = false; $('tab-conflict').hidden = true; touched.clear(); attempted.clear(); render(true);
  history.replaceState({ icesStep: currentStep }, '', `#paso-${currentStep + 1}`); persist(); notify('Cargamos el recorrido guardado en la otra pestaña.');
};
$('keep-mine').onclick = () => {
  const result = persist(true);
  if (result.ok) { conflict = false; $('tab-conflict').hidden = true; notify('Guardamos las respuestas de esta pestaña.'); }
  else notify('No pudimos guardar estas respuestas. Podés reintentar o cargar el otro recorrido.');
};
addEventListener('storage', event => { if (event.storageArea === window.localStorage && (event.key === store.key || event.key === null) && event.newValue !== store.lastRaw) showConflict(); });
addEventListener('popstate', event => { if (Number.isInteger(event.state?.icesStep)) navigate(event.state.icesStep, 'none'); });
addEventListener('beforeprint', () => { printDetails = [...document.querySelectorAll('.summary-detail')].map(el => [el, el.open]); printDetails.forEach(([el]) => { el.open = true; }); });
addEventListener('afterprint', () => { printDetails.forEach(([el, open]) => { el.open = open; }); printDetails = []; });
function updateKeyboard() {
  const typing = document.activeElement?.matches('input[type=text],textarea');
  document.documentElement.classList.toggle('keyboard-open', Boolean(typing && window.visualViewport && window.visualViewport.height < innerHeight - 120));
}
window.visualViewport?.addEventListener('resize', updateKeyboard); document.addEventListener('focusin', updateKeyboard); document.addEventListener('focusout', () => requestAnimationFrame(updateKeyboard));
const wideLayout = matchMedia('(min-width:761px)');
document.querySelector('.step-panel').open = wideLayout.matches;
wideLayout.addEventListener('change', event => { document.querySelector('.step-panel').open = event.matches; });
history.replaceState({ icesStep: currentStep }, '', `#paso-${currentStep + 1}`); render(); persist();
prepareOffline($('offline-state'));
