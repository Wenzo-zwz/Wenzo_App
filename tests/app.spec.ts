import { expect, test, type Page } from '@playwright/test';

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
const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('今天的气');
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? [], 'The browser should not report runtime errors').toEqual([]);
});

function doll(page: Page) {
  return page.getByRole('button', { name: /^点击布偶，使用/ });
}

async function hitCount(page: Page): Promise<number> {
  return Number(await page.getByTestId('hit-count').innerText());
}

/** A small local PNG fixture, generated in the browser without a network/image dependency. */
async function portraitPng(page: Page): Promise<Buffer> {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 200;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#d5ead8';
    context.fillRect(0, 0, 160, 200);
    context.fillStyle = '#f6c69e';
    context.beginPath();
    context.ellipse(80, 92, 48, 64, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#503934';
    context.beginPath();
    context.ellipse(80, 45, 49, 24, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#3c302e';
    context.beginPath();
    context.arc(62, 88, 4, 0, Math.PI * 2);
    context.arc(98, 88, 4, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#b26864';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(80, 106, 16, 0.2, Math.PI - 0.2);
    context.stroke();
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return Buffer.from(data, 'base64');
}

test('initial screen exposes a playable doll, twelve tools and session stats', async ({ page }) => {
  await expect(page).toHaveTitle(/PUFF|出气事务所/i);
  await expect(doll(page)).toHaveAccessibleName('点击布偶，使用拳拳出击');
  await expect(page.getByRole('button', { name: /^选择/ })).toHaveCount(12);
  await expect(page.getByTestId('hit-count')).toHaveText('00');
  await expect(page.getByTestId('best-combo')).toHaveText('00');
  await expect(page.getByTestId('relief')).toHaveText('24%');
  const dimensions = await doll(page).evaluate((element: HTMLCanvasElement) => ({
    width: element.width,
    height: element.height,
  }));
  expect(dimensions.width).toBeGreaterThan(100);
  expect(dimensions.height).toBeGreaterThan(100);
});

test('every tool changes the selected action and produces one counted interaction', async ({
  page,
}) => {
  for (const [index, name] of toolNames.entries()) {
    const tool = page.getByRole('button', { name: `选择${name}`, exact: true });
    await tool.click();
    await expect(tool).toHaveAttribute('aria-pressed', 'true');
    await expect(doll(page)).toHaveAccessibleName(`点击布偶，使用${name}`);
    await doll(page).click();
    await expect(page.getByTestId('hit-count')).toHaveText(String(index + 1).padStart(2, '0'));
  }
  await page.getByRole('button', { name: '温柔一点' }).click();
  await expect(page.getByRole('button', { name: /^选择/ })).toHaveCount(3);
  for (const name of ['挠痒痒', '彩纸派对', '抱抱时间']) {
    await expect(page.getByRole('button', { name: `选择${name}` })).toBeVisible();
  }
});

test('holding the doll repeats interactions and releasing stops them', async ({ page }) => {
  const box = await doll(page).boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  try {
    await expect.poll(() => hitCount(page)).toBeGreaterThanOrEqual(4);
  } finally {
    await page.mouse.up();
  }
  const releasedCount = await hitCount(page);
  await page.waitForTimeout(500); // Observe several repeat intervals after release.
  expect(await hitCount(page)).toBe(releasedCount);
});

test('keyboard actions, color choices and intensity controls work', async ({ page }) => {
  await doll(page).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('hit-count')).toHaveText('02');
  for (const color of ['蜜桃粉', '开心绿', '葡萄紫']) {
    const button = page.getByRole('button', { name: color, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('group', { name: '布偶颜色' }).locator('button[aria-pressed="true"]'),
    ).toHaveCount(1);
  }
  const intensity = page.getByRole('slider', { name: '出气力度' });
  await intensity.fill('90');
  await expect(intensity).toHaveValue('90');
  await expect(page.getByText('超解压', { exact: false })).toBeVisible();
});

test('challenge keeps counting down during play, counts its own hits and can stop', async ({
  page,
}) => {
  await doll(page).click(); // Outside the challenge, this must not be included below.
  const challenge = page.getByRole('button', { name: /60 秒释放挑战/ });
  await challenge.click();
  const running = page.getByRole('button', { name: /还剩 \d+ 秒/ });
  for (let i = 0; i < 12; i += 1) {
    await doll(page).click();
    await page.waitForTimeout(120);
  }
  await expect(running).toContainText('12 次');
  await expect
    .poll(async () => Number((await running.innerText()).match(/还剩 (\d+) 秒/)?.[1]))
    .toBeLessThan(60);
  await expect(page.getByTestId('hit-count')).toHaveText('13');
  await running.click();
  await expect(page.getByRole('button', { name: /60 秒释放挑战/ })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('你释放了 12 次');
});

test('challenge finishes at its deadline and reports the final count', async ({ page }) => {
  // Reload with a controlled clock so the full deadline can be checked without waiting a minute.
  await page.clock.install();
  await page.reload();
  await page.getByRole('button', { name: /60 秒释放挑战/ }).click();
  for (let i = 0; i < 3; i += 1) await doll(page).click();
  await expect(page.getByRole('button', { name: /还剩 \d+ 秒/ })).toContainText('3 次');
  await page.clock.fastForward(60_200);
  await expect(page.getByRole('button', { name: /60 秒释放挑战/ })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('挑战完成！60 秒释放了 3 次');
  await doll(page).click();
  await expect(page.getByTestId('hit-count')).toHaveText('04');
});

test('reset clears interactions, mood and active challenge', async ({ page }) => {
  await doll(page).click();
  await doll(page).click();
  await page.getByRole('button', { name: /60 秒释放挑战/ }).click();
  await doll(page).click();
  await expect(page.getByTestId('hit-count')).toHaveText('03');
  await page.getByRole('button', { name: '重新开始', exact: true }).click();
  await expect(page.getByTestId('hit-count')).toHaveText('00');
  await expect(page.getByTestId('best-combo')).toHaveText('00');
  await expect(page.getByTestId('relief')).toHaveText('24%');
  await expect(page.getByRole('button', { name: /60 秒释放挑战/ })).toBeVisible();
  await doll(page).click();
  await expect(page.getByTestId('hit-count')).toHaveText('01');
});

test('a local photo can be cropped, named and applied without outgoing requests', async ({
  page,
}) => {
  const buffer = await portraitPng(page);
  await page.getByRole('button', { name: '定制我的布偶', exact: true }).click();
  const modal = page.getByRole('dialog', { name: '定制我的布偶' });
  const outgoing: string[] = [];
  page.on('request', (request) => {
    if (/^https?:/i.test(request.url())) outgoing.push(`${request.method()} ${request.url()}`);
  });
  await modal
    .getByLabel('上传人物照片')
    .setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer });
  const preview = modal.getByAltText('卡通化布偶头像预览');
  await expect(preview).toBeVisible();
  await expect(modal.getByAltText('原照片')).toHaveAttribute('src', /^blob:/);
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  const originalPreview = await preview.getAttribute('src');
  await modal.getByRole('slider', { name: '放大裁切' }).fill('1.5');
  await expect(preview).not.toHaveAttribute('src', originalPreview!);
  await modal.getByRole('textbox', { name: '布偶小名' }).fill('周一小怪');
  const apply = modal.getByRole('button', { name: '生成我的布偶' });
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(modal).not.toBeVisible();
  await expect(page.getByText('周一小怪', { exact: true })).toBeVisible();
  await expect(page.getByText('专属照片布偶', { exact: true })).toBeVisible();
  await doll(page).click();
  await expect(page.getByTestId('hit-count')).toHaveText('01');
  expect(outgoing, 'Photo selection and processing should not make HTTP requests').toEqual([]);
  await page.getByRole('button', { name: '移除照片', exact: true }).click();
  await expect(page.getByText('烦恼小怪兽', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '移除照片', exact: true })).toHaveCount(0);
});

test('invalid image contents show a useful error and cannot be applied', async ({ page }) => {
  await page.getByRole('button', { name: '定制我的布偶', exact: true }).click();
  const modal = page.getByRole('dialog', { name: '定制我的布偶' });
  const input = modal.getByLabel('上传人物照片');
  await input.setInputFiles({
    name: 'good.png',
    mimeType: 'image/png',
    buffer: await portraitPng(page),
  });
  const apply = modal.getByRole('button', { name: '生成我的布偶' });
  await expect(apply).toBeEnabled();
  await input.setInputFiles({
    name: 'pretends-to-be.png',
    mimeType: 'image/png',
    buffer: Buffer.from('This is not an image.'),
  });
  await expect(modal.getByRole('alert')).toContainText('暂时无法使用这种图片');
  await expect(apply).toBeDisabled();
  await expect(modal.getByAltText('卡通化布偶头像预览')).toHaveCount(0);
});

test('breathing dialog has keyboard dismissal and restores opener focus', async ({ page }) => {
  const opener = page.getByRole('button', { name: /也可以，什么都不做/ });
  await opener.click();
  const modal = page.getByRole('dialog', { name: '36 秒呼吸放松' });
  await expect(modal).toBeVisible();
  await expect(modal).toBeFocused();
  await expect(modal.getByText('慢慢吸气', { exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(modal.getByRole('button', { name: '关闭弹窗' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(modal.getByRole('button', { name: '我准备好回来了' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test('session report downloads a PNG', async ({ page }) => {
  await doll(page).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '收好今日好心情' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^PUFF-今日好心情-\d{4}-\d{2}-\d{2}\.png$/);
  expect(await download.failure()).toBeNull();
  await expect(page.getByRole('status')).toContainText('解压战报已生成');
});

test('mobile layout fits a 390px screen and remains playable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(doll(page)).toBeVisible();
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(layout.content).toBeLessThanOrEqual(layout.viewport + 1);
  await page.getByRole('button', { name: '选择番茄投手', exact: true }).click();
  await doll(page).click();
  await expect(page.getByTestId('hit-count')).toHaveText('01');
  await expect(doll(page)).toHaveAccessibleName('点击布偶，使用番茄投手');
});
