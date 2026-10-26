<img src="public/ices-logo-web.png" alt="ICES Educación Superior" width="150">

# Universo ICES · Hackeá la solución

Experiencia interactiva creada por estudiantes de **2.º año de la Tecnicatura Superior en Desarrollo de Software de ICES Educación Superior**, para acercar la carrera a estudiantes de **5.º año de secundaria** durante la muestra de carreras.

Cada visitante participa desde su celular: parte de un problema cotidiano, imagina una app y toma decisiones sobre sus usuarios, funciones, prioridad, diseño y forma de probarla. Al terminar recibe un resumen personal y una conclusión sobre su propuesta.

**Sitio publicado:** [universo-ices.vercel.app](https://universo-ices.vercel.app/)

**Actualizar una versión guardada:** [Actualizar bienvenida](https://universo-ices.vercel.app/actualizar.html)

## La propuesta

La actividad recupera la consigna **«Hackeá la solución»**: analizar, diseñar, probar y mejorar antes de programar.

- Participación individual, sin cuentas ni instalación de aplicaciones.
- Pensada para celulares y adaptable a pantallas de escritorio.
- Duración orientativa de **15–20 minutos**, incluyendo explorar, dibujar y conversar en el stand.
- No requiere conocimientos previos de programación ni una entrega al equipo.
- Cada persona se lleva sus decisiones; las respuestas no se envían a docentes ni a estudiantes del stand.

La página ayuda a diseñar una propuesta. No programa la app imaginada, no califica las respuestas y no utiliza IA para interpretar los textos o generar resultados. Los resúmenes se construyen con las elecciones de cada visitante.

## Cómo funciona

### 1. Bienvenida

El QR lleva a la página principal. Presenta la experiencia, la carrera y el botón **Comenzar mi desafío**. Si existe un avance guardado en ese navegador, el botón cambia a **Continuar mi idea**.

La portada incluye una animación integrada a la página con cuatro escenas:

1. **Una pregunta. Muchas ideas.** Encontrar algo que se quiera mejorar.
2. **Escuchá. Diseñá.** Pensar en las personas y en un primer boceto.
3. **Probá. Mejorá.** Aprender de las dificultades y revisar la propuesta.
4. **Dale vida con código.** Transformar la idea en una solución.

Las ilustraciones son SVG escalables con márgenes internos. Las escenas cambian cada **5 segundos** y se superponen con un **fundido de 900 ms**. Se pueden pausar, reanudar o seleccionar manualmente; elegir una escena pausa el ciclo. La secuencia se inicia pausada si el dispositivo solicita reducción de movimiento y detiene su temporizador mientras la página está oculta.

No hay reproductor ni archivos de video en la portada. El video con el QR se utiliza por separado en el televisor del stand. También se puede desplegar **Leer toda la secuencia** para consultar el contenido como texto.

### 2. Actividad guiada

El recorrido está en [`public/actividad.html`](public/actividad.html) y tiene siete etapas:

| Etapa | Decisión |
| --- | --- |
| La situación | Elegir una situación sugerida o **Tengo otra idea**, describirla y ponerle nombre a la app. |
| Las personas | Definir quiénes usarían la solución y qué necesitan hacer. |
| Tres funciones | Elegir exactamente tres funciones diferentes. Para una idea propia se pueden escribir funciones y combinarlas con sugerencias. |
| La prioridad | Elegir cuál de esas tres funciones desarrollar primero y justificarlo. |
| El diseño | Decidir cómo se organizaría la primera versión. El boceto también puede dibujarse en papel. |
| La prueba | Elegir una tarea, una cantidad de participantes y una meta para una prueba futura. |
| La mejora | Elegir qué revisar si aparecen dificultades y agregar un comentario opcional. |

Se puede volver a una etapa anterior. Cuando cambia una decisión de la que dependen otras respuestas, el recorrido pide revisar las elecciones afectadas y conserva los textos propios.

### 3. Resumen personal

Al finalizar se muestran el problema, las personas, las tres funciones, la prioridad y la meta de prueba. Se pueden desplegar todas las respuestas, la conclusión, el plan completo y un boceto ilustrativo de la app.

El boceto no tiene controles funcionales. La prueba es un **plan para comprobar la idea**: la página no afirma que se haya realizado ni inventa resultados.

Opciones para llevarse la propuesta:

- **Guardar mi idea:** descarga una ficha HTML con logo, respuestas, conclusión y boceto. Es autónoma, sin scripts ni recursos externos, y se puede abrir sin conexión. No permite reanudar el formulario.
- **Imprimir / PDF:** prepara la impresión con todo el detalle desplegado y sin controles; el navegador permite guardar como PDF.
- **Copiar resumen:** copia el texto y ofrece selección manual si el navegador impide acceder al portapapeles.
- **Compartir resumen:** aparece cuando el dispositivo admite compartir desde el navegador. La persona elige cómo y con quién compartirlo.

Para información sobre la carrera y la inscripción, la página orienta a **alumnado/secretaría**. El stand invita a conocer los proyectos y conversar sobre Desarrollo de Software.

## Validaciones y accesibilidad

Las decisiones obligatorias deben estar completas antes de avanzar. Tampoco se puede acceder al resumen ni exportar una propuesta incompleta mediante enlaces directos.

| Campo de texto | Máximo |
| --- | --- |
| Nombre de la app | 60 caracteres |
| Situación propia | 800 caracteres |
| Personas de una idea propia | 160 caracteres |
| Cada función propia | 100 caracteres |
| Comentario opcional | 800 caracteres |

Se admiten respuestas breves, acentos y emojis habituales. Los textos requieren alguna letra y rechazan etiquetas HTML y controles invisibles peligrosos. Los valores se escapan al mostrar y exportar la propuesta. Las funciones no se pueden repetir por identificador ni por nombre normalizado, y la prioridad debe pertenecer a las tres elegidas.

Participantes y meta aceptan **enteros de 1 a 20**, sin signos, decimales, ceros iniciales ni notación científica. La meta no puede superar la cantidad de participantes. Un valor como `100` se conserva para mostrar el error: no se recorta silenciosamente a `10`.

La interfaz incluye etiquetas y errores asociados a los campos, foco visible, navegación con teclado, grupos de opciones y diálogos identificados. Al fallar una validación, el foco va al primer campo que requiere revisión. Durante el fundido, solo la escena actual se expone a tecnologías de asistencia.

## Guardado y privacidad

El avance se guarda en `localStorage`, con la clave `ices-hackea-stand-v4`, dentro del navegador y del origen utilizados.

- Se puede cerrar o recargar y continuar si el navegador conserva el almacenamiento.
- No hay base de datos, cuentas, analítica propia ni envío de respuestas al equipo.
- El avance **no se sincroniza** entre celulares, computadoras, navegadores o modos de navegación.
- No se deben incluir datos personales en los campos. El alojamiento puede registrar datos técnicos de las visitas.
- Si guardar falla, se muestra un aviso; no se anuncia un guardado exitoso.
- Si dos pestañas modifican el recorrido, se pausa el guardado de una y se permite cargar el otro recorrido o conservar explícitamente el de esa pestaña.
- **Reiniciar mi experiencia** pide confirmación y reinicia el recorrido actual incluso después de un conflicto. Si el reinicio no puede guardarse, se advierte que el borrador anterior podría reaparecer al recargar.

Se conservan los recorridos anteriores: [`public/previous/`](public/previous/) contiene v3 y [`public/legacy/`](public/legacy/) contiene v2. Cuando corresponde, v4 recupera datos de v3 sin inventar las nuevas decisiones que faltan. Reiniciar v4 no elimina esas versiones anteriores.

## Conexión y actualizaciones

Wi-Fi y datos móviles permiten acceder al mismo sitio público. La primera visita necesita conexión. Después de una carga correcta por HTTPS o localhost, el service worker prepara los recursos del recorrido actual; el pie confirma cuándo están disponibles sin internet. Las versiones anteriores necesitan conexión y la ficha HTML descargada funciona de manera independiente.

La bienvenida comprueba si hay una actualización y aplica la versión preparada cuando no hay actividades abiertas en otras pestañas. Una actualización no recarga un formulario que alguien está completando.

Si un celular sigue mostrando una versión anterior:

1. Abrir [Actualizar bienvenida](https://universo-ices.vercel.app/actualizar.html) desde ese navegador y con conexión.
2. Esperar a que vuelva a la página principal. El proceso verifica la versión del servidor y la que controla la página.
3. Si informa que hay otra actividad abierta, terminarla o cerrarla y tocar **Intentar de nuevo**.

Este proceso conserva las respuestas. La página de recuperación y sus archivos de actualización tienen cabeceras que evitan su almacenamiento en la caché HTTP.

**Mantenimiento:** cada cambio en un archivo incluido en `ASSETS` requiere incrementar `CACHE` en [`public/sw.js`](public/sw.js). Mantener completa esa lista para que la versión descargada sea coherente y pueda funcionar sin conexión. La activación anticipada debe conservar la protección de actividades abiertas.

## Ejecutar localmente

Se necesita **Node.js moderno**; el flujo de GitHub Actions utiliza Node.js 24. No hay dependencias externas ni es necesario ejecutar `npm install`.

```sh
git clone https://github.com/rodriastoree/UNIVERSO_ICES_TSDS.git
cd UNIVERSO_ICES_TSDS
npm run dev
```

Abrir [http://127.0.0.1:4173/](http://127.0.0.1:4173/). El servidor permite configurar `PORT` y `HOST`, expone únicamente `public` y aplica las cabeceras de protección del proyecto.

## Verificaciones

```sh
npm run check   # Sintaxis de los módulos
npm test        # Pruebas automatizadas
npm run audit   # Combinaciones de decisiones y fichas generadas
```

La revisión técnica final del **26 de octubre de 2026** completó:

- **117 pruebas automatizadas:** validaciones, migración, navegación, resúmenes, exportación, guardado, reinicio, conflictos entre pestañas, animación, caché y actualizaciones.
- **142.155 combinaciones de decisiones y sus fichas**, mediante el script de auditoría; también se revisan límites numéricos, textos y dependencias entre etapas.
- Un recorrido completo en el navegador hasta el resumen y la preparación de la ficha, rechazo de números inválidos, reinicio con conflicto y recarga, y recuperación de una instalación anterior conservando el avance.
- Las cuatro ilustraciones en anchos de **320, 390, 768, 960 y 1280 píxeles**, sin elementos fuera del área de dibujo ni desbordamiento horizontal en esas comprobaciones.

El workflow [`check.yml`](.github/workflows/check.yml) está configurado para ejecutar sintaxis y pruebas en pushes y pull requests. La auditoría exhaustiva se ejecuta por separado.

Estas comprobaciones no equivalen a probar 142.155 recorridos manualmente ni certifican todos los dispositivos, lectores de pantalla o la comprensión de los visitantes. La observación con alumnos puede realizarse durante el stand. La [guía de prueba en la muestra](docs/PRUEBA-EN-LA-MUESTRA.md) sirve para registrar dudas y verificar dispositivos reales.

## Publicación en Vercel

El repositorio está conectado al proyecto **`universo-ices`**. Los pushes a `main` generan un despliegue de producción en:

**[https://universo-ices.vercel.app/](https://universo-ices.vercel.app/)**

Configuración en [`vercel.json`](vercel.json): sitio estático, sin framework ni compilación, con `public` como directorio de salida. No requiere variables de entorno para funcionar.

Antes de publicar cambios de código, ejecutar las verificaciones correspondientes y actualizar la versión de caché si cambia algún recurso preparado para uso sin conexión. Después del push, comprobar que el despliegue haya terminado y que el enlace público muestre la versión nueva. Conservar el dominio: es la dirección utilizada por el QR del stand.

Las cabeceras incluyen CSP, protección contra marcos, `nosniff`, política de referencia y restricciones de permisos innecesarios. Las reglas de seguridad compartidas con el servidor local están en [`security-headers.json`](security-headers.json).

## Organización del repositorio

| Ubicación | Responsabilidad |
| --- | --- |
| `public/index.html`, `welcome.js`, `welcome.css` | Bienvenida, presentación y entrada o reanudación del recorrido. |
| `public/intro.js`, `intro.css` | Animación integrada, fundido, pausa y selección de escenas. Las ilustraciones SVG están en `index.html`. |
| `public/actividad.html`, `app.js`, `activity.css` | Formularios, navegación, resumen y acciones para llevarse la idea. |
| `public/catalog.js`, `journey.js` | Misiones, funciones, opciones y dependencias entre decisiones. |
| `public/validation.js` | Reglas, límites, limpieza y recuperación de borradores. |
| `public/storage.js` | Persistencia y detección de conflictos entre pestañas. |
| `public/experience.js`, `sheet-theme.js` | Contenido del resumen, conclusión, boceto y ficha HTML. |
| `public/sw.js`, `offline.js` | Preparación sin conexión y actualización de la bienvenida. |
| `public/actualizar.html`, `update.js`, `update-protocol.js`, `update.css` | Recuperación de versiones anteriores y verificación de la actualización. |
| `public/previous/`, `legacy/` | Versiones anteriores conservadas. |
| `dev-server.mjs`, `range.mjs` | Servidor local y solicitudes de rangos de archivos. |
| `tests/`, `scripts/` | Pruebas, verificación de sintaxis y auditoría de recorridos. |
| `docs/` | Guía de prueba para la muestra. |

El proyecto utiliza HTML, CSS, JavaScript con módulos ES y SVG. No necesita backend ni servicios externos para construir las propuestas.
