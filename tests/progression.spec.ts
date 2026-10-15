import { expect, test, type Page } from '@playwright/test';

const tools = [
  { id: 'punch', name: '拳拳出击', stages: ['棉花拳', '眼冒金星', '补丁上线', '软成一张饼'] },
  { id: 'slap', name: '拍拍脑袋', stages: ['轻轻拍拍', '脸颊鼓鼓', '晕乎乎', '小气球脸'] },
  { id: 'hammer', name: '弹簧大锤', stages: ['咚咚敲', '压扁一点', '弹簧上线', '软成手风琴'] },
  { id: 'tomato', name: '番茄投手', stages: ['一颗番茄', '酱汁点点', '满身番茄', '番茄酱小人'] },
  { id: 'pillow', name: '枕头大战', stages: ['羽毛飘飘', '沾点绒毛', '云朵包围', '棉花云团子'] },
  { id: 'lightning', name: '闪电充能', stages: ['静电来啦', '绒毛炸起', '霹雳爆炸头', '电量满格'] },
  { id: 'tornado', name: '烦恼旋风', stages: ['微风摇摇', '双脚离地', '旋转升空', '龙卷风卷飞'] },
  { id: 'ice', name: '冰冻一下', stages: ['初雪发抖', '鼻涕泡泡', '冰霜爬上身', '冻成小冰人'] },
  { id: 'fire', name: '小火苗', stages: ['小火苗', '开始冒烟', '焦糖小黑脸', '黑芝麻团子'] },
  { id: 'tickle', name: '挠痒痒', stages: ['忍住不笑', '笑出声音', '笑出眼泪', '笑到打滚'] },
  {
    id: 'confetti',
    name: '彩纸派对',
    stages: ['撒点彩纸', '戴上派对帽', '彩带大游行', '今天你是主角'],
  },
  { id: 'hug', name: '抱抱时间', stages: ['轻轻抱抱', '暖乎乎', '爱心小毯子', '被爱包围'] },
];

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const recorded: string[] = [];
  errors.set(page, recorded);
  page.on('pageerror', (error) => recorded.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') recorded.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('region', { name: '布偶变化进度' })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page) ?? [], 'Progression must work without browser errors').toEqual([]);
});

function doll(page: Page) {
  return page.getByRole('button', { name: /^点击布偶，使用/ });
}

async function choose(page: Page, name: string) {
  await page.getByRole('button', { name: `选择${name}`, exact: true }).click();
  await expect(doll(page)).toHaveAccessibleName(`点击布偶，使用${name}`);
}

async function hit(page: Page, count: number) {
  // Keyboard activation delivers one discrete interaction per key, avoiding hold-repeat timing.
  await doll(page).focus();
  for (let index = 0; index < count; index += 1) await page.keyboard.press('Enter');
}

async function stage(page: Page, expected: number, count: number, label?: string) {
  await expect(doll(page)).toHaveAttribute('data-evolution-stage', String(expected));
  await expect(page.getByTestId('tool-hit-count')).toHaveText(String(count));
  await expect(page.getByRole('progressbar', { name: '当前工具变化进度' })).toHaveAttribute(
    'aria-valuenow',
    String(Math.min(18, count)),
  );
  if (label) await expect(page.getByTestId('evolution-stage')).toHaveText(label);
}

/** Read rendered pixels, including transparency, without depending on particular paint colors. */
async function canvasPixels(page: Page): Promise<number[]> {
  return doll(page).evaluate(async (element: HTMLCanvasElement) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const sample = document.createElement('canvas');
    sample.width = 180;
    sample.height = Math.round((180 * element.height) / element.width);
    const context = sample.getContext('2d')!;
    context.drawImage(element, 0, 0, sample.width, sample.height);
    return Array.from(context.getImageData(0, 0, sample.width, sample.height).data);
  });
}

function changedPixelRatio(before: number[], after: number[]): number {
  expect(after).toHaveLength(before.length);
  let changed = 0;
  for (let index = 0; index < before.length; index += 4) {
    const difference =
      Math.abs(before[index] - after[index]) +
      Math.abs(before[index + 1] - after[index + 1]) +
      Math.abs(before[index + 2] - after[index + 2]) +
      Math.abs(before[index + 3] - after[index + 3]);
    if (difference > 100) changed += 1;
  }
  return changed / (before.length / 4);
}

