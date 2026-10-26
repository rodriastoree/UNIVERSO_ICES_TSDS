import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (/\.(js|mjs)$/.test(entry.name)) execFileSync(process.execPath, ['--check', path], { stdio: 'inherit' });
  }
}
visit('public'); visit('scripts'); visit('tests');
execFileSync(process.execPath, ['--check', 'dev-server.mjs'], { stdio: 'inherit' });
console.log('Sintaxis correcta en los módulos actuales y las versiones conservadas.');
