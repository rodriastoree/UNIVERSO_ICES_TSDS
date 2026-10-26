import { missions as catalogMissions, branches } from './catalog.js';
export { branches };
const option = (id, title, detail = '') => ({ id, title, detail });
export const missions = catalogMissions.map(m => ({ ...m, functions: m.id === 'propia' ? Object.keys(branches) : [...new Set([...m.functions, 'reminders', 'official', 'registration'])] }));
export const steps = [
  ['La situación', 'Todo empieza con un problema.', 'Elegí una situación y un nombre para tu app.'],
  ['Las personas', 'Diseñá para alguien concreto.', 'Elegí quién usaría tu app y qué necesita hacer.'],
  ['Tres funciones', '¿Qué permitirá hacer tu app?', 'Elegí tres funciones diferentes. No hace falta construirlas todas a la vez.'],
  ['La prioridad', 'Elegí por dónde empezar.', 'De tus tres funciones, elegí una para la primera versión y explicá por qué.'],
  ['El diseño', 'Dale forma a esa primera versión.', 'Decidí cómo se organizaría. Después podés dibujar una pantalla en papel.'],
  ['La prueba', '¿Cómo sabrías si se entiende?', 'Elegí una tarea y una meta para una prueba futura con personas.'],
  ['La mejora', 'Aprendé de lo que observes.', 'Elegí qué revisarías si aparecen dificultades y volvé a probar.']
].map(([name, title, description]) => ({ name, title, description }));
export const SUMMARY_STEP = steps.length;
export const prompts = { mission: 'Situación', audience: 'Personas y rol', functions: 'Tres funciones', mainFunction: 'Primera función', reason: 'Motivo de la prioridad', mode: 'Diseño de la primera versión', test: 'Tarea para probar', improve: 'Mejora propuesta' };
export const choiceFields = ['audience', 'mainFunction', 'reason', 'mode', 'test', 'improve'];
export function functionOptions(a) {
  const mission = missions.find(m => m.id === a.mission);
  return [...(mission?.functions || []).map(id => option(id, branches[id].title, branches[id].detail)),
    ...(a.mission === 'propia' ? [1, 2, 3].map(n => option(`custom-${n}`, a[`customFunction${n}`]?.trim() || `Mi función ${n}`, 'Escribí una acción que tu app permita realizar.')) : [])];
}
export const functionTitle = (id, a) => functionOptions(a).find(o => o.id === id)?.title || '';
export const problemFor = a => a.mission === 'propia' ? a.customSituation.trim() : missions.find(m => m.id === a.mission)?.description || '';
export const audienceFor = a => a.mission === 'propia' ? a.customAudience.trim() : getOptions('audience', a).find(o => o.id === a.audience)?.title || '';
const roleActions = {
  calendar: ['encontrar la próxima fecha importante', 'cargar una actividad y revisar su fecha', 'comparar las fechas de dos actividades'],
  reminders: ['configurar un recordatorio para una fecha', 'preparar un recordatorio y revisar cuándo se enviaría', 'revisar los destinatarios y horarios de los recordatorios'],
  submissions: ['entregar un trabajo y reconocer si fue recibido', 'encontrar y revisar una entrega recibida', 'identificar las entregas pendientes del grupo'],
  official: ['encontrar un aviso relevante e identificar su fuente', 'preparar un aviso y elegir sus destinatarios', 'revisar la vigencia y los destinatarios de los avisos'],
  confirmation: ['confirmar la lectura de un aviso', 'revisar si un aviso tiene confirmaciones pendientes', 'identificar qué avisos requieren seguimiento'],
  changes: ['encontrar el horario o lugar vigente', 'informar un cambio e identificar a quién afecta', 'revisar la información vigente de dos actividades'],
  conflicts: ['reconocer dos actividades que se superponen', 'revisar un cruce antes de proponer una actividad', 'revisar un cruce y decidir cómo coordinarlo'],
  registration: ['inscribirse y reconocer el estado de la solicitud', 'preparar una actividad y revisar cómo se asignan lugares', 'revisar los lugares y el estado de las inscripciones']
};
export function taskFor(a) {
  const index = ['reader', 'creator', 'coordinator'].indexOf(a.audience);
  return roleActions[a.mainFunction]?.[index] || `realizar la acción «${functionTitle(a.mainFunction, a)}» desde su rol`;
}
export function getOptions(key, a) {
  if (key === 'mission') return missions;
  if (key === 'functions') return functionOptions(a);
  if (key === 'audience') return (a.mission === 'propia'
    ? [['reader', 'Consultar o participar', 'Necesitan encontrar información o completar una acción.'], ['creator', 'Cargar o publicar información', 'Necesitan crear y mantener el contenido.'], ['coordinator', 'Coordinar a otras personas', 'Necesitan revisar y organizar el trabajo del grupo.']]
    : [['reader', 'Estudiantes', 'Consultan información y participan.'], ['creator', 'Docentes', 'Cargan y mantienen información.'], ['coordinator', 'Preceptoría o coordinación', 'Organizan y acompañan a los grupos.']]).map(v => option(...v));
  if (key === 'mainFunction') return functionOptions(a).filter(o => a.functions?.includes(o.id)).map(o => o.id.startsWith('custom-') ? { ...o, detail: 'Una de las tres funciones que elegiste para tu propuesta.' } : o);
  if (key === 'reason') return [option('problem', 'Ataca el problema principal', 'Primero resuelvo la dificultad que originó mi idea.'), option('people', 'Ayuda primero a las personas elegidas', 'Priorizo lo que ese grupo necesita hacer con más frecuencia.'), option('simple', 'Puedo probarla con una pantalla sencilla', 'Empiezo con algo pequeño para aprender antes de sumar funciones.')];
  if (!a.functions?.includes(a.mainFunction) || !functionTitle(a.mainFunction, a)) return [];
  if (key === 'mode') {
    const modes = branches[a.mainFunction]?.mode || [option('mode-0', 'Un recorrido breve', 'Una acción por pantalla, con instrucciones y confirmación claras.'), option('mode-1', 'Una lista fácil de explorar', 'Mostrar los elementos necesarios y permitir elegir uno.'), option('mode-2', 'Una guía paso a paso', 'Dividir la acción en pasos pequeños y mostrar el avance.')];
    const neutral = text => text.replace(/materia o categoría/g, 'categoría').replace(/materia/g, 'categoría').replace(/curso/g, 'grupo');
    return a.mission === 'propia' ? modes.map(o => ({ ...o, title: neutral(o.title), detail: neutral(o.detail) })) : modes;
  }
  if (key === 'test') return [
    option('test-0', 'Completar la acción sin ayuda', `Pedir que intenten ${taskFor(a)} usando el diseño elegido, sin indicar dónde tocar.`),
    option('test-1', 'Explicar qué harían', `Mostrar el boceto y pedir que expliquen cómo intentarían ${taskFor(a)} y qué resultado esperan.`),
    option('test-2', 'Reconocer el resultado', `Representar el recorrido para ${taskFor(a)} y pedir que indiquen si la acción quedó completada o falta algo.`)
  ];
  if (key === 'improve') return [option('improve-0', 'Aclarar palabras e instrucciones', 'Cambiar nombres confusos y explicar el próximo paso.'), option('improve-1', 'Simplificar la pantalla', 'Mostrar primero la acción principal y quitar distracciones.'), option('improve-2', 'Mejorar la respuesta de la app', 'Hacer más claros los errores, estados y confirmaciones, sin depender solo del color.')];
  return [];
}
export const selectedOption = (key, a) => getOptions(key, a).find(o => o.id === a[key]);
export function reconcileChoices(a) {
  const next = { ...a, functions: Array.isArray(a.functions) ? [...a.functions] : [] };
  const cleared = [];
  for (const key of choiceFields) if (next[key] && !selectedOption(key, next)) { next[key] = ''; cleared.push(key); }
  return { answers: next, cleared };
}
export function changeChoice(before, key, value) {
  const next = { ...before, [key]: value };
  if ((key === 'mainFunction' && value !== before[key]) || (key === 'functions' && !value.includes(before.mainFunction))) {
    for (const field of ['mode', 'test', 'improve']) next[field] = '';
  }
  if (key === 'mission' && value !== before[key]) {
    next.functions = next.functions.filter(id => functionOptions(next).some(o => o.id === id));
    for (const field of ['audience', 'mainFunction', 'reason', 'mode', 'test', 'improve']) next[field] = '';
  }
  if (key === 'audience' && value !== before[key]) next.test = '';
  if (key === 'mode' && value !== before[key]) next.test = '';
  const result = reconcileChoices(next);
  result.cleared = choiceFields.filter(field => before[field] && !result.answers[field]);
  return result;
}
export function proposalFor(a) {
  const fn = selectedOption('mainFunction', a), mode = selectedOption('mode', a), task = selectedOption('test', a), improve = selectedOption('improve', a), reason = selectedOption('reason', a);
  if (![fn, mode, task, improve, reason].every(Boolean) || !selectedOption('audience', a) || a.functions?.length !== 3 || !problemFor(a) || !audienceFor(a)) return null;
  return { situation: problemFor(a), title: `${a.appName.trim()}: una primera versión con propósito`,
    concept: `Para ${audienceFor(a)}, la app parte de esta situación: ${problemFor(a)}`,
    firstVersion: `Empezaría por «${fn.title}». ${reason.detail} Diseño elegido: ${mode.title}. ${mode.detail}`,
    test: `${task.detail} Convocaría a ${a.participants} personas que representen a ${audienceFor(a)}.`,
    observe: `Meta propuesta: que al menos ${a.target} de ${a.participants} personas resuelvan la tarea sin pistas sobre el diseño. Registrar dónde dudan, qué interpretan y si llegan al resultado esperado.`,
    improve: `${improve.detail} Después, repetir la misma tarea con la misma meta y comparar lo observado.`,
    screens: [...a.functions].sort((x, y) => Number(y === a.mainFunction) - Number(x === a.mainFunction)).map(id => functionTitle(id, a)) };
}
