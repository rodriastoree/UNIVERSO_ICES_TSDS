// Reglas compartidas por los formularios, el guardado local y las pruebas.
// Controlan formato y coherencia básica; no califican el contenido de una idea.
export const missionIds = ['entregas', 'avisos', 'actividades', 'propia'];
export const fieldRules = {
  appName: { label: 'Nombre de tu app', type: 'text', min: 3, max: 60, letters: 2, words: 1, singleLine: true },
  mission: { label: 'Misión', type: 'choice', values: missionIds },
  problem: { label: 'Problema', type: 'text', min: 20, max: 800, letters: 10, words: 4 },
  impact: { label: 'Consecuencias e investigación', type: 'text', min: 20, max: 800, letters: 10, words: 4 },
  users: { label: 'Usuarios y tareas', type: 'text', min: 20, max: 800, letters: 10, words: 4 },
  f1: { label: 'Función 1', type: 'text', min: 5, max: 100, letters: 4, words: 1, singleLine: true },
  b1: { label: 'Utilidad de la función 1', type: 'text', min: 15, max: 500, letters: 8, words: 3 },
  f2: { label: 'Función 2', type: 'text', min: 5, max: 100, letters: 4, words: 1, singleLine: true },
  b2: { label: 'Utilidad de la función 2', type: 'text', min: 15, max: 500, letters: 8, words: 3 },
  f3: { label: 'Función 3', type: 'text', min: 5, max: 100, letters: 4, words: 1, singleLine: true },
  b3: { label: 'Utilidad de la función 3', type: 'text', min: 15, max: 500, letters: 8, words: 3 },
  priority: { label: 'Primera función', type: 'choice', values: ['1', '2', '3'] },
  reason: { label: 'Motivo de la prioridad', type: 'text', min: 20, max: 800, letters: 10, words: 4 },
  scenario: { label: 'Tarea de la prueba', type: 'text', min: 20, max: 800, letters: 10, words: 4 },
  participants: { label: 'Personas participantes', type: 'integer', min: 1, max: 50 },
  successes: { label: 'Personas que deben completar la tarea', type: 'integer', min: 1, max: 50 },
  metric: { label: 'Criterio de la prueba', type: 'text', min: 15, max: 500, letters: 8, words: 3 },
  improve: { label: 'Mejora y nueva prueba', type: 'text', min: 20, max: 800, letters: 10, words: 4 }
};
export const stepFields = [
  ['mission', 'appName'], ['problem', 'impact'], ['users'],
  ['f1', 'b1', 'f2', 'b2', 'f3', 'b3'], ['priority', 'reason'],
  ['scenario', 'participants', 'successes', 'metric', 'improve']
];

const invisibleCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\p{Cf}]/u;
export function normalizeText(value) {
  return typeof value === 'string'
    ? value.normalize('NFC').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ')
    : '';
}
export function comparableText(value) {
  return normalizeText(value).normalize('NFD').replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

export function validateField(key, value, answers = {}) {
  const rule = fieldRules[key];
  if (!rule) return 'Campo no reconocido.';
  if (typeof value !== 'string') return 'Completá este campo con un valor válido.';
  const text = normalizeText(value).trim();
  if (!text) return rule.type === 'choice' ? 'Elegí una opción para continuar.' : 'Completá este campo para continuar.';
  if (rule.type === 'choice') {
    if (value !== text || !rule.values.includes(text)) return 'Elegí una de las opciones disponibles.';
    if (key === 'priority' && validateField('f' + text, answers['f' + text], answers)) {
      return 'Primero completá correctamente la función que querés elegir.';
    }
    return '';
  }
  if (rule.type === 'integer') {
    if (!/^[0-9]{1,2}$/.test(value)) return 'Usá solo números enteros, sin letras, signos ni decimales.';
    const number = Number(text);
    if (number < rule.min || number > rule.max) return `Ingresá un número entero entre ${rule.min} y ${rule.max}.`;
    if (key === 'successes') {
      if (validateField('participants', answers.participants, answers)) return 'Primero indicá una cantidad válida de participantes.';
      if (number > Number(answers.participants)) return 'La meta no puede superar la cantidad de participantes.';
    }
    return '';
  }
  if (invisibleCharacters.test(text)) return 'Quitá los caracteres invisibles o de control que se pegaron en la respuesta.';
  if (rule.singleLine && /[\n\t]/.test(text)) return 'Escribí este dato en una sola línea.';
  if (/<\/?[a-z][^>]*>/i.test(text)) return 'Escribí una respuesta en texto, sin etiquetas HTML.';
  if (/^(?:https?:\/\/|www\.)\S+$/i.test(text)) return 'Explicá tu idea con palabras; un enlace solo no alcanza.';
  const compact = text.replace(/\s+/g, ' ');
  if (compact.length < rule.min) return `Desarrollá un poco más la respuesta: al menos ${rule.min} caracteres, sin contar espacios repetidos.`;
  if (text.length > rule.max) return `Acortá la respuesta a ${rule.max} caracteres como máximo.`;
  const letters = text.match(/\p{L}/gu) || [];
  if (letters.length < rule.letters) return 'Escribí una idea con palabras; no solo números, emojis o símbolos.';
  const words = text.match(/\p{L}[\p{L}\p{M}\p{N}]*/gu) || [];
  if (words.length < rule.words) return `Usá al menos ${rule.words} palabras para explicar tu idea.`;
  if (/(\p{L}|\p{N})\1{5,}/iu.test(text)) return 'Revisá la respuesta: no uses una misma letra o número muchas veces seguidas.';
  return '';
}

export function errorsForStep(index, answers) {
  const errors = {};
  for (const key of stepFields[index] || []) {
    const error = validateField(key, answers[key], answers);
    if (error) errors[key] = error;
  }
  if (index === 3) {
    const seen = new Map();
    for (const key of ['f1', 'f2', 'f3']) {
      if (errors[key]) continue;
      const signature = comparableText(answers[key]);
      if (seen.has(signature)) {
        errors[key] = 'Esta función repite otra. Proponé tres funciones diferentes.';
        errors[seen.get(signature)] = 'Esta función está repetida. Diferenciá las tres funciones.';
      } else seen.set(signature, key);
    }
  }
  return errors;
}
export function firstInvalidStep(answers) {
  return stepFields.findIndex((_, index) => Object.keys(errorsForStep(index, answers)).length > 0);
}
export function allowedStep(requested, answers) {
  if (!Number.isInteger(requested) || requested < 0 || requested > 6) return 0;
  const invalid = firstInvalidStep(answers);
  return invalid === -1 ? requested : Math.min(requested, invalid);
}

export function cleanAnswers(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const result = {};
  for (const [key, rule] of Object.entries(fieldRules)) {
    const text = normalizeText(Object.hasOwn(source, key) ? source[key] : '');
    // Un valor largo sigue siendo inválido: no se recorta silenciosamente hasta volverlo válido.
    const limit = rule.type === 'text' ? rule.max + 1 : 100;
    result[key] = text.slice(0, limit);
  }
  return result;
}
export function parseSaved(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 50000) throw new Error('Borrador inválido');
    const saved = JSON.parse(raw);
    const answers = cleanAnswers(saved);
    return { answers, step: allowedStep(saved?._step, answers) };
  } catch {
    return { answers: cleanAnswers({}), step: 0 };
  }
}
