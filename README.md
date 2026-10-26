# Universo ICES · Hackeá la solución

Actividad individual para acercarse a la Tecnicatura Superior en Desarrollo de Software. Desde un celular, sin cuentas, analítica ni envío de respuestas. Los 15–20 minutos incluyen explorar, dibujar y conversar en el stand.

## Recorrido actual

La dirección del QR abre primero una bienvenida con una animación original sobre Desarrollo de Software y el botón **Comenzar mi desafío**. La actividad está en `actividad.html`, con el mismo almacenamiento del navegador. Si hay un borrador se ofrece **Continuar mi idea**; no se borra ni modifica desde la bienvenida. Los enlaces antiguos `/#paso-1` a `/#paso-8` siguen llevando a la actividad, que conserva sus validaciones. También se puede volver a la bienvenida sin perder respuestas.

La bienvenida contiene una secuencia nativa en HTML/CSS con ilustraciones SVG escalables y márgenes internos (`intro.js` e `intro.css`), sin reproductor ni archivos de video. Las escenas se superponen con un fundido de opacidad de 900 ms, sin cortes ni desplazamientos; solo la actual se expone a tecnologías de asistencia. Sus cuatro escenas cambian cada 5 segundos: idea, diseño con personas, prueba y mejora, implementación con código. Se puede pausar, reanudar o elegir una escena; elegir una escena detiene el cambio automático para leerla. Respeta reducción de movimiento, detiene el temporizador con la página oculta y ofrece toda la secuencia como texto. Sin JavaScript muestra la primera escena y permite leer el resto. Tras la primera carga, toda la animación funciona sin conexión. Los enlaces antiguos `#video-idea` siguen encontrando la sección. El video con QR queda exclusivamente para el televisor del stand.

1. Elegir una situación y nombrar la app. La misión propia exige describir el problema.
2. Definir personas y rol. La misión propia permite escribir quiénes usarían la app.
3. Elegir exactamente tres funciones diferentes; en una idea propia se pueden escribir hasta tres funciones y combinarlas con sugerencias.
4. Priorizar una de esas tres funciones y elegir un motivo.
5. Elegir el diseño de la primera versión.
6. Planificar una tarea que se adapte a la función y al rol, una cantidad de participantes y una meta.
7. Elegir una mejora y agregar un comentario opcional.

El resumen presenta problema, personas, tres funciones, prioridad y meta. Las respuestas editables, conclusión y boceto se despliegan por separado. La propuesta se construye con las elecciones; no interpreta texto ni usa IA, no califica y no inventa resultados de pruebas. El boceto es una ilustración sin controles funcionales. La invitación a conversar en el stand explica la relación con la carrera sin inventar requisitos o fechas de inscripción.

## Validaciones y accesibilidad

Se admiten textos breves sin mínimos arbitrarios. Máximos: nombre 60, situación y comentario 800, personas 160, funciones propias 100 caracteres. Los textos requieren alguna letra, permiten acentos y emojis habituales y rechazan etiquetas HTML y controles invisibles peligrosos. Se escapan también al renderizar y exportar. Las funciones no pueden repetirse por identificador ni por nombre normalizado. La prioridad debe pertenecer a las tres elegidas.

Participantes y meta admiten solo enteros de 1 a 20, sin signos, espacios, ceros iniciales, notación científica o decimales. La meta no puede superar a los participantes. No se puede avanzar sobre una etapa incompleta ni entrar al resumen o exportar decisiones inválidas.

Los cambios de misión, rol, prioridad y diseño invalidan elecciones que necesitan revisión. El foco va al primer campo inválido. Los controles tienen etiquetas, grupos y errores asociados; los botones de edición especifican su destino. Hay foco visible, navegación con teclado, diálogo de reinicio identificado, movimiento breve que respeta reducción de movimiento y texto largo que se corta sin desbordar la pantalla.

## Guardado y compatibilidad

El borrador actual se guarda en `ices-hackea-stand-v4` dentro de ese navegador y origen. No se sincroniza entre dispositivos. Si el almacenamiento falla, se avisa que cerrar o recargar podría perder el avance. Dos pestañas no sobrescriben silenciosamente el borrador: se detiene el guardado y la persona elige cargar el otro recorrido o conservar el suyo.

