export async function prepareOffline(target) {
  if (!target) return;
  if (!('serviceWorker' in navigator)) { target.textContent = 'Para usar la actividad necesitás conexión. La ficha descargada funciona sin internet.'; return; }
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const ready = () => { target.textContent = 'Actividad preparada para seguir en este navegador sin conexión. Las versiones anteriores requieren internet.'; };
    navigator.serviceWorker.ready.then(ready);
    const updated = () => { if (registration.waiting) target.textContent = 'Hay una actualización preparada. Para abrirla, cerrá las pestañas de la actividad y volvé a entrar.'; };
    updated(); registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', updated));
  } catch { target.textContent = 'No se pudo preparar el uso sin conexión. Podés continuar con internet y guardar tu ficha.'; }
}
