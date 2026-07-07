import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

async function copyIfExists(source, target) {
  const from = path.join(root, source);
  if (!existsSync(from)) return;
  await cp(from, path.join(dist, target), { recursive: true });
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await copyIfExists('index.html', 'index.html');
await copyIfExists('index.html', '404.html');
await copyIfExists('app', 'app');
await copyIfExists('public', 'public');
await copyIfExists('.image-slots.state.json', '.image-slots.state.json');

await writeFile(path.join(dist, '.nojekyll'), '');

console.log('GitHub Pages build created in dist/');