for (const tool of tools) {
  test(`${tool.name} advances at 1, 5, 10 and 18 uses and keeps counting after its final stage`, async ({
    page,
  }) => {
    await choose(page, tool.name);
    await expect(doll(page)).toHaveAttribute('data-evolution-tool', tool.id);
    await stage(page, 0, 0);
    await hit(page, 1);
    await stage(page, 1, 1, tool.stages[0]);
    await hit(page, 3);
    await stage(page, 1, 4, tool.stages[0]);
    await hit(page, 1);
    await stage(page, 2, 5, tool.stages[1]);
    await hit(page, 4);
    await stage(page, 2, 9, tool.stages[1]);
    await hit(page, 1);
    await stage(page, 3, 10, tool.stages[2]);
    await hit(page, 7);
    await stage(page, 3, 17, tool.stages[2]);
    await hit(page, 1);
    await stage(page, 4, 18, tool.stages[3]);
    await hit(page, 2);
    await stage(page, 4, 20, tool.stages[3]);
    await expect(page.getByTestId('hit-count')).toHaveText('20');
    await expect(page.getByRole('region', { name: '布偶变化进度' })).toContainText(
      '完整形态已解锁',
    );
  });
}

test('switching tools remembers each tool and strength changes never move stage thresholds', async ({
  page,
}) => {
  await choose(page, '冰冻一下');
  await page.getByRole('slider', { name: '出气力度' }).fill('10');
  await hit(page, 4);
  await stage(page, 1, 4, '初雪发抖');
  await choose(page, '小火苗');
  await stage(page, 0, 0);
  await page.getByRole('slider', { name: '出气力度' }).fill('95');
  await hit(page, 5);
  await stage(page, 2, 5, '开始冒烟');
  await choose(page, '冰冻一下');
  await stage(page, 1, 4, '初雪发抖');
  await hit(page, 1);
  await stage(page, 2, 5, '鼻涕泡泡');
  await choose(page, '小火苗');
  await stage(page, 2, 5, '开始冒烟');
  await expect(page.getByTestId('hit-count')).toHaveText('10');
});

test('holding advances evolution and releasing stops both counters', async ({ page }) => {
  await choose(page, '冰冻一下');
  const box = await doll(page).boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  try {
    await expect
      .poll(async () => Number(await page.getByTestId('tool-hit-count').innerText()))
      .toBeGreaterThanOrEqual(5);
  } finally {
    await page.mouse.up();
  }
  await expect(doll(page)).toHaveAttribute('data-evolution-stage', '2');
  const stopped = await page.getByTestId('tool-hit-count').innerText();
  await page.waitForTimeout(450);
  await expect(page.getByTestId('tool-hit-count')).toHaveText(stopped);
  await expect(page.getByTestId('hit-count')).toHaveText(stopped.padStart(2, '0'));
});

test('restore clears every tool while keeping session records and the chosen color', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const color = page.getByRole('button', { name: '开心绿', exact: true });
  await color.click();
  await choose(page, '小火苗');
  const fresh = await canvasPixels(page);
  await hit(page, 10);
  await choose(page, '冰冻一下');
  await hit(page, 5);
  const total = await page.getByTestId('hit-count').innerText();
  const best = await page.getByTestId('best-combo').innerText();
  await page.getByRole('button', { name: '恢复布偶', exact: true }).click();
  await stage(page, 0, 0);
  await expect(page.getByTestId('hit-count')).toHaveText(total);
  await expect(page.getByTestId('best-combo')).toHaveText(best);
  await expect(color).toHaveAttribute('aria-pressed', 'true');
  await choose(page, '小火苗');
  await stage(page, 0, 0);
  expect(
    changedPixelRatio(fresh, await canvasPixels(page)),
    'Restore returns the actual toy appearance to its chosen color',
  ).toBeLessThan(0.005);
  await hit(page, 1);
  await stage(page, 1, 1, '小火苗');
  await expect(page.getByTestId('hit-count')).toHaveText('16');
});

