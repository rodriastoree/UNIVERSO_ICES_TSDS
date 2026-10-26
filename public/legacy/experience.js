import { missionIds, stepFields, normalizeText, parseSaved } from './validation.js';
import { sheetTheme } from '../sheet-theme.js';

const nonempty = value => typeof value === 'string' && Boolean(value.trim());
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

// Los avisos señalan relaciones entre decisiones; no califican las ideas.
export function affectedReviewSteps(key, before, after) {
  if (!nonempty(before[key]) || normalizeText(before[key]).trim() === normalizeText(after[key]).trim()) return [];
  let candidates = [];
  if (key === 'mission') candidates = [1, 2, 3, 4, 5];
  else if (['problem', 'impact'].includes(key)) candidates = [2, 3, 4, 5];
  else if (key === 'users') candidates = [3, 4, 5];
  else if (/^[fb][123]$/.test(key)) candidates = [4, 5];
  else if (key === 'priority') candidates = [4, 5];
  else if (key === 'reason') candidates = [5];
  return candidates.filter(index => stepFields[index].some(field => nonempty(after[field])));
}

export function restoreExperience(raw) {
  const saved = parseSaved(raw);
  let metadata;
  try { metadata = JSON.parse(raw); } catch { metadata = null; }
  const reviewSteps = Array.isArray(metadata?._review)
    ? [...new Set(metadata._review.filter(index => Number.isInteger(index) && index >= 1 && index <= 5
      && stepFields[index].some(key => nonempty(saved.answers[key]))))]
    : [];
  return { ...saved, reviewSteps, editingFromSummary: metadata?._editingFromSummary === true && saved.step < 6 };
}

export function randomMission(current, random = Math.random) {
  const options = missionIds.filter(id => id !== current);
  return options[Math.min(options.length - 1, Math.max(0, Math.floor(random() * options.length)))];
}

export function ideaFilename(name) {
  const base = normalizeText(name).normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/g, '');
  return `mi-idea-${base || 'universo-ices'}.html`;
}

export function prototypeMarkup(answers) {
  const priority = ['1', '2', '3'].includes(answers.priority) ? answers.priority : '';
  return `<section class="prototype-preview" aria-labelledby="prototype-title">
    <div class="prototype-description"><p class="eyebrow">De la idea a una pantalla</p>
    <h3 id="prototype-title">Así podría empezar tu app.</h3>
    <p>Tu nombre y tus tres funciones, reunidos en un boceto. Es una ilustración para imaginar el diseño; los controles dibujados no realizan acciones.</p>
    <p class="prototype-note">El siguiente paso: dibujar más pantallas y probar si otras personas entienden cómo usarlas.</p></div>
    <div class="phone-mockup" role="group" aria-label="Boceto ilustrativo de tu app">
      <div class="phone-camera" aria-hidden="true"></div>
      <div class="phone-screen"><p class="phone-eyebrow">Mi primera app</p><h4>${escape(answers.appName)}</h4>
      <p class="phone-welcome">¿Qué necesitás hacer?</p>
      <ol class="prototype-functions">${[1, 2, 3].map(number => `<li class="prototype-function ${priority === String(number) ? 'prototype-primary' : ''}">
        <span class="prototype-number" aria-hidden="true">0${number}</span><div><strong>${escape(answers['f' + number])}</strong>
        ${priority === String(number) ? '<span class="prototype-first">Tu primer paso</span>' : ''}</div><span aria-hidden="true">↗</span></li>`).join('')}</ol>
      <p class="phone-caption">Boceto ilustrativo · sin interacción</p></div>
    </div></section>`;
}

