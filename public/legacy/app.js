'use strict';

import { fieldRules, stepFields, normalizeText, validateField, errorsForStep,
  firstInvalidStep, allowedStep, cleanAnswers } from './validation.js';
import { affectedReviewSteps, restoreExperience, randomMission, ideaFilename,
  prototypeMarkup, buildIdeaDocument } from './experience.js';

// Cada dispositivo conserva únicamente sus propias respuestas. No hay servidor de datos.
const STORAGE_KEY = 'ices-hackea-stand-v2';
const answerKeys = Object.keys(fieldRules);
const touched = new Set();
const attemptedSteps = new Set();
const editingFields = new Set();
const reviewSteps = new Set();
let editingFromSummary = false;
let navigationSignature = '';
const steps = [
  { name: 'La misión', title: 'Tu primera misión como dev.', time: '2 min', description: 'Elegí una situación de tu escuela y explorá cómo podrías mejorarla con una app.' },
  { name: 'El problema', title: '¿Qué vale la pena resolver?', time: '3 min', description: 'Pensá en una dificultad concreta y en lo que provoca.' },
  { name: 'Los usuarios', title: '¿Para quién estás diseñando?', time: '2 min', description: 'Imaginá quién usaría tu app y qué necesitaría hacer.' },
  { name: 'Las funciones', title: 'Tres funciones. Un propósito.', time: '4 min', description: 'Elegí tres cosas que tu app permita hacer y explicá para qué sirven.' },
  { name: 'La prioridad', title: '¿Por dónde empezarías?', time: '2 min', description: 'No hace falta construir todo de una vez. Elegí un primer paso y contá por qué.' },
  { name: 'La validación', title: 'Tu idea se pone a prueba.', time: '3 min', description: 'Pensá cómo comprobarías si tu solución realmente ayuda.' }
];
const missions = [
  { id: 'entregas', icon: '01', title: '¿Era para hoy?', description: 'Las fechas de entrega se mezclan entre cuadernos, mensajes y lo que alguien dijo.', question: '¿Cómo te enterás hoy de las fechas? ¿Qué pasa cuando cambia una entrega?' },
  { id: 'avisos', icon: '02', title: 'El aviso que nadie vio', description: 'Un cambio de aula o un aviso importante no llega a todas las personas.', question: '¿Cómo distinguirías un aviso oficial? ¿A quién debería llegarle?' },
  { id: 'actividades', icon: '03', title: 'Todo pasa a la vez', description: 'Pruebas, actividades y eventos escolares se superponen y cuesta organizarse.', question: '¿Quién conoce las actividades de cada curso? ¿Dónde aparecen los cruces?' },
  { id: 'propia', icon: '↗', title: 'Tengo otra idea', description: 'Detectaste otro problema al organizar actividades, avisos o entregas.', question: 'Pensá en una situación concreta de tu escuela y cómo averiguarías si le pasa a otras personas.' }
];
const functionIdeas = [
  'Consultar un calendario', 'Publicar un aviso', 'Entregar un trabajo',
  'Confirmar recepción', 'Recordar una fecha', 'Ver cambios de horario'
];
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

let answers = cleanAnswers({});
let currentStep = 0;
let toastTimer;

// El movimiento acompaña la lectura y respeta la preferencia del dispositivo.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => motionPreference.matches ? 'instant' : 'smooth';
let animatedStep = -1;
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    revealObserver.unobserve(entry.target);
    if (motionPreference.matches || !entry.target.animate) continue;
    entry.target.animate([
      { opacity: 0, transform: 'translateY(14px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 480,
      delay: Number(entry.target.dataset.revealOrder || 0) * 45,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'backwards'
    });
  }
}, { threshold: 0.08 }) : null;

function animateView() {
  revealObserver?.disconnect();
  if (animatedStep === currentStep) return;
  animatedStep = currentStep;
  if (!revealObserver || motionPreference.matches) return;
  const targets = $('view').querySelectorAll(
    '.card-head, .required-note, #activity-form > .mission, .mission-option, ' +
    '#activity-form > .field, .mission-context, .idea-box, .function-card, ' +
    '.priority-option, .tip, .example, .achievement, .app-name, ' +
    '.summary-intro, .mission-summary, .answer, .prototype-preview, .conclusion-card, .career-card'
  );
  targets.forEach((target, index) => {
    target.dataset.revealOrder = String(index % 4);
    revealObserver.observe(target);
  });
}

