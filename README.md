# Universo ICES · Hackeá la solución

Experiencia individual para el stand de la Tecnicatura Superior en Desarrollo de Software. Mantiene la identidad azul y celeste, el logo transparente, las animaciones adaptables y el uso desde cualquier dispositivo.

## Recorrido breve

Una preparación (misión y nombre de app) y cinco decisiones: función principal, personas para la primera versión, funcionamiento, tarea para probar y mejora. La mayoría son opciones; el nombre admite respuestas breves sin mínimo de palabras y al final hay un comentario opcional. No hay perfiles de visitantes, puntuaciones ni respuestas correctas.

Las misiones tienen pistas propias. La función elegida determina las personas, enfoques, pruebas y mejoras que aparecen después. Hay ocho funciones y trece combinaciones misión/función. Cambiar de función quita las elecciones incompatibles de los pasos siguientes y muestra un aviso; conserva el nombre y el comentario. Cambiar una misión conserva las decisiones si la función sigue disponible.

El resultado combina las elecciones en una propuesta: primera versión, prueba con las personas elegidas, qué observar y siguiente mejora. Son sugerencias deterministas para explorar, nunca resultados de una prueba real. El comentario se conserva como aporte propio, no se interpreta automáticamente. El resumen reproduce todas las respuestas y distingue estas de las sugerencias.

## Guardar, imprimir y continuar

Guardar mi idea descarga una ficha HTML autónoma con logo incluido, todas las elecciones, comentario, propuesta y boceto. No tiene scripts ni recursos remotos. Imprimir / PDF usa la impresión del navegador. Los botones Editar vuelven a las etapas; se puede avanzar usando las respuestas conservadas.

El recorrido nuevo se guarda solo en localStorage bajo ices-hackea-stand-v3. El borrador v2 no se modifica: si existe, se ofrece Abrir mi recorrido anterior. La copia conservada en public/legacy/index.html sigue permitiendo consultar, terminar, descargar e imprimir ese borrador con las reglas anteriores. El enlace de regreso vuelve al nuevo recorrido. Reiniciar la experiencia actual pide confirmación y solo reinicia v3.

Las opciones se validan contra su misión y función; un borrador alterado vuelve a la primera decisión incompleta. El texto se escapa al mostrarlo y al exportar. No hay backend, analítica, cuentas, dependencias ni envío de respuestas.

## Desarrollo y publicación

npm run dev abre un servidor en http://127.0.0.1:4173. npm run check revisa sintaxis y npm test comprueba validación, todos los recorridos, cambios de función, recuperación y fichas, además de la compatibilidad del recorrido anterior.

Vercel sirve public según vercel.json, sin compilación. El sitio publicado es https://universo-ices.vercel.app/ y conserva la misma dirección del QR y del video del stand.

public/journey.js contiene las misiones, opciones y propuesta; validation.js comprueba el recorrido; app.js maneja formularios y guardado; experience.js genera resumen, boceto y ficha; sheet-theme.js conserva el formato institucional de la descarga. public/legacy conserva los módulos anteriores y comparte los estilos, el logo y el tema de ficha.

## Una situación propia

Al elegir **Tengo otra idea** aparece un campo obligatorio **¿De qué situación querés partir?**, con hasta 800 caracteres y sin mínimo de palabras o de longitud. Solo se exige en esa misión. La descripción se guarda en el borrador v3, acompaña los pasos siguientes y aparece en el resultado, el resumen, la impresión y la ficha HTML autónoma. Se muestra como texto escapado, sin interpretación automática.

Si se cambia a una misión predeterminada, el campo se oculta y deja de ser obligatorio; su texto se conserva por si se vuelve a la idea propia, pero no se incluye en el resultado de otras misiones. Los borradores v3 anteriores siguen funcionando: si la misión era propia y no había una situación, vuelven a la preparación para completarla, conservando sus elecciones.
