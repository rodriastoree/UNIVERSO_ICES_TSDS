# Universo ICES · Hackeá la solución

Experiencia individual de 15 a 20 minutos para que estudiantes de 5.º año exploren el desarrollo de software desde su celular. Presentada por estudiantes de 2.º año durante la muestra de la carrera.

## La experiencia

Cada visitante elige una misión escolar y responde cinco puntos: qué problema resolver, quién usaría su app, tres funciones, cuál desarrollar primero y cómo probar la solución. Hay ideas editables y ejemplos opcionales para ayudar a empezar.

Al finalizar ve **su resumen personal**, organizado por los cinco puntos, y una **conclusión general** que conecta sus decisiones con analizar, diseñar, probar y mejorar software. La conclusión retoma la función que eligió como prioridad sin calificar las respuestas ni afirmar que la propuesta ya está validada. Para acceder al resumen hay que completar correctamente todas las etapas. Siempre se puede volver atrás para editar.

No es una entrega, una evaluación ni una actividad obligatoria en equipos. El nombre de la app es obligatorio; no se pide nombre personal, cuenta ni inicio de sesión. No hay descarga ni envío de respuestas: el resultado se consulta en pantalla.

## Publicar en Vercel

Subir los cambios al repositorio e importarlo en Vercel. Usar la raíz del repositorio: vercel.json configura **Other**, ningún Build Command y Output Directory **public**. No hay dependencias, variables de entorno ni base de datos. Referencia: https://vercel.com/docs/builds/configure-a-build

## Vista previa local

Con Node.js instalado, ejecutar **npm run dev** y abrir http://127.0.0.1:4173. No hace falta npm install. **npm run check** revisa la sintaxis. También puede abrirse public/index.html, aunque se recomienda HTTP para reproducir el guardado de la versión publicada.

## Para la muestra

Invitar a cada estudiante a abrir el enlace desde su celular. Presentar el desafío y dejar que avance a su ritmo. Los tiempos indicados son orientativos: misión 2 min, problema 3, usuarios 2, funciones 4, prioridad 2 y validación 3; al final, reservar unos minutos para leer el resumen y la conclusión. La invitación a conversar sobre la carrera es opcional y no exige una defensa oral.

## Guardado y privacidad

Las respuestas y el paso actual se guardan solo en el navegador del dispositivo mediante localStorage. No se transmiten a un servidor, no hay analítica ni un panel de respuestas de otros visitantes. Si el navegador bloquea el guardado, se puede continuar en la pestaña actual. **Reiniciar mi experiencia** pide confirmar antes de borrar las respuestas locales.

## Archivos

- public/index.html: estructura general.
- public/styles.css: diseño adaptable y controles para pantallas táctiles.
- public/app.js: misiones, preguntas, resumen, conclusión y guardado local.
- vercel.json: publicación estática.
- dev-server.mjs: vista previa local.

El cierre invita a conversar con el equipo del stand. No se incluye enlace de inscripción porque no se proporcionó uno oficial.

## Validaciones

Todos los campos son obligatorios. Los textos tienen mínimos y máximos visibles; se rechazan vacíos, espacios de relleno, respuestas hechas solo de números/símbolos, enlaces sueltos, etiquetas HTML, controles invisibles y repeticiones evidentes. Se aceptan tildes, signos, emojis acompañados por palabras y números dentro de una explicación. Las tres funciones deben ser distintas, también al variar mayúsculas, acentos o puntuación.

Las misiones y prioridades se comprueban contra sus listas de opciones. No se habilita una etapa posterior ni el resumen mientras haya errores previos. Un borrador antiguo o alterado vuelve a la primera etapa que necesita corrección.

En la prueba se piden dos números enteros: entre 1 y 50 participantes, y una meta de personas que completan la tarea entre 1 y ese total. No se aceptan letras, decimales, exponentes, signos ni cantidades fuera de rango. Los errores aparecen junto al campo; al intentar avanzar se muestra un listado y el foco va al primer error.

La aplicación muestra las respuestas como texto escapado y usa una política de contenido que limita scripts y recursos al mismo sitio. No interpreta HTML escrito por los visitantes. Las validaciones comprueban formato y coherencia básica: no determinan si una idea es correcta ni pueden impedir que alguien con herramientas de desarrollo cambie su propia página local. Si en el futuro se agrega un servidor, las reglas también deben ejecutarse allí.

**npm test** ejecuta las pruebas de validación, límites, selecciones, números, funciones repetidas, guardado alterado y navegación. No requiere instalar dependencias.
