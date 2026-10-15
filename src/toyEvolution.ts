import type { ToolId } from './dollEngine';
import type { ToolProgress } from './progression';

type ToyPose = {
  scaleX: number;
  scaleY: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
};
const TAU = Math.PI * 2;
const coreTools = new Set<ToolId>(['fire', 'ice', 'tornado']);
const colors = ['#efd16f', '#efaca4', '#a9c8d6', '#b4c992', '#bda5db'];

/** Local doll transforms stay small and compensate compression to keep its feet on the floor. */
export function getToyPose(
  tool: ToolId,
  progress: ToolProgress,
  elapsed: number,
  reducedMotion: boolean,
): ToyPose {
  const pose: ToyPose = { scaleX: 1, scaleY: 1, rotation: 0, offsetX: 0, offsetY: 0 };
  const stage = progress.stage;
  if (!stage || coreTools.has(tool)) return pose;
  // The engine supplies milliseconds; all gentle animation rates below use seconds.
  const time = reducedMotion || !Number.isFinite(elapsed) ? 0 : elapsed / 1000;
  if (tool === 'punch') {
    pose.scaleX = [1, 1.015, 1.04, 1.08, 1.2][stage];
    pose.scaleY = [1, 0.99, 0.97, 0.91, 0.57][stage];
  } else if (tool === 'hammer') {
    pose.scaleY = [1, 0.95, 0.86, 0.74, 0.62][stage];
    pose.scaleX = 1 + stage * 0.035;
    if (!reducedMotion && stage >= 3) pose.scaleY += Math.sin(time * 3.6) * 0.016;
  } else if (tool === 'slap') {
    pose.scaleX = 1 + stage * 0.018;
    pose.rotation = reducedMotion ? 0 : Math.sin(time * 2.2) * stage * 0.01;
  } else if (tool === 'pillow') {
    pose.scaleX = 1 + stage * 0.018;
    pose.scaleY = 1 - stage * 0.012;
  } else if (tool === 'tickle') {
    pose.scaleX = stage === 4 ? 0.74 : stage >= 3 ? 1.03 : 1;
    pose.scaleY = stage === 4 ? 0.74 : stage === 3 ? 0.95 : 1;
    pose.rotation = reducedMotion
      ? stage === 4
        ? 0.08
        : 0
      : stage === 4
        ? (time * 1.6) % TAU
        : Math.sin(time * 2.8) * stage * 0.018;
    pose.offsetX = reducedMotion || stage < 4 ? 0 : Math.sin(time * 1.6) * 12;
  } else if (tool === 'hug') {
    pose.scaleX = 1 + stage * 0.012;
    pose.scaleY = 1 - stage * 0.012;
    pose.rotation = reducedMotion ? 0 : Math.sin(time * 1.1) * stage * 0.006;
  } else if (tool === 'confetti') {
    pose.rotation = reducedMotion ? 0 : Math.sin(time * 1.7) * stage * 0.007;
  }
  pose.offsetY = 195 * (1 - pose.scaleY) - Math.abs(Math.sin(pose.rotation)) * 73;
  return pose;
}

function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  rotation = 0,
  stroke?: string,
): void {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, TAU);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.5;
    c.stroke();
  }
}

function star(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  rotation = 0,
): void {
  c.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = rotation - Math.PI / 2 + (i * Math.PI) / 5;
    const r = radius * (i % 2 ? 0.46 : 1);
    const px = x + Math.cos(angle) * r,
      py = y + Math.sin(angle) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function heart(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill: string,
  stroke?: string,
): void {
  c.beginPath();
  c.moveTo(x, y + size * 0.78);
  c.bezierCurveTo(
    x - size * 1.35,
    y - size * 0.08,
    x - size * 0.8,
    y - size * 1.02,
    x,
    y - size * 0.38,
  );
  c.bezierCurveTo(
    x + size * 0.8,
    y - size * 1.02,
    x + size * 1.35,
    y - size * 0.08,
    x,
    y + size * 0.78,
  );
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}

function plaster(c: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.fillStyle = '#f2dcb3';
  c.strokeStyle = '#c4a77f';
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(-25, -9, 50, 18, 7);
  c.fill();
  c.stroke();
  c.fillStyle = '#e2c28f';
  c.fillRect(-9, -8, 18, 16);
  for (const px of [-18, 18]) for (const py of [-3, 3]) ellipse(c, px, py, 1, 1, '#c8ad86');
  c.restore();
}

function feather(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
): void {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  ellipse(c, 0, 0, size * 0.38, size, '#fffdf5', -0.15, '#b8afcb');
  c.strokeStyle = '#b0a5c5';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, size * 1.35);
  c.lineTo(0, -size * 0.75);
  for (let i = -2; i <= 2; i += 1) {
    c.moveTo(0, i * size * 0.22);
    c.lineTo(size * 0.26, i * size * 0.22 - size * 0.17);
  }
  c.stroke();
  c.restore();
}

