// Contenido y decisiones del recorrido. Las propuestas son hipótesis, no resultados de pruebas.
const option = (id, title, detail) => ({ id, title, detail });
export const missions = [
  { id: 'entregas', icon: '01', title: '¿Era para hoy?', description: 'Las fechas y los trabajos se mezclan entre mensajes y cuadernos.', hint: 'Pensá en una entrega que cambió de fecha: ¿qué ayudaría a encontrar la información actualizada?', functions: ['calendar', 'reminders', 'submissions'] },
  { id: 'avisos', icon: '02', title: 'El aviso que nadie vio', description: 'Un cambio de aula o un aviso importante no llega a todas las personas.', hint: 'Imaginá un cambio de aula a último momento. ¿Cómo distinguir un aviso oficial y saber a quién llegó?', functions: ['official', 'confirmation', 'changes'] },
  { id: 'actividades', icon: '03', title: 'Todo pasa a la vez', description: 'Pruebas, eventos y actividades se superponen y cuesta organizarse.', hint: 'Imaginá dos actividades en el mismo horario: ¿necesitás verlas, detectar el cruce o coordinar la participación?', functions: ['calendar', 'conflicts', 'registration'] },
  { id: 'propia', icon: '↗', title: 'Tengo otra idea', description: 'Partí de tu propia situación y definí personas y funciones para tu solución.', hint: 'Podés escribir tus propias funciones o elegir sugerencias.', functions: ['calendar', 'reminders', 'official', 'registration'] }
];
const audiences = (reader, creator, coordinator) => [
  option('reader', reader, 'Una primera versión pensada para quien consulta o participa.'),
  option('creator', creator, 'Una primera versión pensada para quien publica y mantiene la información.'),
  option('coordinator', coordinator, 'Una primera versión pensada para quien coordina a varias personas.')
];
function branch(title, detail, audience, modeTitle, modes, tests, improvements) {
  return { title, detail, audience, modeTitle,
    mode: modes.map((v, i) => option('mode-' + i, ...v)),
    test: tests.map((v, i) => option('test-' + i, ...v)),
    improve: improvements.map((v, i) => option('improve-' + i, ...v)) };
}
export const branches = {
  calendar: branch('Consultar un calendario', 'Reunir fechas y actividades en un lugar fácil de consultar.',
    audiences('Estudiantes que consultan fechas', 'Docentes que cargan actividades', 'Preceptoría que organiza cursos'),
    '¿Cómo organizarías el calendario?',
    [['Por materia o categoría', 'Filtros para ver solo las fechas que interesan.'], ['Por semana', 'Una vista de lo que viene, día por día.'], ['Por cercanía', 'La próxima fecha importante aparece primero.']],
    [['Encontrar una fecha', 'Pedir que encuentren la próxima entrega o actividad sin ayuda.'], ['Reconocer una fecha modificada', 'Cambiar una fecha en el boceto y pedir que identifiquen la versión actual.'], ['Planificar la semana', 'Pedir que organicen dos actividades usando la vista elegida.']],
    [['Simplificar la vista', 'Dejar primero los datos que hacen falta para encontrar una fecha.'], ['Hacer más visibles los cambios', 'Destacar fecha actual y última actualización, sin depender solo del color.'], ['Mejorar los filtros', 'Usar nombres claros y mostrar qué filtro está activo.']]),
  reminders: branch('Recibir recordatorios', 'Avisar antes de una fecha para ayudar a organizarse.',
    audiences('Estudiantes que reciben recordatorios', 'Docentes que programan recordatorios', 'Preceptoría que coordina avisos'),
    '¿Cuándo debería llegar el recordatorio?',
    [['Un día antes', 'Un aviso con margen para prepararse.'], ['Una hora antes', 'Un aviso cerca del momento de la actividad.'], ['Cuando cada persona lo elija', 'La persona decide la anticipación que le sirve.']],
    [['Reconocer qué está por vencer', 'Mostrar el aviso y pedir que expliquen qué deben hacer y cuándo.'], ['Configurar un recordatorio', 'Pedir que activen un aviso para una fecha concreta.'], ['Cambiar o silenciar un aviso', 'Pedir que modifiquen un recordatorio sin perder la actividad.']],
    [['Aclarar el mensaje', 'Mostrar acción, fecha y materia en pocas líneas.'], ['Evitar demasiados avisos', 'Agrupar los avisos y permitir silenciarlos.'], ['Dar más control', 'Hacer visible cómo cambiar la anticipación o cancelar el aviso.']]),
  submissions: branch('Organizar entregas de trabajos', 'Saber qué falta entregar y si el trabajo fue recibido.',
    audiences('Estudiantes que entregan trabajos', 'Docentes que reciben entregas', 'Preceptoría que acompaña las entregas'),
    '¿Qué sería lo más importante al entregar?',
    [['Adjuntar un archivo', 'Elegir el trabajo y ver una confirmación de recepción.'], ['Compartir un enlace', 'Entregar un vínculo y poder revisarlo antes de enviarlo.'], ['Marcar el estado de la entrega', 'Ver si está pendiente, enviada o recibida.']],
    [['Completar una entrega', 'Pedir que entreguen un trabajo de ejemplo en el boceto.'], ['Comprobar si llegó', 'Pedir que encuentren la confirmación de una entrega.'], ['Corregir un envío', 'Pedir que identifiquen cómo reemplazar un trabajo enviado por error.']],
    [['Aclarar los estados', 'Diferenciar pendiente, enviado y recibido con texto visible.'], ['Prevenir errores al enviar', 'Mostrar una revisión del archivo o enlace antes de confirmar.'], ['Facilitar una corrección', 'Explicar cómo reemplazar el envío y cuál es la versión actual.']]),
  official: branch('Publicar avisos oficiales', 'Reunir mensajes con una fuente y una fecha identificables.',
    audiences('Estudiantes que consultan avisos', 'Docentes que publican avisos', 'Preceptoría que organiza comunicaciones'),
    '¿Cómo ordenarías los avisos?',
    [['Por curso', 'Cada grupo ve la información que le corresponde.'], ['Por importancia', 'Los avisos urgentes aparecen destacados.'], ['Por tema', 'Separar horarios, materiales y actividades.']],
    [['Encontrar un aviso relevante', 'Pedir que localicen un aviso que corresponde a su curso.'], ['Identificar la fuente', 'Pedir que reconozcan quién publicó el aviso y cuándo.'], ['Publicar para un grupo', 'Pedir que preparen un aviso y elijan a quién debería llegar.']],
    [['Aclarar quién publica', 'Mostrar autor, fecha y última actualización en cada aviso.'], ['Reducir el ruido', 'Destacar lo importante y archivar lo que ya venció.'], ['Mejorar las categorías', 'Usar nombres que las personas puedan reconocer sin ayuda.']]),
  confirmation: branch('Confirmar que se leyó un aviso', 'Distinguir un aviso enviado de uno que fue leído.',
    audiences('Estudiantes que confirman lectura', 'Docentes que revisan confirmaciones', 'Preceptoría que sigue avisos pendientes'),
    '¿Cómo confirmarían la lectura?',
    [['Botón «Leído»', 'Una acción simple después de abrir el mensaje.'], ['Respuesta breve', 'Una respuesta opcional para señalar una duda o confirmar.'], ['Confirmación por actividad', 'Confirmar la lectura del aviso relacionado con un evento.']],
    [['Confirmar la lectura', 'Pedir que abran un aviso y muestren cómo confirmarían que lo leyeron.'], ['Detectar una confirmación pendiente', 'Pedir que encuentren qué aviso todavía necesita confirmación.'], ['Expresar una duda', 'Pedir que indiquen que un aviso fue leído pero no comprendido.']],
    [['Distinguir leer de comprender', 'Permitir indicar una duda además de confirmar lectura.'], ['Hacer visible la confirmación', 'Mostrar que la acción quedó registrada sin pedir repetirla.'], ['Cuidar la privacidad', 'Mostrar solo los datos necesarios a quien deba hacer el seguimiento.']]),
  changes: branch('Consultar cambios de horario o aula', 'Encontrar qué cambió y cuál es la información vigente.',
    audiences('Estudiantes que consultan cambios', 'Docentes que informan cambios', 'Preceptoría que coordina horarios'),
    '¿Cómo mostrarías el cambio?',
    [['Antes y después', 'Comparar el horario o aula anterior con el actual.'], ['Un aviso destacado', 'Mostrar primero el cambio más reciente y a quién afecta.'], ['La agenda actualizada', 'Ver directamente la actividad en su nueva ubicación u horario.']],
    [['Encontrar el aula actual', 'Pedir que encuentren dónde se realiza una clase después de un cambio.'], ['Reconocer a quién afecta', 'Pedir que identifiquen qué curso o actividad tiene una modificación.'], ['Distinguir la versión vigente', 'Mostrar dos avisos y pedir que reconozcan cuál sigue válido.']],
    [['Destacar el dato actual', 'Mostrar claramente la nueva aula o el nuevo horario.'], ['Explicar a quién afecta', 'Poner curso, materia y fecha junto al cambio.'], ['Evitar versiones contradictorias', 'Marcar avisos reemplazados y conservar una única versión vigente.']]),
  conflicts: branch('Detectar actividades que se superponen', 'Reconocer cruces antes de confirmar una nueva actividad.',
    audiences('Estudiantes que revisan su agenda', 'Docentes que proponen actividades', 'Coordinación que distribuye horarios'),
    '¿Qué haría la app al encontrar un cruce?',
    [['Mostrar una advertencia', 'Señalar las dos actividades y sus horarios.'], ['Sugerir otro horario', 'Proponer un espacio libre para revisar.'], ['Pedir una revisión', 'Dejar la actividad pendiente hasta que alguien revise el cruce.']],
    [['Reconocer una superposición', 'Pedir que encuentren qué dos actividades se cruzan.'], ['Elegir una alternativa', 'Pedir que propongan un horario libre a partir de la agenda.'], ['Revisar antes de confirmar', 'Pedir que detecten el conflicto antes de aprobar una actividad.']],
    [['Explicar el conflicto', 'Mostrar cuáles son las actividades y cuánto se superponen.'], ['Aclarar las alternativas', 'Mostrar por qué un horario sugerido podría servir.'], ['Definir quién decide', 'Indicar quién puede revisar y confirmar el nuevo horario.']]),
  registration: branch('Inscribirse a una actividad', 'Organizar la participación y saber si la inscripción quedó confirmada.',
    audiences('Personas que quieren participar', 'Docentes que organizan actividades', 'Coordinación que administra lugares'),
    '¿Cómo organizarías los lugares?',
    [['Inscripción directa', 'Confirmación inmediata mientras haya lugares.'], ['Lista de espera', 'Una alternativa cuando se completa la capacidad.'], ['Elección de turno', 'Repartir participantes entre distintos horarios.']],
    [['Completar una inscripción', 'Pedir que elijan una actividad y encuentren su confirmación.'], ['Consultar un lugar disponible', 'Pedir que reconozcan si hay lugar o deben esperar.'], ['Cambiar una participación', 'Pedir que encuentren cómo cambiar de turno o cancelar.']],
    [['Aclarar la confirmación', 'Distinguir una inscripción confirmada de una solicitud pendiente.'], ['Mostrar la disponibilidad', 'Explicar lugares, turnos y lista de espera antes de inscribirse.'], ['Facilitar cambios', 'Hacer visible cómo cancelar o cambiar un turno.']])
};
