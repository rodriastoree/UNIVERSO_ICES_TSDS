'use strict';
import { fieldRules, stepFields, validateField, errorsForStep, firstInvalidStep, allowedStep, cleanAnswers, parseSaved, normalizeText } from './validation.js';
import { missions, branches, choiceFields, prompts, getOptions, selectedOption, changeChoice } from './journey.js';
import { escapeHTML as escape, randomMission, ideaFilename, answerRows, prototypeMarkup, proposalMarkup, careerMarkup, buildIdeaDocument } from './experience.js';
const STORAGE_KEY = 'ices-hackea-stand-v3';
const $ = id => document.getElementById(id);
const steps = [
  { name: 'La misión', title: 'Tu primera misión como dev.', description: 'Elegí una situación y poné un nombre a tu app.' },
  { name: 'La función', title: 'Una función para empezar.', description: 'Elegí qué permitirá hacer tu app. Las próximas opciones van a adaptarse a esta decisión.' },
  { name: 'Las personas', title: '¿A quién ayudarías primero?', description: 'Elegí para quién diseñarías la primera versión. Podés ampliarla después.' },
  { name: 'El enfoque', title: 'Hacé tuya la solución.', description: 'Ahora decidí cómo funcionaría esa acción principal.' },
  { name: 'La prueba', title: 'Tu idea se pone a prueba.', description: 'Podés probar una pantalla dibujada antes de programar. Elegí una tarea para observar.' },
  { name: 'La mejora', title: 'Probá, aprendé y mejorá.', description: 'Imaginá qué revisarías si alguien tiene dificultades. Si querés, sumá un detalle propio.' }
];
let answers = cleanAnswers({});
let currentStep = 0;
let legacyAvailable = false;
const touched = new Set();
const editing = new Set();
const attempted = new Set();
let toastTimer;
try {
  const saved = parseSaved(localStorage.getItem(STORAGE_KEY) || '{}');
  answers = saved.answers; currentStep = saved.step;
  const previous = JSON.parse(localStorage.getItem('ices-hackea-stand-v2') || '{}');
  legacyAvailable = previous && typeof previous === 'object' && Object.keys(previous).some(key => !key.startsWith('_') && typeof previous[key] === 'string' && previous[key].trim());
} catch { /* El recorrido funciona también sin almacenamiento. */ }
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => motionPreference.matches ? 'instant' : 'smooth';
const complete = index => Object.keys(errorsForStep(index, answers)).length === 0;
const selectedMission = () => missions.find(m => m.id === answers.mission);
function notify(message) {
  $('toast').textContent = message; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').textContent = ''; }, 6000);
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answers, _step: currentStep })); $('saved').textContent = 'Guardado en este dispositivo'; }
  catch { $('saved').textContent = 'Tus respuestas siguen en esta pestaña'; }
}
function textField(key, label, placeholder, short = false) {
  const rule = fieldRules[key];
  const attrs = `data-answer="${key}" id="${key}" maxlength="${rule.max}" ${rule.optional ? '' : 'required'} aria-invalid="false" aria-describedby="count-${key} error-${key}"`;
  return `<div class="field"><label for="${key}">${label}${rule.optional ? ' <span class="optional-label">(opcional)</span>' : ' *'}</label>
    ${short ? `<input type="text" ${attrs} value="${escape(answers[key])}" placeholder="${escape(placeholder)}">` : `<textarea ${attrs} placeholder="${escape(placeholder)}">${escape(answers[key])}</textarea>`}
    <p class="field-count" id="count-${key}">${answers[key].length} / ${rule.max} caracteres · sin mínimo de palabras</p><p class="field-error" id="error-${key}" hidden></p></div>`;
}
function customSituationField() {
  return answers.mission === 'propia'
    ? textField('customSituation', '¿De qué situación querés partir?', 'Contá el problema o la situación que te gustaría mejorar. Puede ser de tu escuela, tu barrio o tu vida cotidiana.')
    : '';
}
function choiceGroup(key, title, options, mission = false) {
  return `<fieldset class="choice-fieldset"><legend>${escape(title)}</legend><div class="${mission ? 'mission-grid' : 'priority-grid'}" aria-describedby="error-${key}">
  ${options.map((o, i) => `<label class="${mission ? 'mission-option' : 'priority-option choice-card'}"><input type="radio" data-answer="${key}" name="${key}" value="${escape(o.id)}" ${answers[key] === o.id ? 'checked' : ''} required aria-describedby="error-${key}">
    ${mission ? `<span class="mission-top"><span class="mission-icon">${o.icon}</span><strong>${escape(o.title)}</strong></span><span class="mission-copy">${escape(o.description)}</span>` : `<span class="choice-copy"><strong>${escape(o.title)}</strong><span>${escape(o.detail)}</span></span><span class="choice-arrow" aria-hidden="true">↗</span>`}</label>`).join('')}</div><p class="field-error" id="error-${key}" hidden></p></fieldset>`;
}
function context() {
  const fn = selectedOption('mainFunction', answers);
  return `<div class="mission-context"><strong>${escape(fn ? 'Tu función: ' + fn.title : 'Tu misión: ' + selectedMission().title)}</strong><span>${escape(currentStep === 1 ? selectedMission().hint : fn.detail)}</span>${answers.mission === 'propia' ? `<span>Tu situación: ${escape(answers.customSituation)}</span>` : ''}${currentStep > 2 ? `<span>Primera versión para: ${escape(selectedOption('audience', answers)?.title || '')}</span>` : ''}</div>`;
}
function questionScreen() {
  if (currentStep === 0) return `${legacyAvailable ? '<div class="legacy-notice"><strong>Tu recorrido anterior está conservado.</strong><p>Podés abrir tus respuestas previas y guardarlas o imprimirlas.</p><a class="text-button" href="./legacy/index.html">Abrir mi recorrido anterior →</a></div>' : ''}
    <div class="mission"><p class="eyebrow">Un problema, muchas soluciones</p><p>Elegí una misión, una función principal y las decisiones siguientes para imaginar tu app. Al final vas a recibir una propuesta según tus elecciones, sin puntajes ni respuestas correctas.</p></div>
    ${choiceGroup('mission', 'Elegí por dónde empezar', missions, true)}<div id="custom-situation-slot">${customSituationField()}</div><button class="text-button random" type="button" id="random-mission">Elegir una misión al azar ↻</button>
    ${textField('appName', 'Nombre de tu app', 'Inventá un nombre, sin datos personales.', true)}
    <details class="example"><summary>¿Cómo es la experiencia?</summary><p>La mayoría de las respuestas son de elección. Podés volver atrás y cambiar de idea. Al finalizar, guardá o imprimí el resumen completo.</p><p>Tus respuestas quedan en este navegador y no se envían a nadie. No necesitás una cuenta.</p></details>`;
  const key = choiceFields[currentStep - 1];
  const title = key === 'mode' ? branches[answers.mainFunction].modeTitle : prompts[key];
  const tips = {
    mainFunction: 'Una función es algo que la app permite hacer. Elegí una sola para pensar una primera versión sencilla.',
    audience: 'No estás excluyendo a nadie: estás eligiendo con quién empezar a aprender y probar.',
    mode: 'La misma función puede resolverse de distintas maneras. Tu elección cambia la propuesta final.',
    test: 'No hace falta tener la app terminada: dibujá la pantalla y observá qué entiende la otra persona.',
    improve: 'Una dificultad en la prueba sirve para aprender. Cambiá algo concreto y volvé a observar.'
  };
  return context() + choiceGroup(key, title, getOptions(key, answers))
    + (key === 'improve' ? textField('note', 'Tu toque personal', '¿Agregarías algo distinto? Podés escribir una idea breve o dejarlo vacío.') : '')
    + `<div class="tip"><strong>Una pista</strong>${tips[key]}</div>`;
}
function summaryScreen() {
  return `<div class="print-only summary-print-brand"><img class="print-brand-logo" src="./ices-superior-transparente.png" alt="ICES Educación Superior" width="110" height="66"><div><strong>UNIVERSO ICES · Hackeá la solución</strong>Tecnicatura Superior en Desarrollo de Software</div></div>
    <div class="achievement"><span aria-hidden="true">✳</span><div><strong>De tus decisiones a una propuesta.</strong><p>Esta es la idea que construiste.</p></div></div>
    <div class="summary-tools no-print"><div class="summary-tool-buttons"><button class="button" id="save-idea">Guardar mi idea ↓</button><button class="button secondary" id="print-idea">Imprimir / PDF</button></div><p>Tu ficha incluye el logo, todas tus respuestas, la propuesta y el boceto. Se puede abrir sin conexión.</p></div>
    <div class="app-name"><span>Tu app</span><h3>${escape(answers.appName)}</h3></div>${proposalMarkup(answers)}
    <h3>Todas tus respuestas</h3><p class="summary-intro">Estas son tus elecciones. Las sugerencias de arriba se construyeron a partir de ellas. Podés volver a cada etapa y cambiarlas.</p>
    ${answerRows(answers).map(row => `<section class="answer"><div class="answer-heading"><h3>${escape(row.label)}</h3><button type="button" class="edit-answer no-print" data-go="${row.step}">Editar</button></div><p>${escape(row.value)}</p></section>`).join('')}
    ${prototypeMarkup(answers)}${careerMarkup}`;
}
function updateNavigation() {
  const completed = steps.filter((_, i) => complete(i)).length;
  const invalid = firstInvalidStep(answers);
  $('count').textContent = `${completed} / 6`;
  $('bar').style.width = `${completed / 6 * 100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', completed);
  $('steps').innerHTML = [...steps, { name: 'Mi resumen' }].map((s, i) => `<button type="button" class="step-link ${i < 6 && complete(i) ? 'done' : ''}" data-go="${i}" ${invalid !== -1 && i > invalid ? 'disabled' : ''} ${i === currentStep ? 'aria-current="step"' : ''}><span class="step-num">${i === 6 ? '↗' : complete(i) ? '✓' : String(i + 1).padStart(2, '0')}</span>${s.name}</button>`).join('');
}
function refreshFeedback() {
  const errors = errorsForStep(currentStep, answers);
  for (const key of stepFields[currentStep] || []) {
    const message = !editing.has(key) && (touched.has(key) || attempted.has(currentStep)) ? errors[key] || '' : '';
    const target = $('error-' + key);
    if (target) { target.textContent = message; target.hidden = !message; }
    document.querySelectorAll(`[data-answer="${key}"]`).forEach(control => { control.setAttribute('aria-invalid', Boolean(message)); control.setCustomValidity(message); });
    const count = $('count-' + key);
    if (count) count.textContent = `${answers[key].length} / ${fieldRules[key].max} caracteres · sin mínimo de palabras`;
  }
  const summary = $('validation-summary');
  if (summary) {
    const visible = Object.keys(errors).filter(key => attempted.has(currentStep) && !editing.has(key));
    summary.hidden = !visible.length;
    summary.textContent = visible.length ? 'Elegí una opción o revisá el campo marcado para continuar.' : '';
  }
}
function render(focus = false) {
  editing.clear(); updateNavigation();
  const summary = currentStep === 6;
  document.body.classList.toggle('showing-summary', summary);
  $('view').innerHTML = `<div class="card-head"><p class="step-kicker">${summary ? 'Tu resumen personal' : currentStep === 0 ? 'Preparación' : `Decisión ${currentStep} / 5`}</p><h2>${summary ? 'Tu idea, de principio a fin.' : steps[currentStep].title}</h2><p>${summary ? 'Una propuesta que cambia con tus elecciones.' : steps[currentStep].description}</p></div>
  <div class="card-body">${summary ? summaryScreen() : `<p class="required-note">${currentStep === 5 ? 'Elegí una mejora. El comentario es opcional.' : currentStep === 0 ? 'Elegí una misión y un nombre. Si tenés otra idea, contá tu situación. Podés escribir algo breve.' : 'Elegí una opción. No hay una única respuesta correcta.'}</p><div class="validation-summary" id="validation-summary" role="alert" hidden></div><form id="activity-form" novalidate>${questionScreen()}</form>`}</div>`;
  $('actions').innerHTML = summary ? '<button class="button secondary" data-go="5">← Volver a mis respuestas</button><button class="button" data-go="0">Volver al inicio</button>' : `<button type="button" class="button secondary" data-go="${currentStep - 1}" ${currentStep === 0 ? 'disabled' : ''}>← Anterior</button><button type="submit" form="activity-form" class="button">${currentStep === 0 ? 'Empezar el desafío' : currentStep === 5 ? 'Ver mi resultado' : 'Siguiente'} →</button>`;
  refreshFeedback();
  if (!motionPreference.matches) $('view').querySelectorAll('.card-head,.mission-context,.mission-option,.choice-card,.personal-result,.answer,.prototype-preview').forEach((el, index) => el.animate?.([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 380, delay: Math.min(index, 5) * 35, easing: 'ease-out' }));
  if (focus) $('workspace').focus({ preventScroll: true });
}
function focusField(key) { const control = document.querySelector(`[data-answer="${key}"]`); control?.focus({ preventScroll: true }); control?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' }); }
function navigate(index) {
  if (!Number.isInteger(index) || index < 0 || index > 6) return;
  const permitted = allowedStep(index, answers);
  editing.clear();
  currentStep = permitted;
  if (permitted < index) attempted.add(currentStep);
  persist(); render(true);
  if (permitted < index) { focusField(Object.keys(errorsForStep(currentStep, answers))[0]); notify('Completá esta decisión antes de continuar.'); }
  else $('workspace').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}
function setAnswer(key, value) {
  const update = changeChoice(answers, key, normalizeText(value)); answers = update.answers;
  if (update.cleared.length) {
    update.cleared.forEach(field => { touched.delete(field); attempted.delete(stepFields.findIndex(fields => fields.includes(field))); });
    notify('Cambiaste el recorrido. Elegí las nuevas opciones en los pasos siguientes; tu nombre y comentario se conservaron.');
  }
}
function updateAnswer(event) {
  const key = event.target.dataset.answer;
  if (!Object.hasOwn(fieldRules, key)) return;
  if (event.target.type === 'radio' && event.type === 'input') return;
  setAnswer(key, event.target.value);
  if (key === 'mission' && $('custom-situation-slot')) {
    $('custom-situation-slot').innerHTML = customSituationField();
  }
  if (event.target.type === 'radio') touched.add(key); else editing.add(key);
  persist(); updateNavigation(); refreshFeedback();
}
$('view').addEventListener('input', updateAnswer);
$('view').addEventListener('change', updateAnswer);
$('view').addEventListener('focusout', event => {
  const key = event.target.dataset.answer;
  if (!Object.hasOwn(fieldRules, key) || event.target.type === 'radio') return;
  setAnswer(key, normalizeText(event.target.value).trim()); event.target.value = answers[key];
  editing.delete(key); touched.add(key); persist(); updateNavigation(); refreshFeedback();
});
async function embeddedLogo() {
  const logo = document.querySelector('.brand-logo'); await logo.decode();
  const canvas = document.createElement('canvas'); canvas.width = logo.naturalWidth; canvas.height = logo.naturalHeight;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Logo no disponible');
  context.drawImage(logo, 0, 0); return canvas.toDataURL('image/png');
}
async function saveIdea() {
  if (firstInvalidStep(answers) !== -1) { navigate(6); return; }
  const snapshot = { ...answers }; const button = $('save-idea'); if (button.disabled) return;
  button.disabled = true; button.textContent = 'Preparando tu ficha…';
  try {
    const documentHTML = buildIdeaDocument(snapshot, selectedMission().title, await embeddedLogo());
    const url = URL.createObjectURL(new Blob([documentHTML], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = ideaFilename(snapshot.appName); document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000); notify('Tu ficha incluye todas tus elecciones, el logo y la propuesta. Podés abrirla sin conexión.');
  } catch { notify('No pudimos preparar la ficha. Intentá de nuevo o usá Imprimir / PDF.'); }
  finally { button.disabled = false; button.textContent = 'Guardar mi idea ↓'; }
}
document.addEventListener('click', event => {
  if (event.target.closest('#save-idea')) { saveIdea(); return; }
  if (event.target.closest('#print-idea')) { window.print(); return; }
  if (event.target.closest('#random-mission')) { setAnswer('mission', randomMission(answers.mission)); touched.add('mission'); persist(); render(); document.querySelector('input[name="mission"]:checked')?.focus(); return; }
  const button = event.target.closest('[data-go]'); if (button && /^[0-6]$/.test(button.dataset.go)) navigate(Number(button.dataset.go));
});
document.addEventListener('submit', event => { if (event.target.id !== 'activity-form') return; event.preventDefault(); navigate(currentStep + 1); });
$('reset').onclick = () => $('reset-dialog').showModal();
$('cancel-reset').onclick = () => $('reset-dialog').close();
$('confirm-reset').onclick = () => {
  answers = cleanAnswers({}); currentStep = 0; touched.clear(); editing.clear(); attempted.clear(); persist(); render(true); $('reset-dialog').close();
  $('workspace').scrollIntoView({ behavior: scrollBehavior(), block: 'start' }); notify('Tu nuevo recorrido está listo.');
};
function updateKeyboardLayout() {
  const editingText = document.activeElement?.matches('input:not([type=radio]),textarea');
  document.documentElement.classList.toggle('keyboard-open', Boolean(editingText && window.visualViewport && window.visualViewport.height < window.innerHeight - 120));
}
window.visualViewport?.addEventListener('resize', updateKeyboardLayout);
document.addEventListener('focusin', updateKeyboardLayout);
document.addEventListener('focusout', () => requestAnimationFrame(updateKeyboardLayout));
motionPreference.addEventListener('change', () => { if (motionPreference.matches) document.getAnimations().forEach(animation => animation.cancel()); });
render(); persist();