// Ficha autónoma: logo incluido, sin scripts ni recursos remotos.
export function buildIdeaDocument(answers, missionTitle, logoDataUrl) {
  if (typeof logoDataUrl !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(logoDataUrl)) {
    throw new Error('No se pudo incluir el logo en la ficha.');
  }
  const item = (label, value) => `<div class="sheet-answer"><h3>${label}</h3><p>${escape(value)}</p></div>`;
  const section = (number, title, content, wide = false) => `<section class="sheet-section${wide ? ' sheet-section-wide' : ''}"><div class="sheet-section-head"><span class="sheet-section-number">${number}</span><h2>${title}</h2></div><div class="sheet-section-body">${content}</div></section>`;
  const first = ['1', '2', '3'].includes(answers.priority) ? answers['f' + answers.priority] : '';
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
    <title>${escape(answers.appName)} · Mi idea · Universo ICES</title>
    <style>${sheetTheme}</style></head><body>
    <header class="sheet-topbar"><div class="sheet-topbar-inner"><div class="sheet-brand">
      <img class="sheet-logo" src="${logoDataUrl}" alt="ICES Educación Superior" width="132" height="76">
      <div class="sheet-brand-copy"><strong class="sheet-brand-name">UNIVERSO ICES</strong><span class="sheet-degree">Tecnicatura Superior en Desarrollo de Software</span></div></div><span class="sheet-topnote">Tu idea, de principio a fin</span></div></header>
    <main class="sheet-wrap"><section class="sheet-hero" aria-labelledby="sheet-title"><div>
      <p class="eyebrow">Laboratorio de ideas · Mi recorrido</p><h1 id="sheet-title">Hackeá <em>la solución.</em></h1>
      <p class="sheet-intro">De una necesidad de tu escuela a una propuesta de app. Este es el recorrido que imaginaste.</p>
      <div class="sheet-tags"><span>Mi ficha personal</span><span>Desde tu dispositivo</span><span>Para seguir creando</span></div></div>
      <div class="sheet-art" aria-hidden="true"><div class="sheet-art-square">{&nbsp;}</div><span class="sheet-art-star">✳</span><span class="sheet-art-tag">PENSAR → CREAR → PROBAR</span></div></section>
    <section class="sheet-overview" aria-labelledby="sheet-app-name"><div class="sheet-achievement"><span aria-hidden="true">✳</span><div><strong>Este es tu recorrido.</strong><p>Lo que pensaste, reunido en un solo lugar.</p></div></div>
      <div class="sheet-overview-body"><p class="sheet-app-label">Tu app</p><h2 class="sheet-app-name" id="sheet-app-name">${escape(answers.appName)}</h2>
      <div class="sheet-mission"><span>Misión elegida</span><strong>${escape(missionTitle)}</strong></div>
      <p class="sheet-read-note">Esta ficha conserva tus respuestas y tu boceto. Podés abrirla sin conexión o usar Imprimir para guardarla como PDF.</p></div></section>
    <div class="sheet-grid">
      ${section('01', 'El problema', item('La dificultad', answers.problem) + item('Consecuencias y cómo investigarlo', answers.impact))}
      ${section('02', 'Las personas', item('Usuarios y tareas', answers.users))}
      ${section('03', 'Tus tres funciones', `<div class="sheet-functions">${[1, 2, 3].map(number => `<article class="sheet-function"><p class="sheet-function-label">FUNCIÓN 0${number}</p><h3>${escape(answers['f' + number])}</h3><small>A quién ayuda y para qué</small><p>${escape(answers['b' + number])}</p></article>`).join('')}</div>`, true)}
      ${section('04', 'Tu primer paso', item('La función que elegiste', first) + item('Tu motivo', answers.reason), true)}
      ${section('05', 'Cómo comprobarías tu idea', item('La tarea y los usuarios', answers.scenario) + `<div class="sheet-test-meta"><span><strong>${escape(answers.participants)}</strong> participantes</span><span>Meta: <strong>${escape(answers.successes)} de ${escape(answers.participants)} personas</strong></span></div>` + item('Qué observarías y cuál es tu meta', answers.metric) + item('Qué mejorarías y cómo volverías a probar', answers.improve), true)}
    </div>
    ${prototypeMarkup(answers)}
    <section class="sheet-conclusion"><p class="eyebrow">La idea que te llevás</p><h2>Desarrollar software empieza antes del código.</h2>
      <p>Elegiste <strong>“${escape(first)}”</strong> como primer paso de tu app. Esa es una decisión de prioridad: elegir qué construir primero para empezar a resolver una necesidad.</p>
      <p>Entender el problema, conocer a los usuarios, diseñar funciones útiles y pensar cómo probarlas son partes del desarrollo de software. No alcanza con que una app se pueda programar: tiene que ayudar a alguien.</p>
      <p>Una propuesta se pone a prueba con personas. Lo que aprendés al observar cómo la usan te permite cambiar, volver a probar y mejorar. Después de programar, ese proceso continúa.</p>
      <p>Lo que definiste es una propuesta para explorar, no una solución ya comprobada. Tu siguiente paso podría ser dibujar una pantalla y probarla con alguien.</p>
      <div class="sheet-process" aria-label="Proceso de desarrollo"><span>Analizar</span><span>Diseñar</span><span>Probar</span><span>Mejorar</span><span>Programar</span></div></section>
    <section class="sheet-career"><p class="eyebrow">¿Te gustó pensar una solución?</p><h2>Esto también se aprende en la Tecnicatura Superior en Desarrollo de Software.</h2>
      <p>Somos estudiantes de <strong>2.º año de la Tecnicatura Superior en Desarrollo de Software</strong>. Si te dio curiosidad seguir creando, acercate al stand: podemos contarte qué aprendemos, mostrarte proyectos y orientarte para consultar por la inscripción.</p>
      <p class="sheet-career-question">¿Qué te gustaría aprender a crear?</p></section>
    <footer class="sheet-footer"><p>Analizar → Diseñar → Probar → Mejorar → Programar</p><p>Una experiencia creada por estudiantes de 2.º año · Tecnicatura Superior en Desarrollo de Software · ICES Educación Superior</p></footer>
    </main></body></html>`;
}