Si hay un borrador v3 y aún no existe v4, se recuperan los textos, rol y función elegida sin inventar las decisiones nuevas que faltan. Se conserva íntegro v3. El enlace `previous/index.html` permite abrirlo con sus reglas originales; `legacy/index.html` conserva v2. Reiniciar el recorrido actual solo reinicia v4. Los archivos previos tienen estilos propios o los estilos anteriores, separados de `activity.css`.

## Llevarse la idea

«Guardar mi idea» descarga una ficha HTML autónoma con el logo, respuestas, conclusión y boceto: sin scripts ni recursos remotos. Se abre sin conexión, pero no reanuda el formulario. «Imprimir / PDF» abre la impresión del navegador con todo el detalle desplegado, marca incluida y sin controles. «Copiar resumen» copia texto y ofrece selección manual si el navegador lo impide. «Compartir resumen» aparece cuando el dispositivo ofrece esa función.

## Sin conexión y actualizaciones

Tras una primera carga correcta por HTTPS o localhost, el service worker prepara exclusivamente los recursos estáticos del recorrido actual. No guarda respuestas en la caché ni intercepta servicios externos. El pie confirma cuándo está listo; la primera visita y los recorridos anteriores necesitan conexión. La ficha HTML descargada también es una alternativa sin internet.

Las actualizaciones esperan a que se cierren las pestañas anteriores, para no mezclar módulos de distintas versiones. El pie avisa si hay una versión preparada. **Al cambiar archivos incluidos en la caché, incrementar el identificador `CACHE` de `public/sw.js`.** No llamar a `skipWaiting()` durante una actividad. Si falla la instalación, la actividad sigue funcionando con internet.

## Ejecutar y verificar

Requiere Node.js moderno (verificado con Node local y configurado con Node 24 en GitHub Actions). No hay dependencias ni instalación necesaria.

```text
npm run dev
npm run check
npm test
```

Vista local: `http://127.0.0.1:4173/`. El servidor solo expone `public`, rechaza métodos de escritura, asigna tipos correctos y utiliza las mismas cabeceras de protección configuradas para Vercel. `PORT` y `HOST` permiten cambiar la escucha local.

Las pruebas incluyen la versión actual, migración, Unicode, números, exportación, coherencia por rol, conflictos de guardado, recursos sin red, cabeceras HTTP, página 404 y las versiones conservadas. Las pruebas antiguas de v3 importan explícitamente desde `public/previous`; no representan reglas de v4. GitHub Actions ejecutará sintaxis y pruebas en pushes y pull requests. La configuración está preparada; no se afirma que haya corrido en GitHub antes del push.

## Publicación

Vercel sirve `public`, sin compilación. Se conserva el proyecto y la dirección `https://universo-ices.vercel.app/`, que usan el QR y el video del stand. `vercel.json` incluye CSP, protección contra marcos, `nosniff`, política de referencia y restricciones de permisos innecesarios. Las mismas cabeceras están en `security-headers.json` para verificación local; una prueba detecta divergencias. No agregar analítica o scripts externos sin revisar estas políticas y la explicación de privacidad.

Esta iteración prepara los archivos para commit/push; no publica automáticamente. Después del despliegue, comprobar el sitio real y sus cabeceras, porque el entorno local no acredita la configuración efectiva de producción.

## Organización

- `catalog.js`: catálogo de funciones y alternativas de diseño.
- `journey.js`: decisiones, roles, tareas y propuestas.
- `validation.js`: reglas, limpieza, migración y límites de navegación.
- `storage.js`: guardado y detección de conflictos entre pestañas.
- `app.js`: formularios, navegación, resumen, impresión y descarga.
- `activity.css`: estilos actuales; el resto de estilos conserva las versiones anteriores.
- `experience.js` y `sheet-theme.js`: ficha, conclusión y boceto.
- `sw.js`: recursos sin conexión y control de versiones.

El logo web transparente ocupa unos 48 KB, frente a 652 KB del original. Se conserva el original para las versiones previas.

## Antes de la muestra

Seguir [docs/PRUEBA-EN-LA-MUESTRA.md](docs/PRUEBA-EN-LA-MUESTRA.md). Las pruebas automáticas y el navegador de escritorio no sustituyen una prueba con visitantes, teléfonos reales y lectores de pantalla. No presentar esas verificaciones como realizadas hasta completarlas.
