import { normalizeText, firstInvalidStep } from './validation.js';
import { missions, functionTitle, problemFor, audienceFor, selectedOption, proposalFor } from './journey.js';
import { sheetTheme } from './sheet-theme.js';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
export function randomMission(current, random = Math.random) {
  const options = missions.filter(m => m.id !== current);
  return options[Math.min(options.length - 1, Math.max(0, Math.floor(random() * options.length)))].id;
}
export function ideaFilename(name) {
  const base = normalizeText(name).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/g, '');
  return `mi-idea-${base || 'universo-ices'}.html`;
}
const optionText = (key, a) => { const o = selectedOption(key, a); return o ? `${o.title}. ${o.detail}` : ''; };
export function answerRows(a) {
  return [
    { label: 'Nombre de tu app', value: a.appName, step: 0 },
    { label: 'Problema que querés resolver', value: problemFor(a), step: 0 },
    { label: 'Personas y rol', value: `${audienceFor(a)}. ${optionText('audience', a)}`, step: 1 },
    { label: 'Tres funciones', value: a.functions.map((id, i) => `${i + 1}. ${functionTitle(id, a)}`).join('\n'), step: 2 },
    { label: 'Primera función y motivo', value: `${functionTitle(a.mainFunction, a)}. ${optionText('reason', a)}`, step: 3 },
    { label: 'Diseño de la primera versión', value: optionText('mode', a), step: 4 },
    { label: 'Prueba y meta propuestas', value: `${optionText('test', a)}\nParticipantes: ${a.participants}. Meta: al menos ${a.target} de ${a.participants} completan la tarea sin ayuda sobre el diseño. Es un plan; todavía no se realizó.`, step: 5 },
    { label: 'Mejora propuesta', value: optionText('improve', a), step: 6 },
    ...(a.note.trim() ? [{ label: 'Tu toque personal', value: a.note, step: 6 }] : [])
  ];
}
export function ideaText(a) {
  if (firstInvalidStep(a) !== -1) throw new Error('Completá tu idea antes de copiarla.');
  return `${a.appName} · Universo ICES\n\n${answerRows(a).map(row => `${row.label}\n${row.value}`).join('\n\n')}\n\nAnalizar → Diseñar → Probar → Mejorar → Programar.\nPropuesta para seguir explorando; no son resultados de una prueba realizada.\nTecnicatura Superior en Desarrollo de Software · ICES Educación Superior`;
}
export function prototypeMarkup(a) {
  const p = proposalFor(a);
  if (!p) return '';
  return `<section class="prototype-preview" aria-labelledby="prototype-title"><div class="prototype-description"><p class="eyebrow">Del análisis al diseño</p><h3 id="prototype-title">Tus tres funciones, una para empezar.</h3><p>La primera aparece destacada. Es un boceto ilustrativo: no es una app construida y sus controles no realizan acciones.</p><p>Dibujá cómo se vería la primera pantalla y usala para la prueba que elegiste.</p></div><div class="phone-mockup" role="group" aria-label="Boceto ilustrativo de las tres funciones"><div class="phone-camera" aria-hidden="true"></div><div class="phone-screen"><p class="phone-eyebrow">Tu futura app</p><h4>${escapeHTML(a.appName)}</h4><ol class="prototype-functions">${p.screens.map((text, i) => `<li class="prototype-function ${i === 0 ? 'prototype-primary' : ''}"><span class="prototype-number">0${i + 1}</span><div><strong>${escapeHTML(text)}</strong><span class="prototype-first">${i === 0 ? 'Primera versión' : 'Para más adelante'}</span></div></li>`).join('')}</ol><p class="phone-caption">Ilustración · sin interacción</p></div></div></section>`;
}
export function proposalMarkup(a) {
  const p = proposalFor(a);
  if (!p) return '';
  return `<section class="personal-result" aria-labelledby="result-title"><p class="eyebrow">Conclusión de tu recorrido</p><h3 id="result-title">Tu idea tiene un punto de partida.</h3><p>${escapeHTML(p.firstVersion)}</p><h4>Cómo comprobarla</h4><p>${escapeHTML(p.test)}</p><p>${escapeHTML(p.observe)}</p><h4>Después de observar</h4><p>${escapeHTML(p.improve)}</p><p class="conclusion-note">Esta propuesta combina tus elecciones; no interpreta automáticamente tu texto ni evalúa tu idea. La prueba todavía no se realizó. Tu comentario personal sirve para adaptar el plan.</p><p class="process-strip">Analizar → Diseñar → Probar → Mejorar → Programar</p></section>`;
}
export const careerMarkup = `<section class="career-card"><p class="eyebrow">Esto también es desarrollar software</p><h3>Hoy analizaste, elegiste y pensaste cómo probar.</h3><p>En la <strong>Tecnicatura Superior en Desarrollo de Software</strong> aprendemos a transformar necesidades en soluciones: analizar problemas, diseñar interfaces, programar, probar y mejorar.</p><p>Somos estudiantes de 2.º año. <strong>Acercate al stand de ICES Educación Superior</strong> para ver proyectos, conversar sobre la carrera y consultar por la inscripción.</p><p class="career-question">¿Qué te gustaría aprender a crear?</p></section>`;
export function buildIdeaDocument(a, missionTitle, logoDataUrl) {
  if (firstInvalidStep(a) !== -1) throw new Error('Completá las decisiones antes de guardar.');
  if (typeof logoDataUrl !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(logoDataUrl)) throw new Error('No se pudo incluir el logo.');
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHTML(a.appName)} · Mi idea · Universo ICES</title><style>${sheetTheme}
  *{overflow-wrap:anywhere}.personal-result{background:#eaf7fd;border:1px solid #b4daeb;border-radius:16px;padding:24px;margin:24px 0}.personal-result h3,.career-card h3{font-size:25px;line-height:1.3}.personal-result h4{margin-bottom:4px}.conclusion-note{border-top:1px solid #baddeb;padding-top:12px;font-size:13px}.career-card{background:#123b5a;color:white;border-radius:16px;padding:24px;margin:24px 0}.career-card .eyebrow{color:#b9eafa}.sheet-section h2{font-size:19px}@media print{.personal-result,.career-card{break-inside:auto}.career-card{color:black;background:white;border:1px solid #777}}
  </style></head><body><header class="sheet-topbar"><div class="sheet-topbar-inner"><div class="sheet-brand"><img class="sheet-logo" src="${logoDataUrl}" alt="ICES Educación Superior" width="132" height="70"><div class="sheet-brand-copy"><strong class="sheet-brand-name">UNIVERSO ICES</strong><span class="sheet-degree">Tecnicatura Superior en Desarrollo de Software</span></div></div></div></header><main class="sheet-wrap"><section class="sheet-hero"><div><p class="eyebrow">Laboratorio de ideas · Mi ficha</p><h1>Hackeá <em>la solución.</em></h1><p>Tu propuesta completa, para seguir creando.</p></div></section><section class="sheet-overview"><div class="sheet-overview-body"><p class="sheet-app-label">Tu app</p><h2 class="sheet-app-name">${escapeHTML(a.appName)}</h2><p>Misión: ${escapeHTML(missionTitle)}</p><p class="sheet-read-note">Esta ficha se puede abrir sin conexión. Usá la impresión de tu navegador para guardarla como PDF. Conserva tu idea; no permite reanudar la actividad.</p></div></section><h2>Todas tus respuestas</h2><div class="sheet-grid">${answerRows(a).map((row, i) => `<section class="sheet-section"><div class="sheet-section-head"><span class="sheet-section-number">${i + 1}</span><h2>${escapeHTML(row.label)}</h2></div><div class="sheet-section-body"><div class="sheet-answer"><p>${escapeHTML(row.value)}</p></div></div></section>`).join('')}</div>${proposalMarkup(a)}${prototypeMarkup(a)}${careerMarkup}<footer class="sheet-footer"><p>Analizar → Diseñar → Probar → Mejorar → Programar</p><p>Estudiantes de 2.º año · ICES Educación Superior</p></footer></main></body></html>`;
}
