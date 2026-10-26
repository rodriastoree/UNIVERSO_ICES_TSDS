export function askWorker(worker, type, timeout = 4000) {
  return new Promise((resolve, reject) => {
    if (!worker) { reject(new Error('No hay una versión disponible.')); return; }
    const channel = new MessageChannel();
    const finish = () => { clearTimeout(clock); channel.port1.close(); channel.port2.close(); };
    const clock = setTimeout(() => { finish(); reject(new Error('La actualización no respondió. Volvé a intentarlo.')); }, timeout);
    channel.port1.onmessage = event => { finish(); resolve(event.data); };
    try { worker.postMessage({ type }, [channel.port2]); }
    catch (error) { finish(); reject(error); }
  });
}

export function waitForInstall(registration) {
  const worker = registration.installing;
  if (!worker || ['installed', 'activated'].includes(worker.state)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = () => { clearTimeout(clock); worker.removeEventListener('statechange', changed); };
    const changed = () => {
      if (['installed', 'activated'].includes(worker.state)) { finish(); resolve(); }
      else if (worker.state === 'redundant') { finish(); reject(new Error('No se pudo preparar la actualización.')); }
    };
    const clock = setTimeout(() => { finish(); reject(new Error('La descarga tardó demasiado. Revisá tu conexión y reintentá.')); }, 20000);
    worker.addEventListener('statechange', changed); changed();
  });
}
