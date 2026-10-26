import { parseSaved, migrateV3 } from './validation.js';
import { prepareOffline } from './offline.js';
import { startIntro } from './intro.js';
// Los enlaces guardados de la versión anterior siguen abriendo el recorrido, con sus validaciones.
if (/^#paso-[1-8]$/.test(location.hash)) {
  location.replace(new URL('./actividad.html' + location.hash, location.href).href);
} else {
  const label = document.getElementById('begin-label'), hint = document.getElementById('draft-hint');
  function refreshEntry() {
    let hasDraft = false;
    try {
      const current = localStorage.getItem('ices-hackea-stand-v4');
      const saved = current ? parseSaved(current) : migrateV3(localStorage.getItem('ices-hackea-stand-v3'));
      hasDraft = Boolean(saved?.answers && (saved.answers.mission || saved.answers.appName || saved.answers.functions.length));
    } catch { /* La bienvenida y el botón funcionan también sin almacenamiento. */ }
    label.textContent = hasDraft ? 'Continuar mi idea' : 'Comenzar mi desafío';
    hint.hidden = !hasDraft;
  }
  refreshEntry();
  addEventListener('pageshow', refreshEntry);
  addEventListener('storage', event => { if (event.key === null || ['ices-hackea-stand-v4', 'ices-hackea-stand-v3'].includes(event.key)) refreshEntry(); });
  startIntro(document.getElementById('idea-en-movimiento'));
  prepareOffline(document.getElementById('offline-state'));
}
