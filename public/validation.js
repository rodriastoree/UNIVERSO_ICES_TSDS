import { getOptions, reconcileChoices, SUMMARY_STEP, functionTitle } from './journey.js';
export const fieldRules = {
  mission: { label: 'Situación', type: 'choice' }, appName: { label: 'Nombre de tu app', type: 'text', max: 60, singleLine: true },
  customSituation: { label: 'Tu situación', type: 'text', max: 800 }, customAudience: { label: 'Quiénes usarían tu app', type: 'text', max: 160, singleLine: true },
  audience: { label: 'Rol de las personas', type: 'choice' }, functions: { label: 'Tres funciones', type: 'multiple' },
  customFunction1: { label: 'Mi función 1', type: 'text', max: 100, singleLine: true }, customFunction2: { label: 'Mi función 2', type: 'text', max: 100, singleLine: true }, customFunction3: { label: 'Mi función 3', type: 'text', max: 100, singleLine: true },
  mainFunction: { label: 'Primera función', type: 'choice' }, reason: { label: 'Motivo de la prioridad', type: 'choice' }, mode: { label: 'Diseño', type: 'choice' },
  test: { label: 'Tarea para probar', type: 'choice' }, participants: { label: 'Personas para la prueba', type: 'number', min: 1, max: 20 }, target: { label: 'Meta de éxito', type: 'number', min: 1, max: 20 },
  improve: { label: 'Mejora', type: 'choice' }, note: { label: 'Tu toque personal', type: 'text', max: 800, optional: true }
};
export const stepFields = [['mission', 'customSituation', 'appName'], ['customAudience', 'audience'], ['functions', 'customFunction1', 'customFunction2', 'customFunction3'], ['mainFunction', 'reason'], ['mode'], ['test', 'participants', 'target'], ['improve', 'note']];
export const normalizeText = value => typeof value === 'string' ? value.normalize('NFC').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ') : '';
export const comparable = text => normalizeText(text).normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]/gu, '');
export function isActive(key, a) {
  if (['customSituation', 'customAudience'].includes(key)) return a.mission === 'propia';
  if (/^customFunction[123]$/.test(key)) return a.mission === 'propia' && a.functions?.includes(`custom-${key.at(-1)}`);
  return true;
}
function invalidControls(text) {
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(text) || /\p{Cf}/u.test(text.replace(/[\u200C\u200D]/g, ''))) return true;
  const chars = Array.from(text);
  return chars.some((ch, i) => /[\u200C\u200D]/u.test(ch) && (!/[\p{L}\p{M}\p{Extended_Pictographic}\uFE0F\u{1F3FB}-\u{1F3FF}]/u.test(chars[i - 1] || '') || !/[\p{L}\p{Extended_Pictographic}]/u.test(chars[i + 1] || '')));
}
export function validateField(key, value, a = {}) {
  const rule = fieldRules[key];
  if (!rule) return 'Campo no reconocido.';
  if (!isActive(key, a)) return '';
  if (rule.type === 'multiple') {
    if (!Array.isArray(value) || value.length !== 3 || new Set(value).size !== 3 || value.some(id => typeof id !== 'string' || !getOptions(key, a).some(o => o.id === id))) return 'Elegí exactamente tres funciones diferentes.';
    const names = value.map(id => comparable(functionTitle(id, a)));
    if (new Set(names).size !== names.length) return 'Las tres funciones deben tener nombres diferentes.';
    return '';
  }
  if (typeof value !== 'string') return 'Completá este campo con un valor válido.';
  const text = normalizeText(value).trim();
  if (!text) return rule.optional ? '' : rule.type === 'choice' ? 'Elegí una opción para continuar.' : 'Completá este campo para continuar.';
  if (rule.type === 'choice') return value === text && getOptions(key, a).some(o => o.id === text) ? '' : 'Elegí una opción de este recorrido.';
  if (rule.type === 'number') {
    if (!/^[1-9]\d?$/.test(value) || Number(value) < rule.min || Number(value) > rule.max) return `Ingresá un número entero entre ${rule.min} y ${rule.max}, sin signos ni decimales.`;
    if (key === 'target' && (!/^[1-9]\d?$/.test(a.participants || '') || Number(value) > Number(a.participants))) return 'La meta no puede superar la cantidad de personas de la prueba.';
    return '';
  }
  if (text.length > rule.max) return `Usá hasta ${rule.max} caracteres.`;
  if (invalidControls(text)) return 'Quitá los caracteres invisibles o de control. Podés usar texto y emojis habituales.';
  if (rule.singleLine && /[\n\t\u2028\u2029]/.test(text)) return 'Escribí este dato en una sola línea.';
  if (/<\/?[a-z][^>]*>/i.test(text)) return 'Escribí texto, sin etiquetas HTML.';
  if (!/\p{L}/u.test(text)) return 'Usá alguna palabra para expresar tu idea.';
  return '';
}
export const errorsForStep = (index, a) => Object.fromEntries((stepFields[index] || []).map(key => [key, validateField(key, a[key], a)]).filter(([, error]) => error));
export const firstInvalidStep = a => stepFields.findIndex((_, i) => Object.keys(errorsForStep(i, a)).length);
export function allowedStep(requested, a) {
  if (!Number.isInteger(requested) || requested < 0 || requested > SUMMARY_STEP) return 0;
  const invalid = firstInvalidStep(a);
  return invalid === -1 ? requested : Math.min(requested, invalid);
}
export function cleanAnswers(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const a = Object.fromEntries(Object.entries(fieldRules).map(([key, rule]) => [key, rule.type === 'multiple'
    ? (Array.isArray(source[key]) ? source[key].slice(0, 4).map(x => typeof x === 'string' ? x.slice(0, 100) : '') : [])
    : normalizeText(Object.hasOwn(source, key) ? source[key] : '').slice(0, rule.type === 'text' ? rule.max + 1 : 100)]));
  return reconcileChoices(a).answers;
}
export function parseSaved(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 50000) throw new Error('Borrador inválido');
    const saved = JSON.parse(raw), answers = cleanAnswers(saved);
    return { answers, step: allowedStep(saved?._step, answers) };
  } catch { return { answers: cleanAnswers({}), step: 0 }; }
}
export function migrateV3(raw) {
  try {
    if (!raw || raw.length > 50000) return null;
    const old = JSON.parse(raw);
    if (!old || typeof old !== 'object' || !old.mission) return null;
    const answers = cleanAnswers({ mission: old.mission, appName: old.appName, customSituation: old.customSituation, note: old.note, audience: old.audience, functions: typeof old.mainFunction === 'string' ? [old.mainFunction] : [] });
    return { answers, step: allowedStep(2, answers) };
  } catch { return null; }
}