test('starting again clears tool histories and session records', async ({ page }) => {
  await choose(page, '烦恼旋风');
  await hit(page, 10);
  await choose(page, '冰冻一下');
  await hit(page, 5);
  await page.getByRole('button', { name: '重新开始', exact: true }).click();
  await stage(page, 0, 0);
  await expect(page.getByTestId('hit-count')).toHaveText('00');
  await expect(page.getByTestId('best-combo')).toHaveText('00');
  await choose(page, '烦恼旋风');
  await stage(page, 0, 0);
  await hit(page, 1);
  await stage(page, 1, 1, '微风摇摇');
  await expect(page.getByTestId('hit-count')).toHaveText('01');
});

test('ice has a distinct persistent visual at every intermediate stage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await choose(page, '冰冻一下');
  let previous = await canvasPixels(page);
  for (const [index, addedHits] of [1, 4, 5, 8].entries()) {
    await hit(page, addedHits);
    // Switching away clears impact bursts; returning must display the saved stage itself.
    await choose(page, '拳拳出击');
    await choose(page, '冰冻一下');
    await expect(doll(page)).toHaveAttribute('data-evolution-stage', String(index + 1));
    const current = await canvasPixels(page);
    // A runny-nose bubble is a small facial feature; final forms have a separate 4% check below.
    expect(
      changedPixelRatio(previous, current),
      `Ice stage ${index + 1} visibly develops beyond the preceding stage`,
    ).toBeGreaterThan(0.0005);
    previous = current;
  }
});

for (const name of ['小火苗', '烦恼旋风', '冰冻一下']) {
  test(`${name} visibly transforms the canvas and stays transformed after particles expire with reduced motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await choose(page, name);
    const initial = await canvasPixels(page);
    await hit(page, 18);
    await stage(page, 4, 18);
    // Impact bursts last at most 1050 ms; this checks the persistent toy rather than a flash.
    await page.waitForTimeout(1300);
    const settled = await canvasPixels(page);
    expect(
      changedPixelRatio(initial, settled),
      'The final toy changes a substantial area of the canvas',
    ).toBeGreaterThan(0.04);
    await page.waitForTimeout(1300);
    expect(
      changedPixelRatio(initial, await canvasPixels(page)),
      'The visual state survives after transient effects are gone',
    ).toBeGreaterThan(0.04);
  });
}

test('mobile evolution panel fits the viewport and can restore a final-stage toy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await choose(page, '冰冻一下');
  await hit(page, 18);
  await stage(page, 4, 18, '冻成小冰人');
  const panel = page.getByRole('region', { name: '布偶变化进度' });
  await expect(panel).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
  const bounds = await panel.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  await panel.getByRole('button', { name: '恢复布偶', exact: true }).click();
  await stage(page, 0, 0);
  await expect(page.getByTestId('hit-count')).toHaveText('18');
});

test('a custom photo remains selected and is visibly restored after evolution', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 160;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#d4e6e5';
    context.fillRect(0, 0, 120, 160);
    context.fillStyle = '#e8a983';
    context.beginPath();
    context.ellipse(60, 82, 40, 61, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#433237';
    context.fillRect(24, 28, 72, 25);
    context.fillRect(39, 76, 8, 7);
    context.fillRect(73, 76, 8, 7);
    context.fillRect(48, 109, 24, 5);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByRole('button', { name: '定制我的布偶', exact: true }).click();
  const modal = page.getByRole('dialog', { name: '定制我的布偶' });
  await modal.getByLabel('上传人物照片').setInputFiles({
    name: 'local-face.png',
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  });
  await modal.getByRole('textbox', { name: '布偶小名' }).fill('照片小怪');
  await modal.getByRole('button', { name: '生成我的布偶' }).click();
  await expect(modal).not.toBeVisible();
  await choose(page, '小火苗');
  const photoBefore = await canvasPixels(page);
  await hit(page, 18);
  await page.waitForTimeout(1300);
  expect(changedPixelRatio(photoBefore, await canvasPixels(page))).toBeGreaterThan(0.04);
  await page.getByRole('button', { name: '恢复布偶', exact: true }).click();
  await expect(page.getByText('照片小怪', { exact: true })).toBeVisible();
  await expect(page.getByText('专属照片布偶', { exact: true })).toBeVisible();
  expect(
    changedPixelRatio(photoBefore, await canvasPixels(page)),
    'Restore preserves the rendered custom face',
  ).toBeLessThan(0.005);
  await expect(page.getByTestId('hit-count')).toHaveText('18');
});
