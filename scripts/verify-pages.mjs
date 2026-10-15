import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const sites = [
  {
    label: '仓库根目录发布',
    pathname: '/Wenzo_App/',
    file: new URL('../index.html', import.meta.url),
  },
  {
    label: 'docs 目录发布',
    pathname: '/Wenzo_App/docs/',
    file: new URL('../docs/index.html', import.meta.url),
  },
];
const toolNames = [
  '拳拳出击',
  '拍拍脑袋',
  '弹簧大锤',
  '番茄投手',
  '枕头大战',
  '闪电充能',
  '烦恼旋风',
  '冰冻一下',
  '小火苗',
  '挠痒痒',
  '彩纸派对',
  '抱抱时间',
];
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

async function verifySite(browser, origin, site) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(6_000);
  const pageErrors = [];
  const consoleErrors = [];
  const unexpectedRequests = [];
  const allowedDocument = `${origin}${site.pathname}`;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    if (/^https?:/i.test(request.url()) && request.url() !== allowedDocument) {
      unexpectedRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  try {
    // Deliberately serve only the standalone HTMLs. Source files, assets and external
    // resources cannot mask a broken production build or a wrong project base path.
    const response = await page.goto(allowedDocument);
    assert.equal(response?.status(), 200, `${site.label}: HTML must load over HTTP`);
    await page.getByRole('heading', { level: 1, name: /今天的气/ }).waitFor({ state: 'visible' });
    assert.match(await page.title(), /PUFF.*出气事务所/i, `${site.label}: application title`);
    const doll = page.getByRole('button', { name: /^点击布偶，使用/ });
    assert.equal(
      await page.getByRole('button', { name: /^选择/ }).count(),
      12,
      `${site.label}: all tools render`,
    );
    assert.equal(
      await page.getByTestId('hit-count').textContent(),
      '00',
      `${site.label}: clean initial session`,
    );

    for (const [index, name] of toolNames.entries()) {
      const tool = page.getByRole('button', { name: `选择${name}`, exact: true });
      await tool.click();
      assert.equal(
        await tool.getAttribute('aria-pressed'),
        'true',
        `${site.label}: ${name} is selected`,
      );
      assert.equal(await doll.getAttribute('aria-label'), `点击布偶，使用${name}`);
      await doll.click();
      await page.waitForFunction(
        (expected) => document.querySelector('[data-testid="hit-count"]')?.textContent === expected,
        String(index + 1).padStart(2, '0'),
      );
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await doll.waitFor({ state: 'visible' });
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    assert.ok(
      widths.content <= widths.viewport + 1,
      `${site.label}: mobile horizontal overflow (${widths.content}px > ${widths.viewport}px)`,
    );
    await page.getByRole('button', { name: '选择番茄投手', exact: true }).click();
    await doll.click();
    await page.waitForFunction(
      () => document.querySelector('[data-testid="hit-count"]')?.textContent === '13',
    );
    assert.equal(
      await doll.getAttribute('aria-label'),
      '点击布偶，使用番茄投手',
      `${site.label}: mobile remains interactive`,
    );
    assert.deepEqual(pageErrors, [], `${site.label}: no JavaScript runtime errors`);
    assert.deepEqual(consoleErrors, [], `${site.label}: no console errors`);
    assert.deepEqual(
      unexpectedRequests,
      [],
      `${site.label}: standalone build must not request source files, root assets or remote resources`,
    );
    console.log(
      `✓ ${site.label}: HTTP 项目子路径、12 个工具、交互计数、390px 手机布局通过；无额外资源请求。`,
    );
  } catch (error) {
    if (pageErrors.length) console.error(`${site.label} page errors:`, pageErrors);
    if (consoleErrors.length) console.error(`${site.label} console errors:`, consoleErrors);
    if (unexpectedRequests.length)
      console.error(`${site.label} unexpected requests:`, unexpectedRequests);
    throw error;
  } finally {
    await page.close();
  }
}

let browser;
let server;
try {
  const contents = await Promise.all(
    sites.map(async (site) => [site.pathname, await readFile(site.file)]),
  );
  const documents = new Map(contents);
  server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const content = documents.get(pathname);
    if (!content || !['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Only standalone production HTML is available in this regression check.');
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  for (const site of sites) await verifySite(browser, origin, site);
} catch (error) {
  console.error('GitHub Pages 生产版本验证失败：', error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