motionPreference.addEventListener('change', () => {
  if (!motionPreference.matches) return;
  revealObserver?.disconnect();
  document.getAnimations().forEach(animation => animation.cancel());
});
try {
  const saved = restoreExperience(localStorage.getItem(STORAGE_KEY) || '{}');
  answers = saved.answers;
  currentStep = saved.step;
  saved.reviewSteps.forEach(index => reviewSteps.add(index));
  editingFromSummary = saved.editingFromSummary;
} catch {
  // La experiencia sigue funcionando si el navegador bloquea el almacenamiento.
}

const hasAnswer = key => Boolean(answers[key]?.trim());
const selectedMission = () => missions.find(mission => mission.id === answers.mission);
const selectedFunction = () => ['1', '2', '3'].includes(answers.priority)
  ? answers['f' + answers.priority].trim()
  : '';

function isComplete(index) {
  return Object.keys(errorsForStep(index, answers)).length === 0;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answers, _step: currentStep,
      _review: [...reviewSteps], _editingFromSummary: editingFromSummary }));
    $('saved').textContent = 'Guardado en este dispositivo';
  } catch {
    $('saved').textContent = 'Tus respuestas siguen en esta pestaña';
  }
}

function notify(message) {
  $('toast').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').textContent = ''; }, 5000);
}

function field(key, label, placeholder = '', help = '', short = false) {
  const rule = fieldRules[key];
  const describedBy = `aria-describedby="${help ? 'help-' + key + ' ' : ''}count-${key} error-${key}"`;
  const attrs = `required maxlength="${rule.max}" aria-invalid="false" ${describedBy}`;
  const control = short
    ? `<input type="text" id="${key}" data-answer="${key}" value="${escapeHTML(answers[key])}" placeholder="${escapeHTML(placeholder)}" ${attrs}>`
    : `<textarea id="${key}" data-answer="${key}" placeholder="${escapeHTML(placeholder)}" ${attrs}>${escapeHTML(answers[key])}</textarea>`;
  return `<div class="field"><label for="${key}">${label} <span aria-hidden="true">*</span></label>
    ${help ? `<p class="help" id="help-${key}">${help}</p>` : ''}${control}
    <p class="field-count" id="count-${key}">${answers[key].length} / ${rule.max} caracteres</p>
    <p class="field-error" id="error-${key}" hidden></p></div>`;
}

function numberField(key, label, help) {
  const maximum = key === 'successes' && !validateField('participants', answers.participants, answers)
    ? Number(answers.participants) : fieldRules[key].max;
  const value = escapeHTML(answers[key]);
  return `<div class="field"><label for="${key}">${label} <span aria-hidden="true">*</span></label>
    <p class="help" id="help-${key}">${help}</p>
    <input type="number" inputmode="numeric" id="${key}" data-answer="${key}" required min="1" max="${maximum}" step="1" value="${value}" aria-invalid="false" aria-describedby="help-${key} error-${key}">
    <p class="field-error" id="error-${key}" hidden></p></div>`;
}

function choiceError(key) {
  return `<p class="field-error" id="error-${key}" hidden></p>`;
}

function refreshReview() {
  const notice = $('review-notice');
  if (!notice) return;
  notice.hidden = reviewSteps.size === 0;
  if (notice.hidden) { notice.innerHTML = ''; delete notice.dataset.signature; return; }
  const pending = [...reviewSteps].sort((a, b) => a - b);
  const signature = JSON.stringify([pending, currentStep]);
  if (notice.dataset.signature === signature) return;
  notice.dataset.signature = signature;
  notice.innerHTML = `<strong>Tu idea cambió: revisá estos puntos.</strong>
    <p>Conservamos tus respuestas. Comprobá que todavía correspondan a la misión, las personas y las funciones que elegiste.</p>
    <div class="review-links">${pending.map(index => `<button type="button" class="text-button" ${currentStep === 6 ? 'data-edit' : 'data-go'}="${index}">${steps[index].name} →</button>`).join('')}</div>
    ${reviewSteps.has(currentStep) ? '<button type="button" class="button secondary review-confirm" id="confirm-review">Ya revisé esta etapa</button>' : ''}`;
}

