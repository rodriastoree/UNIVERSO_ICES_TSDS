import { askWorker, waitForInstall } from './update-protocol.js';

const status = document.getElementById('update-status');
const retry = document.getElementById('retry-update');
const home = document.getElementById('return-home');
async function update() {
  retry.hidden = true; home.hidden = true;
  status.textContent = 'Preparando la última versión…';
  try {
    if (!('serviceWorker' in navigator)) { location.replace('./#idea-en-movimiento'); return; }
    const response = await fetch('./sw.js', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo consultar la última versión. Revisá tu conexión.');
    const latest = /const CACHE = '([^']+)'/.exec(await response.text())?.[1];
    status.dataset.expectedVersion = latest || '';
    if (!latest) throw new Error('No se pudo verificar la versión. Volvé a intentarlo.');
    const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    await registration.update();
    await waitForInstall(registration);
    for (let attempt = 0; attempt < 12; attempt++) {
      status.dataset.workerStates = [registration.installing?.state, registration.waiting?.state, registration.active?.state].join('/');
      // Algunos navegadores publican waiting después de resolver register/update.
      if (registration.waiting) {
        const result = await askWorker(registration.waiting, 'ACTIVATE_WELCOME_UPDATE');
        status.dataset.activation = String(result.ok);
        if (!result.ok) throw new Error(result.reason === 'activity-open' ? 'Hay una actividad abierta en otra pestaña. Terminá o cerrá esa actividad y tocá Intentar de nuevo.' : 'No se pudo activar la actualización. Volvé a intentarlo.');
      }
      const worker = navigator.serviceWorker.controller;
      if (worker) {
        const info = await askWorker(worker, 'GET_VERSION', 1000).catch(() => null);
        status.dataset.controllerVersion = info?.version || 'no-response';
        if (info?.version === latest) { location.replace('./#idea-en-movimiento'); return; }
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('La actualización todavía no terminó. Volvé a intentarlo.');
  } catch (error) {
    status.textContent = error.message || 'No se pudo actualizar. Revisá tu conexión.';
    retry.hidden = false; home.hidden = false;
  }
}
retry.addEventListener('click', update);
update();