function tomato(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  sliced = false,
): void {
  ellipse(c, x, y, size, size * 0.87, '#f18a59', 0, '#db7148');
  if (sliced) {
    ellipse(c, x, y, size * 0.76, size * 0.64, '#ffc58a');
    for (let i = 0; i < 5; i += 1) {
      const angle = (i * TAU) / 5;
      ellipse(
        c,
        x + Math.cos(angle) * size * 0.43,
        y + Math.sin(angle) * size * 0.36,
        size * 0.19,
        size * 0.1,
        '#ed8c59',
        angle,
      );
      ellipse(
        c,
        x + Math.cos(angle) * size * 0.43,
        y + Math.sin(angle) * size * 0.36,
        size * 0.06,
        size * 0.04,
        '#fff0bb',
      );
    }
  } else {
    star(c, x, y - size * 0.67, size * 0.55, '#8aab67', 0.12);
    ellipse(c, x - size * 0.37, y - size * 0.2, size * 0.1, size * 0.23, '#ffd0a0', 0.6);
  }
}

function cloud(c: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ellipse(c, x, y + size * 0.17, size, size * 0.5, '#fdfbf5', 0, '#d5cce3');
  ellipse(c, x - size * 0.48, y, size * 0.49, size * 0.45, '#fdfbf5');
  ellipse(c, x + size * 0.08, y - size * 0.23, size * 0.59, size * 0.53, '#fffdf8');
  ellipse(c, x + size * 0.57, y + size * 0.02, size * 0.43, size * 0.4, '#fdfbf5');
}

function bolt(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
): void {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.beginPath();
  c.moveTo(2, -size);
  c.lineTo(-size * 0.5, size * 0.12);
  c.lineTo(0, size * 0.05);
  c.lineTo(-2, size);
  c.lineTo(size * 0.55, -size * 0.16);
  c.lineTo(size * 0.08, -size * 0.05);
  c.closePath();
  c.fillStyle = '#ffe082';
  c.fill();
  c.strokeStyle = '#c29c49';
  c.lineWidth = 1.4;
  c.stroke();
  c.restore();
}

