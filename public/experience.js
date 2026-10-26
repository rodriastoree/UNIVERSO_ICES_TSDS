import { normalizeText, firstInvalidStep } from './validation.js';
import { missions, choiceFields, prompts, selectedOption, proposalFor } from './journey.js';
import { sheetTheme } from './sheet-theme.js';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
export function randomMission(current, random = Math.random) {
  const options = missions.filter(m => m.id !== current);
  return options[Math.min(options.length - 1, Math.max(0, Math.floor(random() * options.length)))].id;
}
export function ideaFilename(name) {
  const base = normalizeText(name).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/g, '');
  return `mi-idea-${base || 'universo-ices'}.html`;
}
export function answerRows(answers) {
  return [
    { label: 'Nombre de tu app', value: answers.appName, step: 0 },
    { label: 'Misión', value: missions.find(m => m.id === answers.mission)?.title || '', step: 0 },
    ...(answers.mission === 'propia' ? [{ label: 'Tu situación', value: answers.customSituation, step: 0 }] : []),
    ...choiceFields.map((key, index) => { const option = selectedOption(key, answers);
      return { label: prompts[key], value: option ? `${option.title}. ${option.detail}` : '', step: index + 1 }; }),
    { label: 'Tu toque personal (opcional)', value: answers.note.trim() || 'No agregaste un comentario.', step: 5 }
  ];
}
export function prototypeMarkup(answers) {
  const proposal = proposalFor(answers);
  if (!proposal) return '';
  return `<section class="prototype-preview" aria-labelledby="prototype-title">
    <div class="prototype-description"><p class="eyebrow">De tus elecciones a una pantalla</p><h3 id="prototype-title">Así podría empezar tu app.</h3>
    <p>Este boceto reúne tu función principal, el enfoque que elegiste y una tarea para probar. Es una ilustración: los controles dibujados no realizan acciones.</p>
    <p class="prototype-note">Dibujá cómo se vería esta primera pantalla y comprobá si se entiende.</p></div>
    <div class="phone-mockup" role="group" aria-label="Boceto ilustrativo de tu app"><div class="phone-camera" aria-hidden="true"></div>
    <div class="phone-screen"><p class="phone-eyebrow">Mi primera app</p><h4>${escapeHTML(answers.appName)}</h4><p class="phone-welcome">Tu idea empieza por acá</p>
    <ol class="prototype-functions">${proposal.screens.map((text, index) => `<li class="prototype-function ${index === 0 ? 'prototype-primary' : ''}"><span class="prototype-number">0${index + 1}</span><div><strong>${escapeHTML(text)}</strong><span class="prototype-first">${['Acción principal', 'Tu enfoque', 'Tarea para probar'][index]}</span></div></li>`).join('')}</ol>
    <p class="phone-caption">Boceto ilustrativo · sin interacción</p></div></div></section>`;
}
export function proposalMarkup(answers) {
  const proposal = proposalFor(answers);
  if (!proposal) return '';
  const item = (title, text) => `<div class="answer-item"><h4>${title}</h4><p>${escapeHTML(text)}</p></div>`;
  return `<section class="conclusion-card personal-result" aria-labelledby="result-title"><p class="eyebrow">Propuesta según tus decisiones</p>
    <h3 id="result-title">${escapeHTML(proposal.title)}</h3><p class="result-lead">${escapeHTML(proposal.concept)}</p>
    ${proposal.situation ? item('La situación de la que partís', proposal.situation) : ''}${item('Tu primera versión', proposal.firstVersion)}${item('Una prueba para empezar', proposal.test)}${item('Qué observar', proposal.observe)}${item('Tu siguiente mejora', proposal.improve)}
    <p class="conclusion-note">Estas sugerencias se arman a partir de tus elecciones. No son una evaluación ni resultados de una prueba realizada. Tu comentario personal se conserva en el resumen y podés usarlo para adaptar la propuesta.</p>
    <div class="process-strip" aria-label="Proceso de desarrollo"><span>Analizar</span><span>Diseñar</span><span>Probar</span><span>Mejorar</span><span>Programar</span></div></section>`;
}
export const careerMarkup = `<section class="career-card"><p class="eyebrow">¿Te gustó pensar una solución?</p><h3>Esto también se aprende en la Tecnicatura Superior en Desarrollo de Software.</h3>
  <p>Somos estudiantes de <strong>2.º año de la Tecnicatura Superior en Desarrollo de Software</strong>. Acercate al stand para conocer qué aprendemos, ver proyectos y consultar por la inscripción.</p><p class="career-question">¿Qué te gustaría aprender a crear?</p></section>`;
