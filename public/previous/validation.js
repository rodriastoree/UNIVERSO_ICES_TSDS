import { missions, getOptions, reconcileChoices } from './journey.js';
export const missionIds = missions.map(m => m.id);
export const fieldRules = {
  mission: { label: 'Misión', type: 'choice' },
  appName: { label: 'Nombre de tu app', type: 'text', max: 60, singleLine: true },
  customSituation: { label: 'Tu situación', type: 'text', max: 800 },
  mainFunction: { label: 'Función principal', type: 'choice' },
  audience: { label: 'Personas', type: 'choice' },
  mode: { label: 'Funcionamiento', type: 'choice' },
  test: { label: 'Prueba', type: 'choice' },
  improve: { label: 'Mejora', type: 'choice' },
  note: { label: 'Tu toque personal', type: 'text', max: 800, optional: true }
};
export const stepFields = [['mission', 'customSituation', 'appName'], ['mainFunction'], ['audience'], ['mode'], ['test'], ['improve', 'note']];
export const normalizeText = value => typeof value === 'string'
  ? value.normalize('NFC').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ') : '';
export function validateField(key, value, answers = {}) {
  const rule = fieldRules[key];
  if (!rule) return 'Campo no reconocido.';
  // La situación se exige solo en la misión propia; se conserva al cambiar de misión.
  if (key === 'customSituation' && answers.mission !== 'propia') return '';
  if (typeof value !== 'string') return 'Completá este campo con un valor válido.';
  const text = normalizeText(value).trim();
  if (!text) return rule.optional ? '' : rule.type === 'choice' ? 'Elegí una opción para continuar.' : 'Completá este campo para continuar.';
  if (rule.type === 'choice') return value === text && getOptions(key, answers).some(o => o.id === text)
    ? '' : 'Elegí una de las opciones de este recorrido.';
  if (text.length > rule.max) return `Usá hasta ${rule.max} caracteres.`;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\p{Cf}]/u.test(text)) return 'Quitá los caracteres invisibles o de control.';
  if (rule.singleLine && /[\n\t]/.test(text)) return 'Escribí este dato en una sola línea.';
  if (/<\/?[a-z][^>]*>/i.test(text)) return 'Escribí texto, sin etiquetas HTML.';
  if (!/\p{L}/u.test(text)) return 'Usá alguna palabra para expresar tu idea.';
  return '';
}
export function errorsForStep(index, answers) {
  return Object.fromEntries((stepFields[index] || []).map(key => [key, validateField(key, answers[key], answers)]).filter(([, error]) => error));
}
export const firstInvalidStep = answers => stepFields.findIndex((_, index) => Object.keys(errorsForStep(index, answers)).length);
export function allowedStep(requested, answers) {
  if (!Number.isInteger(requested) || requested < 0 || requested > 6) return 0;
  const invalid = firstInvalidStep(answers);
  return invalid === -1 ? requested : Math.min(requested, invalid);
}
export function cleanAnswers(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const values = Object.fromEntries(Object.entries(fieldRules).map(([key, rule]) => [key,
    normalizeText(Object.hasOwn(source, key) ? source[key] : '').slice(0, rule.type === 'text' ? rule.max + 1 : 100)]));
  return reconcileChoices(values).answers;
}
export function parseSaved(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 50000) throw new Error('Borrador inválido');
    const saved = JSON.parse(raw);
    const answers = cleanAnswers(saved);
    return { answers, step: allowedStep(saved?._step, answers) };
  } catch { return { answers: cleanAnswers({}), step: 0 }; }
}
