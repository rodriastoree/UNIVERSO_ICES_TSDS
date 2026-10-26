// Comprobar el valor previo evita sobrescribir silenciosamente otra pestaña.
export class DraftStore {
  constructor(key, getStorage) { this.key = key; this.getStorage = getStorage; this.lastRaw = null; }
  read() {
    try { this.lastRaw = this.getStorage().getItem(this.key); return { ok: true, raw: this.lastRaw }; }
    catch { return { ok: false, raw: null }; }
  }
  write(raw, force = false) {
    try {
      const storage = this.getStorage(), current = storage.getItem(this.key);
      if (!force && current !== this.lastRaw) return { ok: false, conflict: true };
      storage.setItem(this.key, raw); this.lastRaw = raw; return { ok: true };
    } catch { return { ok: false, conflict: false }; }
  }
}