function setAnswer(key, value) {
  const before = { ...answers };
  answers[key] = normalizeText(value);
  affectedReviewSteps(key, before, answers).forEach(index => reviewSteps.add(index));
}

function refreshFeedback() {
  const errors = errorsForStep(currentStep, answers);
  for (const key of stepFields[currentStep] || []) {
    const message = errors[key] && !editingFields.has(key)
      && (touched.has(key) || attemptedSteps.has(currentStep)) ? errors[key] : '';
    const errorElement = $('error-' + key);
    if (errorElement) { errorElement.textContent = message; errorElement.hidden = !message; }
    document.querySelectorAll(`[data-answer="${key}"]`).forEach(control => {
      control.setAttribute('aria-invalid', String(Boolean(message)));
      control.setCustomValidity(message);
    });
    const count = $('count-' + key);
    if (count) count.textContent = `${answers[key].length} / ${fieldRules[key].max} caracteres`;
  }
  if ($('successes')) {
    $('successes').max = !validateField('participants', answers.participants, answers)
      ? answers.participants : '50';
  }
  const summary = $('validation-summary');
  if (summary) {
    const entries = attemptedSteps.has(currentStep)
      ? Object.entries(errors).filter(([key]) => !editingFields.has(key)) : [];
    summary.hidden = entries.length === 0;
    const signature = JSON.stringify(entries);
    if (summary.dataset.signature !== signature) {
      summary.innerHTML = entries.length
        ? `<strong>Revisá estos puntos para continuar</strong><ul>${entries.map(([key, message]) => `<li><button type="button" class="error-link" data-focus="${key}">${fieldRules[key].label}: ${message}</button></li>`).join('')}</ul>`
        : '';
      summary.dataset.signature = signature;
    }
  }
  refreshReview();
}

function focusField(key) {
  const control = document.querySelector(`[data-answer="${key}"]`);
  if (!control) return;
  control.focus({ preventScroll: true });
  control.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
}

