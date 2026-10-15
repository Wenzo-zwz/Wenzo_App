import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.join(root, 'dist');
const htmlPath = path.join(outputDirectory, 'index.html');
const targetPath = path.join(outputDirectory, 'PUFF.html');

function assetPath(url, parent = htmlPath) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) {
    throw new Error(`Offline build cannot include an external resource: ${url}`);
  }
  const cleanUrl = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const resolved = cleanUrl.startsWith('/')
    ? path.resolve(outputDirectory, `.${cleanUrl}`)
    : path.resolve(path.dirname(parent), cleanUrl);
  if (!resolved.startsWith(`${outputDirectory}${path.sep}`)) {
    throw new Error(`Resource is outside the build directory: ${url}`);
  }
  return resolved;
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2];
}

async function replaceAsync(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)];
  // Resolve reads before changing the source, so a failed build writes no partial HTML.
  const replacements = await Promise.all(matches.map((match) => replacer(match[0])));
  let result = '';
  let cursor = 0;
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    result += source.slice(cursor, match.index) + replacements[index];
    cursor = match.index + match[0].length;
  }
  return result + source.slice(cursor);
}

const mimeTypes = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function dataUrl(url, parent) {
  const file = assetPath(url, parent);
  const mimeType = mimeTypes[path.extname(file).toLowerCase()];
  if (!mimeType) throw new Error(`Unsupported offline asset type: ${url}`);
  const bytes = await readFile(file);
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

let html;
try {
  html = await readFile(htmlPath, 'utf8');
} catch (error) {
  throw new Error('Run npm run build before creating the offline HTML.', { cause: error });
}

let scriptCount = 0;
html = await replaceAsync(
  html,
  /<script\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>\s*<\/script\s*>/gi,
  async (tag) => {
    const src = attribute(tag, 'src');
    const javascript = await readFile(assetPath(src), 'utf8');
    if (/\bimport\s*(?:\(|["'{*])/.test(javascript) || /\bfrom\s*["'](?:\.|\/)/.test(javascript)) {
      throw new Error(
        'The JavaScript build has split imports. Use a single bundled entry for the offline build.',
      );
    }
    scriptCount += 1;
    // Preserve module deferral so React starts after #root exists. Escape raw-text
    // terminators even when they occur in a bundled JavaScript string or comment.
    return `<script type="module">\n${javascript.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  },
);
if (scriptCount === 0)
  throw new Error('No bundled application script was found in dist/index.html.');

html = await replaceAsync(html, /<link\b[^>]*>/gi, async (tag) => {
  const rel = attribute(tag, 'rel');
  const href = attribute(tag, 'href');
  if (rel === 'modulepreload' || rel === 'preload' || rel === 'prefetch') return '';
  if (rel === 'icon' && href) {
    return `<link rel="icon" type="image/svg+xml" href="${await dataUrl(href)}" />`;
  }
  if (rel !== 'stylesheet' || !href) return tag;
  const cssPath = assetPath(href);
  let css = await readFile(cssPath, 'utf8');
  if (/@import\b/i.test(css))
    throw new Error('CSS imports must be bundled before creating the offline HTML.');
  css = await replaceAsync(
    css,
    /url\(\s*(?:["']([^"']+)["']|([^\s)]+))\s*\)/gi,
    async (reference) => {
      const url = reference.match(/url\(\s*(?:["']([^"']+)["']|([^\s)]+))\s*\)/i);
      const value = url[1] || url[2];
      if (/^(?:data:|#)/i.test(value)) return reference;
      return `url("${await dataUrl(value, cssPath)}")`;
    },
  );
  return `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`;
});

if (/<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["'](?:\/?assets\/|https?:\/\/)/i.test(html)) {
  throw new Error('The generated HTML still references an external application resource.');
}

await writeFile(targetPath, html, 'utf8');
const size = Buffer.byteLength(html);
console.log(`Offline application created: dist/PUFF.html (${(size / 1024).toFixed(1)} kB)`);
