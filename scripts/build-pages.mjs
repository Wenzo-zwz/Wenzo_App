import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const docs = new URL('docs/', root);
await mkdir(docs, { recursive: true });
await copyFile(new URL('dist/PUFF.html', root), new URL('index.html', docs));
await writeFile(new URL('.nojekyll', docs), '');
console.log(`GitHub Pages files ready: ${fileURLToPath(docs)}`);