function updateNavigation() {
  const completion = steps.map((_, index) => isComplete(index));
  const completed = completion.filter(Boolean).length;
  const invalid = firstInvalidStep(answers);
  $('count').textContent = `${completed} / 6`;
  $('bar').style.width = `${completed / 6 * 100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', completed);
  const signature = JSON.stringify([currentStep, invalid, completion, [...reviewSteps]]);
  if (navigationSignature === signature) return;
  navigationSignature = signature;
  $('steps').innerHTML = steps.map((step, index) => `
    <button type="button" class="step-link ${isComplete(index) ? 'done' : ''}" data-go="${index}" ${invalid !== -1 && index > invalid ? 'disabled title="Completá las etapas anteriores para continuar"' : ''} ${currentStep === index ? 'aria-current="step"' : ''}>
      <span class="step-num">${isComplete(index) ? '✓' : String(index).padStart(2, '0')}</span>${step.name}${reviewSteps.has(index) ? '<span class="step-review">Revisar</span>' : ''}
    </button>`).join('') + `
    <button type="button" class="step-link" data-go="6" ${invalid !== -1 ? 'disabled title="Completá todas las etapas para ver tu resumen"' : ''} ${currentStep === 6 ? 'aria-current="step"' : ''}>
      <span class="step-num">↗</span>Mi resumen
    </button>`;
}

function missionScreen() {
  return `<div class="mission"><p class="eyebrow">El desafío de la escuela</p>
    <p>Imaginá una app para organizar <strong>actividades, avisos y entregas</strong>. Vas a decidir qué problema resolver, quién la usaría, sus tres funciones, cuál va primero y cómo la probarías.</p></div>
    <p class="label" id="mission-label">Elegí por dónde empezar</p>
    <p class="help">Son situaciones para explorar. Vos decidís qué solución proponer.</p>
    <div class="mission-grid" role="radiogroup" aria-labelledby="mission-label" aria-required="true" aria-describedby="error-mission">
      ${missions.map(mission => `<label class="mission-option">
        <input type="radio" data-answer="mission" name="mission" required aria-describedby="error-mission" value="${mission.id}" ${answers.mission === mission.id ? 'checked' : ''}>
        <span class="mission-top"><span class="mission-icon">${mission.icon}</span><strong>${mission.title}</strong></span>
        <span class="mission-copy">${mission.description}</span></label>`).join('')}
    </div>${choiceError('mission')}
    <button type="button" class="text-button random" id="random-mission">Elegir una misión al azar ↻</button>
    ${field('appName', 'Nombre de tu app', 'Inventá un nombre para tu idea.', 'Poné un nombre para tu proyecto, sin datos personales.', true)}
    <details class="example"><summary>¿Cómo es la experiencia?</summary>
      <p>Respondé desde tu dispositivo, a tu ritmo. Podés escribir ideas breves, usar las pistas y volver atrás para cambiar lo que quieras.</p>
      <p>Al final vas a ver tu resumen personal y una conclusión sobre lo que exploraste. No tenés que entregar nada ni crear una cuenta.</p>
      <p>Tus respuestas quedan en este navegador y no se envían a nadie.</p>
    </details>`;
}

function questionScreen(index) {
  switch (index) {
    case 0: return missionScreen();
    case 1: return (selectedMission() ? `<div class="mission-context"><strong>Tu misión: ${escapeHTML(selectedMission().title)}</strong><span>${escapeHTML(selectedMission().question)}</span></div>` : '')
      + field('problem', '¿Qué dificultad concreta tiene hoy la escuela?', '¿Qué sucede, a quién le pasa y en qué situación?', 'Describí el problema antes de pensar en botones o pantallas.')
      + field('impact', '¿Qué consecuencias tiene y cómo lo investigarías?', '¿Qué se pierde, se confunde o se demora? ¿A quién le preguntarías para comprobarlo?')
      + `<div class="tip"><strong>Una pista</strong>“La escuela no tiene una app” describe una ausencia. El problema explica qué les cuesta hacer a las personas.</div>
        <details class="example"><summary>Ver un ejemplo orientativo</summary><p>“Las fechas de entrega se informan por distintos medios y algunos estudiantes no encuentran la versión actualizada.” Es una hipótesis: todavía habría que confirmarla con estudiantes y docentes.</p></details>`;
    case 2: return field('users', '¿Quiénes usarían tu app y qué haría cada uno?', 'Usuario o rol → qué necesita → qué podría hacer en la app.', 'Pensá tanto en quien consulta la información como en quien la publica.')
      + `<div class="tip"><strong>Una pregunta clave</strong>¿Quién cargaría las actividades y los avisos? Si nadie mantiene la información, la app deja de ser útil.</div>
        <details class="example"><summary>Ver roles posibles</summary><p>Estudiantes, docentes y preceptores pueden tener necesidades distintas. Elegí los que correspondan a tu idea y contá qué harían.</p></details>`;
    case 3: return `<div class="idea-box"><p class="help">¿Necesitás una chispa? Tocá una idea y adaptala. Después explicá para qué sirve.</p>
        <div class="idea-chips">${functionIdeas.map(idea => `<button type="button" class="idea-chip" data-idea="${escapeHTML(idea)}">+ ${idea}</button>`).join('')}</div></div>`
      + [1, 2, 3].map(number => `<section class="function-card" aria-labelledby="fn${number}">
        <div class="function-head" id="fn${number}"><span class="function-badge">0${number}</span>Función ${number}</div>
        ${field('f' + number, '¿Qué se podrá hacer?', 'Empezá con un verbo: consultar, publicar, entregar…', '', true)}
        ${field('b' + number, '¿Quién la usaría y qué parte del problema resuelve?', 'Relacioná esta función con una necesidad de tus usuarios.')}</section>`).join('')
      + `<p class="hint">Elegí tres funciones diferentes. Un color o un logo son decisiones de diseño, pero no explican qué permite hacer la app.</p>`;
    case 4: return `<p class="label" id="priority-label">¿Qué función desarrollarías primero?</p>
        <div class="priority-grid" role="radiogroup" aria-labelledby="priority-label" aria-required="true" aria-describedby="error-priority">
          ${[1, 2, 3].map(number => `<label class="priority-option">
            <input type="radio" name="priority" data-answer="priority" required aria-describedby="error-priority" value="${number}" ${answers.priority === String(number) ? 'checked' : ''}>
            <span class="function-badge">0${number}</span><span>${escapeHTML(answers['f' + number].trim() || 'Función ' + number + ' · todavía sin definir')}</span></label>`).join('')}</div>${choiceError('priority')}`
      + field('reason', '¿Por qué esa función va primero?', '¿Qué necesidad atiende? ¿Es necesaria para las otras funciones? ¿Qué incluiría una primera versión sencilla?')
      + `<div class="tip"><strong>No hay una única elección correcta</strong>Podés priorizar por el valor para los usuarios, por una dependencia o por lo que te permite probar una idea con menos esfuerzo.</div>`;
    case 5: return field('scenario', '¿Qué tarea pedirías realizar y a qué tipo de usuarios?', 'Por ejemplo: pedir a estudiantes que encuentren la fecha de una entrega.', 'Podés probar con pantallas dibujadas antes de programar.')
      + `<div class="row">${numberField('participants', '¿Cuántas personas participarían?', 'De 1 a 50 personas. Usá un número entero.')}${numberField('successes', '¿Cuántas deberían completar la tarea?', 'Tu meta no puede superar la cantidad de participantes.')}</div>`
      + field('metric', '¿Qué observarías para decidir si funciona bien?', 'Por ejemplo: que encuentren la información sin ayuda, sin errores y en menos de un minuto.', 'Explicá las condiciones que observarías, además de cuántas personas completan la tarea.')
      + field('improve', '¿Qué harías si la prueba muestra un problema?', '¿Qué registrarías, qué cambiarías y cómo volverías a probarlo?')
      + `<details class="example"><summary>Ver un ejemplo de prueba</summary><p>Mostrar un prototipo a cinco estudiantes y pedirles que encuentren la próxima entrega. Meta inicial: al menos cuatro lo logran sin ayuda en menos de un minuto. Registrar dónde se traban, mejorar esa pantalla y repetir. Esa meta es una propuesta, no un resultado obtenido.</p></details>`;
    default: return summaryScreen();
  }
}

function answerItem(label, value) {
  return `<div class="answer-item"><p class="answer-label">${label}</p>
    <p>${escapeHTML(value?.trim() || 'Todavía no respondiste este punto.')}</p></div>`;
}

// El resumen reproduce lo escrito; la conclusión contextualiza sin calificar ni inventar resultados.
function conclusionScreen() {
  const completedQuestions = [1, 2, 3, 4, 5].filter(isComplete).length;
  const personalContext = selectedFunction()
    ? `<p>Elegiste <strong>“${escapeHTML(selectedFunction())}”</strong> como primer paso de tu app. Esa es una decisión de prioridad: elegir qué construir primero para empezar a resolver una necesidad.</p>`
    : `<p>Tu punto de partida es una necesidad de la escuela. Para convertirla en una solución, podés seguir definiendo a quién ayudarías y qué sería lo primero que construirías.</p>`;
  return `<section class="conclusion-card" aria-labelledby="conclusion-title">
    <p class="eyebrow">La idea que te llevás</p><h3 id="conclusion-title">Desarrollar software empieza antes del código.</h3>
    ${personalContext}
    <p>Entender el problema, conocer a los usuarios, diseñar funciones útiles y pensar cómo probarlas son partes del desarrollo de software. No alcanza con que una app se pueda programar: tiene que ayudar a alguien.</p>
    <p>Una propuesta se pone a prueba con personas. Lo que aprendés al observar cómo la usan te permite cambiar, volver a probar y mejorar. Después de programar, ese proceso continúa.</p>
    ${completedQuestions < 5 ? '<p class="conclusion-note">Todavía tenés algunas respuestas abiertas. Podés volver a ellas cuando quieras: revisar una idea también es parte de crear.</p>' : '<p class="conclusion-note">Lo que definiste es una propuesta para explorar, no una solución ya comprobada. Tu siguiente paso podría ser dibujar una pantalla y probarla con alguien.</p>'}
    <div class="process-strip" aria-label="Proceso de desarrollo"><span>Analizar</span><span>Diseñar</span><span>Probar</span><span>Mejorar</span><span>Programar</span></div>
    </section>`;
}

function summaryScreen() {
  const unanswered = steps.map((step, index) => ({ ...step, index })).filter(step => !isComplete(step.index));
  return `<div class="achievement"><span aria-hidden="true">✳</span><div><strong>${unanswered.length ? 'Tu idea está tomando forma.' : 'Este es tu recorrido.'}</strong><p>Lo que pensaste, reunido en un solo lugar.</p></div></div>
    ${unanswered.length ? `<details class="example pending-answers"><summary>Te quedan ${unanswered.length} ${unanswered.length === 1 ? 'etapa por explorar' : 'etapas por explorar'}</summary><div class="pending-links">${unanswered.map(step => `<button class="text-button" data-go="${step.index}">${step.name} →</button>`).join('')}</div></details>` : ''}
    <div class="print-only summary-print-brand"><img class="print-brand-logo" src="../ices-superior-transparente.png" alt="ICES Educación Superior" width="110" height="66"><div><strong>UNIVERSO ICES · Hackeá la solución</strong>Tecnicatura Superior en Desarrollo de Software</div></div>
    <div class="summary-tools no-print"><div class="summary-tool-buttons"><button type="button" class="button" id="save-idea">Guardar mi idea ↓</button><button type="button" class="button secondary" id="print-idea">Imprimir / PDF</button></div><p>Descargá una ficha para abrir sin conexión o usá Imprimir para guardarla como PDF. Tus respuestas no se envían a nadie.</p></div>
    ${hasAnswer('appName') ? `<div class="app-name summary-app-heading"><div><span>Tu app</span><h3>${escapeHTML(answers.appName)}</h3></div><button type="button" class="edit-answer no-print" data-edit="0" aria-label="Editar nombre y misión">Editar</button></div>` : ''}
    <p class="summary-intro">Este resumen muestra tus respuestas. Podés volver a cualquier paso y cambiarlas; se actualizará con lo que escribas.</p>
    <p class="mission-summary"><strong>Misión elegida:</strong> ${escapeHTML(selectedMission()?.title || 'Todavía no elegiste una misión.')}</p>
    <section class="answer">${answerHeading(1, '01 · El problema que querés resolver')}${answerItem('La dificultad', answers.problem)}${answerItem('Consecuencias y cómo investigarlo', answers.impact)}</section>
    <section class="answer">${answerHeading(2, '02 · Las personas que usarían tu app')}${answerItem('Usuarios y tareas', answers.users)}</section>
    <section class="answer">${answerHeading(3, '03 · Tus tres funciones')}${[1, 2, 3].map(number => `<div class="summary-function">${answerItem('Función ' + number, answers['f' + number])}${answerItem('A quién ayuda y para qué', answers['b' + number])}</div>`).join('')}</section>
    <section class="answer">${answerHeading(4, '04 · Tu primer paso')}${answerItem('La función que elegiste', selectedFunction())}${answerItem('Tu motivo', answers.reason)}</section>
    <section class="answer">${answerHeading(5, '05 · Cómo comprobarías tu idea')}${answerItem('La tarea y los usuarios', answers.scenario)}${answerItem('Participantes y meta', `${answers.successes} de ${answers.participants} personas deberían completar la tarea.`)}${answerItem('Qué observarías y cuál es tu meta', answers.metric)}${answerItem('Qué mejorarías y cómo volverías a probar', answers.improve)}</section>
    ${prototypeMarkup(answers)}
    ${conclusionScreen()}
    <section class="career-card"><p class="eyebrow">¿Te gustó pensar una solución?</p><h3>Esto también se aprende en la Tecnicatura Superior en Desarrollo de Software.</h3>
      <p>Somos estudiantes de <strong>2.º año de la Tecnicatura Superior en Desarrollo de Software</strong>. Si te dio curiosidad seguir creando, acercate al stand: podemos contarte qué aprendemos, mostrarte proyectos y orientarte para consultar por la inscripción.</p>
      <p class="career-question">¿Qué te gustaría aprender a crear?</p></section>`;
}

function answerHeading(index, title) {
  return `<div class="answer-heading"><h3>${title}</h3><button type="button" class="edit-answer no-print" data-edit="${index}" aria-label="Editar ${steps[index].name.toLocaleLowerCase('es')}">Editar</button></div>`;
}

async function embeddedLogo() {
  const logo = document.querySelector('.brand-logo');
  if (!logo) throw new Error('Logo no disponible');
  await logo.decode();
  if (!logo.naturalWidth || !logo.naturalHeight) throw new Error('Logo no disponible');
  const canvas = document.createElement('canvas');
  canvas.width = logo.naturalWidth;
  canvas.height = logo.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo preparar el logo');
  // Copia los píxeles y la transparencia originales, sin cambiar tamaño ni diseño.
  context.drawImage(logo, 0, 0);
  return canvas.toDataURL('image/png');
}

async function saveIdea() {
  if (firstInvalidStep(answers) !== -1) { navigate(6); return; }
  const snapshot = { ...answers };
  const mission = selectedMission()?.title || '';
  const button = $('save-idea');
  if (button.disabled) return;
  button.disabled = true;
  button.textContent = 'Preparando tu ficha…';
  try {
    const content = buildIdeaDocument(snapshot, mission, await embeddedLogo());
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = ideaFilename(snapshot.appName);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    notify('Tu ficha incluye el logo, tus respuestas y el boceto. Podés abrirla sin conexión.');
  } catch {
    notify('No pudimos preparar la ficha con el logo. Intentá de nuevo o usá Imprimir / PDF.');
  } finally {
    button.disabled = false;
    button.textContent = 'Guardar mi idea ↓';
  }
}

function render(focus = false) {
  editingFields.clear();
  updateNavigation();
  const isSummary = currentStep === 6;
  document.body.classList.toggle('showing-summary', isSummary);
  const step = steps[currentStep];
  $('view').innerHTML = `<div class="card-head">
    <p class="step-kicker">${isSummary ? 'Tu resumen personal' : `${currentStep === 0 ? 'Preparación' : `Desafío ${currentStep} / 5`} · ${step.time}`}</p>
    <h2>${isSummary ? 'Tu idea, de principio a fin.' : step.title}</h2>
    <p>${isSummary ? 'Un recorrido por tus decisiones y una conclusión para llevarte.' : step.description}</p>
    </div><div class="card-body"><div class="review-notice no-print" id="review-notice" role="status" hidden></div>${isSummary ? questionScreen(currentStep) : `${editingFromSummary ? '<p class="editing-note">Estás editando tu idea. Al terminar, podés volver directamente al resumen.</p>' : ''}<p class="required-note">Todos los campos de esta etapa son obligatorios.</p><div class="validation-summary" id="validation-summary" role="alert" hidden></div><form id="activity-form" novalidate>${questionScreen(currentStep)}</form>`}</div>`;
  $('actions').innerHTML = isSummary
    ? '<button class="button secondary" data-go="5">← Volver a mis respuestas</button><button class="button" data-go="0">Volver al inicio</button>'
    : `<button type="button" class="button secondary" data-go="${currentStep - 1}" ${currentStep === 0 ? 'disabled' : ''}>← Anterior</button>
      <button type="submit" form="activity-form" class="button">${editingFromSummary ? 'Guardar y volver al resumen' : currentStep === 0 ? 'Empezar el desafío' : currentStep === 5 ? 'Ver mi resumen' : 'Siguiente'} →</button>`;
  refreshFeedback();
  animateView();
  if (focus) $('workspace').focus({ preventScroll: true });
}

function navigate(index) {
  if (!Number.isInteger(index) || index < 0 || index > 6) return;
  if (index > currentStep) editingFields.clear();
  const permitted = allowedStep(index, answers);
  if (index > currentStep && permitted < index) {
    currentStep = permitted;
    attemptedSteps.add(currentStep);
    (stepFields[currentStep] || []).forEach(key => touched.add(key));
    persist();
    render();
    focusField(Object.keys(errorsForStep(currentStep, answers))[0]);
    notify('Revisá los campos marcados antes de continuar.');
    return;
  }
  if (index > currentStep && isComplete(currentStep)) reviewSteps.delete(currentStep);
  currentStep = index;
  if (index === 6) editingFromSummary = false;
  persist();
  render(true);
  $('workspace').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}

document.addEventListener('click', event => {
  if (event.target.closest('#save-idea')) { saveIdea(); return; }
  if (event.target.closest('#print-idea')) { window.print(); return; }
  const editButton = event.target.closest('[data-edit]');
  if (editButton && /^[0-5]$/.test(editButton.dataset.edit)) {
    editingFromSummary = true;
    navigate(Number(editButton.dataset.edit));
    return;
  }
  if (event.target.closest('#confirm-review')) {
    editingFields.clear();
    const errors = errorsForStep(currentStep, answers);
    if (Object.keys(errors).length) {
      attemptedSteps.add(currentStep);
      refreshFeedback();
      focusField(Object.keys(errors)[0]);
    } else {
      reviewSteps.delete(currentStep);
      persist();
      updateNavigation();
      refreshReview();
      notify('Etapa revisada. Tus respuestas siguen guardadas.');
    }
    return;
  }
  const focusButton = event.target.closest('[data-focus]');
  if (focusButton) { focusField(focusButton.dataset.focus); return; }
  const idea = event.target.closest('[data-idea]');
  if (idea) {
    if (!functionIdeas.includes(idea.dataset.idea) || currentStep !== 3) return;
    if (['f1', 'f2', 'f3'].some(key => answers[key].trim().toLocaleLowerCase('es') === idea.dataset.idea.toLocaleLowerCase('es'))) {
      notify('Esa idea ya está entre tus funciones. Elegí una diferente.'); return;
    }
    const emptyNumber = [1, 2, 3].find(number => !hasAnswer('f' + number));
    if (!emptyNumber) { notify('Ya tenés tres funciones. Podés editarlas directamente.'); return; }
    setAnswer('f' + emptyNumber, idea.dataset.idea);
    touched.add('f' + emptyNumber);
    persist();
    render();
    $('b' + emptyNumber).focus();
    notify('Idea agregada. Contá a quién ayuda y para qué.');
    return;
  }
  if (event.target.closest('#random-mission')) {
    setAnswer('mission', randomMission(answers.mission));
    touched.add('mission');
    persist();
    render();
    document.querySelector('input[name="mission"]:checked')?.focus();
    return;
  }
  const navigationButton = event.target.closest('[data-go]');
  if (navigationButton && /^[0-6]$/.test(navigationButton.dataset.go)) navigate(Number(navigationButton.dataset.go));
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'activity-form') return;
  event.preventDefault();
  navigate(editingFromSummary ? 6 : currentStep + 1);
});

function updateAnswer(event) {
  const key = event.target.dataset.answer;
  if (!answerKeys.includes(key)) return;
  setAnswer(key, event.target.value);
  if (event.target.type === 'radio') touched.add(key);
  else if (event.type === 'input') editingFields.add(key);
  persist();
  updateNavigation();
  refreshFeedback();
}
$('view').addEventListener('input', updateAnswer);
$('view').addEventListener('change', updateAnswer);
$('view').addEventListener('focusout', event => {
  const key = event.target.dataset.answer;
  if (!answerKeys.includes(key)) return;
  if (event.target.type === 'radio') return;
  const value = normalizeText(event.target.value).trim();
  setAnswer(key, value);
  if (event.target.type !== 'radio') event.target.value = value;
  touched.add(key);
  editingFields.delete(key);
  persist();
  updateNavigation();
  refreshFeedback();
});
$('reset').onclick = () => $('reset-dialog').showModal();
$('cancel-reset').onclick = () => $('reset-dialog').close();
$('confirm-reset').onclick = () => {
  answers = cleanAnswers({});
  currentStep = 0;
  touched.clear();
  attemptedSteps.clear();
  editingFields.clear();
  reviewSteps.clear();
  editingFromSummary = false;
  persist();
  render();
  $('reset-dialog').close();
  $('workspace').focus({ preventScroll: true });
  $('workspace').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  notify('Tu experiencia está lista para empezar de nuevo.');
};

// Evita que los botones flotantes se superpongan al teclado del celular.
function updateKeyboardLayout() {
  const focused = document.activeElement;
  const editing = focused?.matches('input:not([type=radio]), textarea, select');
  const keyboardOpen = Boolean(editing && window.visualViewport
    && window.visualViewport.height < window.innerHeight - 120);
  document.documentElement.classList.toggle('keyboard-open', keyboardOpen);
}
window.visualViewport?.addEventListener('resize', updateKeyboardLayout);
document.addEventListener('focusin', updateKeyboardLayout);
document.addEventListener('focusout', () => requestAnimationFrame(updateKeyboardLayout));

render();
persist();