export function buildIdeaDocument(answers, missionTitle, logoDataUrl) {
  if (firstInvalidStep(answers) !== -1) throw new Error('Completá las decisiones antes de guardar.');
  if (typeof logoDataUrl !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(logoDataUrl)) throw new Error('No se pudo incluir el logo.');
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>${escapeHTML(answers.appName)} · Mi idea · Universo ICES</title><style>${sheetTheme}
  .personal-result{margin:28px 0;padding:28px;border:1px solid #b4daeb;border-radius:16px;background:#eaf7fd}.personal-result h3{font-size:28px;line-height:1.2}.personal-result h4{margin-bottom:4px}.personal-result p{overflow-wrap:anywhere}.career-card{padding:28px;border-radius:16px;background:#123b5a;color:white;margin-top:24px}.career-card h3{font-size:24px;line-height:1.3}.process-strip{display:flex;flex-wrap:wrap;gap:8px}.process-strip span{border:1px solid #baddeb;border-radius:20px;padding:5px 10px;font-size:12px}@media(max-width:640px){.personal-result,.career-card{padding:20px}}@media print{.personal-result,.career-card{break-inside:auto}}
  </style></head><body><header class="sheet-topbar"><div class="sheet-topbar-inner"><div class="sheet-brand"><img class="sheet-logo" src="${logoDataUrl}" alt="ICES Educación Superior" width="132" height="76"><div class="sheet-brand-copy"><strong class="sheet-brand-name">UNIVERSO ICES</strong><span class="sheet-degree">Tecnicatura Superior en Desarrollo de Software</span></div></div><span class="sheet-topnote">Tu idea, de principio a fin</span></div></header>
  <main class="sheet-wrap"><section class="sheet-hero"><div><p class="eyebrow">Laboratorio de ideas · Mi recorrido</p><h1>Hackeá <em>la solución.</em></h1><p class="sheet-intro">Tus elecciones y una propuesta para seguir creando.</p><div class="sheet-tags"><span>Mi ficha personal</span><span>Desde tu dispositivo</span><span>Para seguir creando</span></div></div><div class="sheet-art" aria-hidden="true"><div class="sheet-art-square">{&nbsp;}</div><span class="sheet-art-star">✳</span><span class="sheet-art-tag">PENSAR → CREAR → PROBAR</span></div></section>
  <section class="sheet-overview"><div class="sheet-overview-body"><p class="sheet-app-label">Tu app</p><h2 class="sheet-app-name">${escapeHTML(answers.appName)}</h2><div class="sheet-mission"><span>Misión elegida</span><strong>${escapeHTML(missionTitle)}</strong></div><p class="sheet-read-note">Podés abrir esta ficha sin conexión o usar Imprimir para guardarla como PDF.</p></div></section>
  ${proposalMarkup(answers)}<h2>Todas tus respuestas</h2><div class="sheet-grid">${answerRows(answers).map((row, index) => `<section class="sheet-section"><div class="sheet-section-head"><span class="sheet-section-number">${String(index + 1).padStart(2, '0')}</span><h2>${escapeHTML(row.label)}</h2></div><div class="sheet-section-body"><div class="sheet-answer"><p>${escapeHTML(row.value)}</p></div></div></section>`).join('')}</div>
  ${prototypeMarkup(answers)}${careerMarkup}<footer class="sheet-footer"><p>Analizar → Diseñar → Probar → Mejorar → Programar</p><p>Estudiantes de 2.º año · Tecnicatura Superior en Desarrollo de Software · ICES Educación Superior</p></footer></main></body></html>`;
}
