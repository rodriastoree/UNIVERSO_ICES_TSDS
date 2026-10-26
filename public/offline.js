import { askWorker } from './update-protocol.js';

export async function prepareOffline(target) {
  if (!target) return;
  if (!('serviceWorker' in navigator)) { target.textContent = 'Para usar la actividad necesitás conexión. La ficha descargada funciona sin internet.'; return; }
  const base = new URL('./', location.href).pathname;
  const welcome = [base, base + 'index.html'].includes(location.pathname);
  const controlledBefore = Boolean(navigator.serviceWorker.controller);
  let applying = false, reloading = false;
  const offerUpdate = message => {
    target.textContent = message + ' ';
    const link = document.createElement('a'); link.href = './actualizar.html'; link.textContent = 'Actualizar bienvenida';
    target.append(link);
  };
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (welcome && (applying || controlledBefore) && !reloading) { reloading = true; location.reload(); }
    });
    const updated = async () => {
      if (!registration.waiting || applying) return;
      if (!welcome) { offerUpdate('Hay una actualización lista. Podés abrirla cuando termines esta actividad.'); return; }
      applying = true;
      target.textContent = 'Actualizando la bienvenida. Tus respuestas guardadas se conservan…';
      try {
        const result = await askWorker(registration.waiting, 'ACTIVATE_WELCOME_UPDATE');
        if (!result.ok) {
          applying = false;
          offerUpdate('Hay una actualización lista. Terminá o cerrá la actividad abierta en otra pestaña.');
        }
      } catch {
        applying = false;
        offerUpdate('Hay una actualización disponible.');
      }
    };
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed') setTimeout(updated, 0); });
    });
    navigator.serviceWorker.ready.then(() => {
      if (!registration.waiting && !applying) target.textContent = 'Actividad preparada para seguir en este navegador sin conexión. Las versiones anteriores requieren internet.';
    });
    await updated();
    registration.update().catch(() => {});
  } catch { target.textContent = 'No se pudo preparar el uso sin conexión. Podés continuar con internet y guardar tu ficha.'; }
}