/** Persistent, deterministic costume changes. The central photo remains readable. */
export function drawToyDecorations(
  c: CanvasRenderingContext2D,
  tool: ToolId,
  progress: ToolProgress,
  elapsed: number,
  reducedMotion: boolean,
  hasPhoto: boolean,
): void {
  const stage = progress.stage;
  if (!stage || coreTools.has(tool)) return;
  const time = reducedMotion || !Number.isFinite(elapsed) ? 0 : elapsed / 1000;
  const float = reducedMotion ? 0 : Math.sin(time * 1.7) * 2;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';

  if (tool === 'punch') {
    const positions = [
      [-86, -166],
      [88, -153],
      [57, -190],
      [-100, -117],
    ];
    for (let i = 0; i < Math.min(4, stage + 1); i += 1) {
      const [x, y] = positions[i];
      star(c, x, y + float * (i % 2 ? -1 : 1), 8 + (i % 2) * 3, '#f4d06d', time * 0.25 + i);
    }
    if (stage >= 2 && !hasPhoto) for (const x of [-25, 25]) star(c, x, -120, 9, '#d6ab45', 0.08);
    if (stage >= 3) {
      plaster(c, -38, 27, -0.35);
      plaster(c, 75, -66, 0.67);
    }
    if (stage >= 4) {
      plaster(c, 36, 97, 0.38);
      for (const x of [-86, 86]) {
        cloud(c, x, 145, 17);
        star(c, x * 1.1, 119, 5, '#f0cc72');
      }
    }
  } else if (tool === 'slap') {
    const puff = [0, 10, 18, 23, 28][stage];
    for (const side of [-1, 1]) {
      ellipse(c, side * 70, -98, puff, puff * 0.77, '#f4bbb2', side * 0.12, '#d99b9c');
      ellipse(c, side * 76, -104, puff * 0.27, puff * 0.12, '#ffe5d5', -side * 0.4);
      c.strokeStyle = '#cb8d95';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(side * 73, -91);
      c.lineTo(side * 80, -93);
      c.stroke();
    }
    if (stage >= 3) {
      c.strokeStyle = '#ae9bc7';
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 50; i += 1) {
        const angle = i * 0.23 + time * 0.28;
        const x = Math.cos(angle) * (10 + i * 0.44),
          y = -182 + Math.sin(angle) * (3 + i * 0.11);
        if (!i) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      star(c, -42, -187, 7, '#eed176');
      star(c, 43, -179, 6, '#b4ca91');
    }
    if (stage === 4)
      for (const side of [-1, 1]) {
        ellipse(c, side * 102, -133 + float, 7, 10, '#f1cbbb', side * 0.15, '#d6a9aa');
        c.strokeStyle = '#d6a9aa';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(side * 102, -123 + float);
        c.quadraticCurveTo(side * 110, -104, side * 100, -83);
        c.stroke();
      }
  } else if (tool === 'hammer') {
    const bands = stage === 1 ? 2 : stage + 3;
    c.lineWidth = stage >= 3 ? 6 : 3;
    for (let i = 0; i < bands; i += 1) {
      const y = 4 + i * (128 / bands);
      c.strokeStyle = i % 2 ? '#8f78b5aa' : '#e5d6f4';
      c.beginPath();
      c.moveTo(-64 + i * 0.8, y);
      c.quadraticCurveTo(0, y + 16, 64 - i * 0.8, y);
      c.stroke();
    }
    if (stage >= 3) {
      c.strokeStyle = '#9277ad';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-22, -183);
      for (let i = 0; i < 8; i += 1) c.lineTo(i % 2 ? 18 : -18, -184 - i * 3.1);
      c.stroke();
      ellipse(c, 0, -207, 25, 4, '#c9b5e1', 0, '#9277ad');
    }
    if (stage === 4) {
      plaster(c, -40, 86, -0.15);
      star(c, 97, -105 + float, 11, '#efd077');
    }
  } else if (tool === 'tomato') {
    const spots = [
      [-35, 17],
      [45, 80],
      [-53, 102],
      [55, -31],
      [-70, -62],
      [77, 25],
      [1, 132],
      [-5, 65],
      [78, -151],
      [-83, -139],
    ];
    const count = [0, 1, 3, 6, 10][stage];
    if (stage === 4) {
      c.beginPath();
      c.roundRect(-69, -7, 138, 141, 46);
      c.fillStyle = '#f6a165cc';
      c.fill();
      star(c, 0, -11, 24, '#91ad67', 0.2);
    }
    for (let i = 0; i < count; i += 1) {
      const [x, y] = spots[i];
      const size = 8 + (i % 3) * 3;
      for (let petal = 0; petal < 5; petal += 1) {
        const a = (petal * TAU) / 5 + i;
        ellipse(
          c,
          x + Math.cos(a) * size * 0.6,
          y + Math.sin(a) * size * 0.6,
          size * 0.6,
          size * 0.5,
          '#f39a63',
        );
      }
      tomato(c, x, y, size, i % 2 === 0);
    }
    if (stage >= 3) tomato(c, 0, 56, stage === 4 ? 32 : 22, true);
  } else if (tool === 'pillow') {
    if (stage >= 2) {
      cloud(c, -83, 52, 24 + stage * 5);
      cloud(c, 84, 65, 22 + stage * 5);
    }
    if (stage >= 3) {
      cloud(c, -51, 119, 49);
      cloud(c, 52, 130, 48);
    }
    if (stage === 4) {
      cloud(c, 0, 50, 73);
      cloud(c, 0, 116, 75);
    }
    const positions = [
      [-109, -134],
      [102, -62],
      [-87, 110],
      [92, 132],
      [-48, -189],
      [111, 20],
      [-109, 45],
      [59, 16],
    ];
    for (let i = 0; i < Math.min(8, stage * 2); i += 1) {
      const [x, y] = positions[i];
      feather(c, x, y + float * (i % 2 ? 1 : -1), i * 0.9 - 0.6, 10 + (i % 3) * 2);
    }
  } else if (tool === 'lightning') {
    if (stage >= 2) {
      c.save();
      c.shadowColor = '#f4d469';
      c.shadowBlur = stage >= 3 ? 11 : 4;
      c.beginPath();
      for (let i = 0; i <= 24; i += 1) {
        const angle = Math.PI + (i * Math.PI) / 24;
        const spike = i % 2 ? stage * 3 : 0;
        const x = Math.cos(angle) * (89 + spike),
          y = Math.max(-210, -113 + Math.sin(angle) * (85 + spike));
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      for (let i = 24; i >= 0; i -= 1) {
        const angle = Math.PI + (i * Math.PI) / 24;
        c.lineTo(Math.cos(angle) * 76, -113 + Math.sin(angle) * 66);
      }
      c.closePath();
      c.fillStyle = stage === 4 ? '#dfc56c' : '#b29ad4';
      c.fill();
      c.strokeStyle = stage === 4 ? '#bba255' : '#947ab7';
      c.lineWidth = 1.6;
      c.stroke();
      c.restore();
    }
    bolt(c, -111, -74 + float, 12 + stage * 2, -0.2);
    if (stage >= 2) bolt(c, 108, -28 - float, 13 + stage * 2, 0.2);
    if (stage >= 3) {
      bolt(c, -77, 106, 14, -0.4);
      bolt(c, 73, 91, 14, 0.4);
    }
    if (stage === 4) {
      star(c, -111, -157, 9, '#f5d66b');
      star(c, 110, -137, 8, '#f5d66b');
      c.strokeStyle = '#f8e397';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 58, 35, -0.8, 0.8);
      c.stroke();
      bolt(c, 0, 58, 23, 0);
    }
  } else if (tool === 'tickle') {
    if (!hasPhoto) {
      c.strokeStyle = '#69506e';
      c.lineWidth = 3.2;
      for (const x of [-25, 25]) {
        ellipse(c, x, -120, 10, 11, '#fbefdc');
        c.beginPath();
        c.moveTo(x - 7, -118);
        c.quadraticCurveTo(x, -130, x + 7, -118);
        c.stroke();
      }
      if (stage >= 2) {
        c.beginPath();
        c.arc(0, -103, 14, 0.17, Math.PI - 0.17);
        c.stroke();
      }
    }
    for (const side of [-1, 1]) {
      ellipse(c, side * (hasPhoto ? 71 : 43), -99, 8 + stage, 4.5, '#f0aeb0aa', side * 0.15);
      feather(c, side * 112, 12 + side * float, side * 0.7, 13);
    }
    if (stage >= 3)
      for (const side of [-1, 1]) {
        c.save();
        c.translate(side * (hasPhoto ? 70 : 48), -104 + float * side);
        c.rotate(-side * 0.3);
        c.beginPath();
        c.moveTo(0, -5);
        c.bezierCurveTo(-11, 6, -7, 16, 0, 16);
        c.bezierCurveTo(7, 16, 11, 6, 0, -5);
        c.fillStyle = '#99cede';
        c.fill();
        ellipse(c, -2, 7, 2, 4, '#e4f8f6');
        c.restore();
      }
    if (stage === 4)
      for (let i = 0; i < 5; i += 1)
        star(c, -106 + i * 52, 156 + (i % 2) * 17, 5 + (i % 2), colors[i], i * 0.6);
  } else if (tool === 'confetti') {
    for (let i = 0; i < stage * 3; i += 1) {
      const x = Math.sin(i * 11.73 + 0.4) * 123,
        y = -185 + ((i * 73) % 315);
      if (Math.abs(x) < 72 && y < -48) continue;
      c.save();
      c.translate(x, y + float * (i % 2 ? -1 : 1));
      c.rotate(i * 0.77);
      c.fillStyle = colors[i % colors.length];
      c.fillRect(-3, -5, 6, 10);
      c.restore();
    }
    if (stage >= 2) {
      c.beginPath();
      c.moveTo(-31, -174);
      c.lineTo(0, -210);
      c.lineTo(31, -174);
      c.closePath();
      c.fillStyle = '#edbd7b';
      c.fill();
      c.strokeStyle = '#c28e69';
      c.lineWidth = 1.5;
      c.stroke();
      c.strokeStyle = '#c49abd';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-18, -189);
      c.lineTo(18, -189);
      c.stroke();
      ellipse(c, 0, -207, 5, 5, '#eadb9b');
    }
    if (stage >= 3) {
      for (const side of [-1, 1]) {
        c.strokeStyle = side < 0 ? '#c6a0cc' : '#e6b26e';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(side * 110, -163);
        c.bezierCurveTo(side * 82, -133, side * 139, -114, side * 111, -82);
        c.bezierCurveTo(side * 89, -58, side * 136, -40, side * 112, -10);
        c.stroke();
      }
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(0, -28);
        c.lineTo(side * 24, -41);
        c.lineTo(side * 24, -16);
        c.closePath();
        c.fillStyle = '#bc8fae';
        c.fill();
      }
      ellipse(c, 0, -28, 7, 7, '#e8b2a5');
    }
    if (stage === 4) {
      c.strokeStyle = '#d9b659';
      c.lineWidth = 3.5;
      for (const x of [-25, 25]) {
        c.beginPath();
        c.roundRect(x - 20, -135, 40, 28, 11);
        c.fillStyle = '#f4dc8a24';
        c.fill();
        c.stroke();
      }
      c.beginPath();
      c.moveTo(-5, -122);
      c.quadraticCurveTo(0, -128, 5, -122);
      c.stroke();
      for (const side of [-1, 1]) {
        const x = side * 119,
          y = side < 0 ? -117 : -85;
        c.strokeStyle = '#c4a2ba';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x, y + 22);
        c.bezierCurveTo(x - side * 16, y + 55, x + side * 11, y + 82, side * 91, 25);
        c.stroke();
        ellipse(c, x, y + float, 18, 24, side < 0 ? '#c6addb' : '#eeb0a6', side * 0.1, '#bd97b5');
        ellipse(c, x - 5, y - 8 + float, 3, 6, '#fff2e3aa', 0.35);
      }
    }
  } else if (tool === 'hug') {
    for (const side of [-1, 1]) heart(c, side * 96, -70 + float * side, 10 + stage, '#e7acb8');
    if (stage >= 2) {
      c.beginPath();
      c.roundRect(-73, -45, 146, 26, 11);
      c.fillStyle = '#e8bb9f';
      c.fill();
      c.beginPath();
      c.roundRect(31, -29, 27, 74, 9);
      c.fillStyle = '#e2ae99';
      c.fill();
      c.strokeStyle = '#f6dcc0';
      c.lineWidth = 3;
      for (const y of [-39, -29]) {
        c.beginPath();
        c.moveTo(-61, y);
        c.lineTo(60, y);
        c.stroke();
      }
      for (const y of [-12, 7, 26]) {
        c.beginPath();
        c.moveTo(33, y);
        c.lineTo(55, y);
        c.stroke();
      }
    }
    if (stage >= 3) {
      c.beginPath();
      c.roundRect(-78, 10, 156, 139, 35);
      c.fillStyle = '#e6c3c9';
      c.fill();
      c.strokeStyle = '#c69faa';
      c.lineWidth = 2;
      c.stroke();
      for (let i = 0; i < 6; i += 1)
        heart(c, ((i % 3) - 1) * 43, 42 + Math.floor(i / 3) * 61, 10, '#fff0df');
      c.setLineDash([4, 5]);
      c.strokeStyle = '#fff1df';
      c.beginPath();
      c.roundRect(-70, 18, 140, 122, 28);
      c.stroke();
      c.setLineDash([]);
    }
    ellipse(c, -45, 61, 20, 49, '#c6b1df', -0.9, '#a28abf');
    ellipse(c, 45, 61, 20, 49, '#c6b1df', 0.9, '#a28abf');
    if (stage === 4) {
      heart(c, 0, 66, 75, '#e9a9b5', '#c8899b');
      c.save();
      c.globalAlpha = 0.6;
      heart(c, -20, 41, 21, '#ffe8d8');
      c.restore();
      for (const side of [-1, 1]) {
        heart(c, side * 113, 34 - float * side, 12, '#c8afd6');
        heart(c, side * 94, 128, 10, '#ecbd9f');
      }
    }
  }

  c.restore();
}
