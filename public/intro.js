// Secuencia integrada: sin video, descargas adicionales ni anuncios automáticos al lector de pantalla.
export function startIntro(root, { motion = matchMedia('(prefers-reduced-motion: reduce)'), doc = document, schedule = setInterval, cancel = clearInterval } = {}) {
  if (!root) return;
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const choices = [...root.querySelectorAll('[data-scene-choice]')];
  const toggle = root.querySelector('[data-motion-toggle]');
  let current = 0, paused = motion.matches, timer = null;
  const stop = () => { if (timer !== null) cancel(timer); timer = null; };
  const render = () => {
    scenes.forEach((scene, index) => {
      const active = index === current;
      // Ambas capas permanecen dibujadas durante el fundido; solo la actual es accesible.
      scene.hidden = false;
      scene.setAttribute('data-active', String(active));
      scene.setAttribute('aria-hidden', String(!active));
      scene.inert = !active;
    });
    choices.forEach((choice, index) => choice.setAttribute('aria-pressed', String(index === current)));
    toggle.textContent = paused ? 'Reanudar animación' : 'Pausar animación';
    root.setAttribute('data-paused', String(paused));
  };
  const sync = () => {
    stop();
    if (!paused && !doc.hidden) timer = schedule(() => { current = (current + 1) % scenes.length; render(); }, 5000);
  };
  const select = index => { current = index; paused = true; render(); sync(); };
  const onToggle = () => { paused = !paused; render(); sync(); };
  const onMotion = () => { if (motion.matches) { paused = true; render(); sync(); } };
  const onChoice = choices.map((choice, index) => { const handler = () => select(index); choice.addEventListener('click', handler); return handler; });
  toggle.addEventListener('click', onToggle);
  motion.addEventListener('change', onMotion);
  doc.addEventListener('visibilitychange', sync);
  doc.defaultView?.addEventListener('pagehide', stop);
  doc.defaultView?.addEventListener('pageshow', sync);
  root.querySelector('[data-intro-controls]').hidden = false;
  render(); sync();
  return { destroy() {
    stop(); toggle.removeEventListener('click', onToggle);
    choices.forEach((choice, index) => choice.removeEventListener('click', onChoice[index]));
    motion.removeEventListener('change', onMotion); doc.removeEventListener('visibilitychange', sync);
    doc.defaultView?.removeEventListener('pagehide', stop); doc.defaultView?.removeEventListener('pageshow', sync);
  } };
}
