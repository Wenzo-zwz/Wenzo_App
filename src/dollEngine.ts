export type ToolId =
  | 'punch'
  | 'slap'
  | 'hammer'
  | 'tomato'
  | 'pillow'
  | 'lightning'
  | 'tornado'
  | 'ice'
  | 'fire'
  | 'tickle'
  | 'confetti'
  | 'hug';
export type DollStyle = 'lavender' | 'peach' | 'mint';

type Palette = { light: string; main: string; dark: string; seam: string; inner: string };
type ParticleKind =
  'star' | 'circle' | 'line' | 'heart' | 'snow' | 'confetti' | 'feather' | 'flame';
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  kind: ParticleKind;
  rotation: number;
  spin: number;
};
type Burst = {
  x: number;
  y: number;
  age: number;
  duration: number;
  tool: ToolId;
  text: string;
  angle: number;
  strength: number;
};

const palettes: Record<DollStyle, Palette> = {
  lavender: {
    light: '#d6c8fa',
    main: '#b8a0e3',
    dark: '#9980c5',
    seam: '#8268ad',
    inner: '#ecdcf7',
  },
  peach: { light: '#ffd9c9', main: '#f3b7a6', dark: '#db958c', seam: '#bc7f7d', inner: '#ffe9e0' },
  mint: { light: '#d6eee1', main: '#abd3c1', dark: '#8ab5a2', seam: '#6e9886', inner: '#e5f4e9' },
};

const comicText: Record<ToolId, string[]> = {
  punch: ['砰！', '烦恼退散！', '嘭！'],
  slap: ['啪！', '清空坏心情！'],
  hammer: ['咚——！', '压力扁扁！'],
  tomato: ['噗叽！', '番茄暴击！'],
  pillow: ['噗呼～', '软绵绵攻击！'],
  lightning: ['滋啦！', '充走坏情绪！'],
  tornado: ['呼呼——', '烦恼卷走！'],
  ice: ['咔嚓！', '冷静一下～'],
  fire: ['呼！', '气气烧光！'],
  tickle: ['哈哈哈！', '痒痒痒～'],
  confetti: ['芜湖！', '快乐爆发！'],
  hug: ['抱抱～', '一切都会好的'],
};

const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));
const random = (low: number, high: number) => low + Math.random() * (high - low);

/** A canvas-only plush toy. All public hit coordinates are in CSS pixels. */
export class DollEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private observer: ResizeObserver;
  private frame = 0;
  private destroyed = false;
  private width = 1;
  private height = 1;
  private scale = 1;
  private style: DollStyle = 'lavender';
  private face: HTMLCanvasElement | null = null;
  private particles: Particle[] = [];
  private bursts: Burst[] = [];
  private previousTime = 0;
  private elapsed = 0;
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private rotation = 0;
  private rotationVelocity = 0;
  private squash = 0;
  private expressionUntil = 0;
  private expression: ToolId = 'punch';
  private motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  private reducedMotion = this.motionQuery.matches;
  private onImpact?: () => void;
  private texture: { x: number; y: number; angle: number }[] = Array.from(
    { length: 112 },
    (_, i) => ({
      x: Math.sin(i * 127.1 + 13) * 92,
      y: Math.sin(i * 311.7 + 41) * 110,
      angle: Math.sin(i * 23.4) * Math.PI,
    }),
  );

  constructor(canvas: HTMLCanvasElement, onImpact?: () => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser does not support a 2D canvas.');
    this.ctx = context;
    this.onImpact = onImpact;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.motionQuery.addEventListener('change', this.handleMotionChange);
    this.resize();
    this.frame = requestAnimationFrame(this.animate);
  }

  setStyle(style: DollStyle) {
    this.style = style;
  }

  setFace(image: HTMLCanvasElement | null) {
    this.face = image;
  }

  hit(tool: ToolId, intensity: number, x?: number, y?: number) {
    if (this.destroyed) return;
    const normalized = Number.isFinite(intensity) ? intensity / 100 : 0.5;
    const strength = 0.55 + clamp(normalized, 0, 1) * 1.15;
    const hitX = x ?? this.width / 2;
    const hitY = y ?? this.height * 0.43;
    const direction = hitX < this.width / 2 ? 1 : -1;
    const gentle = tool === 'hug' || tool === 'tickle' || tool === 'confetti';
    if (!this.reducedMotion) {
      this.vx += direction * (gentle ? 2.5 : 12) * strength;
      this.vy -= (gentle ? 2 : tool === 'hammer' ? 1 : 8) * strength;
      this.rotationVelocity +=
        direction * (tool === 'tornado' ? 0.12 : gentle ? 0.013 : 0.045) * strength;
      this.squash = Math.min(0.24, (tool === 'hammer' ? 0.2 : 0.12) * strength);
    }
    this.expression = tool;
    this.expressionUntil = this.elapsed + 850;
    const words = comicText[tool];
    this.bursts.push({
      x: hitX,
      y: hitY,
      age: 0,
      duration: this.reducedMotion ? 700 : 1050,
      tool,
      text: words[Math.floor(Math.random() * words.length)],
      angle: random(-0.13, 0.13),
      strength,
    });
    this.bursts = this.bursts.slice(-5);
    this.emitParticles(tool, hitX, hitY, strength);
    this.onImpact?.();
  }

  reset() {
    this.x = this.y = this.vx = this.vy = this.rotation = this.rotationVelocity = this.squash = 0;
    this.particles = [];
    this.bursts = [];
    this.expressionUntil = 0;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.motionQuery.removeEventListener('change', this.handleMotionChange);
    this.particles = [];
    this.bursts = [];
    this.face = null;
  }

  private handleMotionChange = () => {
    this.reducedMotion = this.motionQuery.matches;
    if (this.reducedMotion) {
      this.x = this.y = this.vx = this.vy = this.rotation = this.rotationVelocity = this.squash = 0;
    }
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = Math.min(this.width / 430, this.height / 475);
  }

  private animate = (time: number) => {
    if (this.destroyed) return;
    const ms = this.previousTime ? Math.min(40, time - this.previousTime) : 16.67;
    this.previousTime = time;
    this.elapsed += ms;
    const dt = ms / 16.67;
    const damping = Math.pow(0.81, dt);
    this.vx = (this.vx - this.x * 0.12 * dt) * damping;
    this.vy = (this.vy - this.y * 0.12 * dt) * damping;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotationVelocity = (this.rotationVelocity - this.rotation * 0.1 * dt) * damping;
    this.rotation += this.rotationVelocity * dt;
    this.squash *= Math.pow(0.84, dt);
    for (const particle of this.particles) {
      particle.life -= ms;
      if (!this.reducedMotion) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy +=
          (particle.kind === 'heart' || particle.kind === 'flame' ? -0.025 : 0.11) * dt;
        particle.vx *= Math.pow(0.985, dt);
        particle.rotation += particle.spin * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const burst of this.bursts) burst.age += ms;
    this.bursts = this.bursts.filter((b) => b.age < b.duration);
    this.draw();
    this.frame = requestAnimationFrame(this.animate);
  };

  private draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);
    const centerX = this.width / 2;
    const centerY = this.height * 0.505;
    const breathe = this.reducedMotion ? 0 : Math.sin(this.elapsed / 1350) * 2.4;

    c.save();
    c.translate(centerX, centerY);
    c.scale(this.scale, this.scale);
    const shadow = c.createRadialGradient(0, 195, 5, 0, 195, 120);
    shadow.addColorStop(0, 'rgba(119, 89, 147, .17)');
    shadow.addColorStop(0.68, 'rgba(119, 89, 147, .07)');
    shadow.addColorStop(1, 'rgba(119, 89, 147, 0)');
    c.fillStyle = shadow;
    c.beginPath();
    c.ellipse(0, 195, 131, 23, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.save();
    c.translate(centerX + this.x, centerY + this.y + breathe);
    c.scale(this.scale, this.scale);
    c.rotate(clamp(this.rotation, -0.7, 0.7));
    c.scale(1 + this.squash, 1 - this.squash * 0.8);
    this.drawDoll();
    c.restore();
    this.drawEffects();
    this.drawParticles();
    this.drawComicText();
  }

  private plushGradient(x: number, y: number, radius: number) {
    const p = palettes[this.style];
    const gradient = this.ctx.createRadialGradient(
      x - radius * 0.5,
      y - radius * 0.7,
      radius * 0.1,
      x + radius * 0.3,
      y + radius * 0.5,
      radius * 1.6,
    );
    gradient.addColorStop(0, p.light);
    gradient.addColorStop(0.64, p.main);
    gradient.addColorStop(1, p.dark);
    return gradient;
  }

  private ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    fill: string | CanvasGradient,
    rotation = 0,
    stroke?: string,
  ) {
    const c = this.ctx;
    c.beginPath();
    c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.5;
      c.stroke();
    }
  }

  private drawDoll() {
    const c = this.ctx;
    const p = palettes[this.style];
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // Back limbs, each padded separately so their seams catch the light.
    this.ellipse(-97, 39, 29, 63, this.plushGradient(-100, 20, 59), 0.55, p.seam + '45');
    this.ellipse(97, 39, 29, 63, this.plushGradient(95, 20, 59), -0.55, p.seam + '45');
    this.ellipse(-48, 163, 40, 34, this.plushGradient(-48, 150, 45), -0.14, p.seam + '45');
    this.ellipse(48, 163, 40, 34, this.plushGradient(48, 150, 45), 0.14, p.seam + '45');
    c.save();
    c.strokeStyle = p.seam + '66';
    c.lineWidth = 1.6;
    for (const direction of [-1, 1]) {
      c.beginPath();
      c.moveTo(direction * 104, 55);
      c.quadraticCurveTo(direction * 115, 65, direction * 116, 74);
      c.stroke();
      c.beginPath();
      c.moveTo(direction * 42, 178);
      c.lineTo(direction * 44, 186);
      c.stroke();
      c.beginPath();
      c.moveTo(direction * 55, 177);
      c.lineTo(direction * 58, 184);
      c.stroke();
    }
    c.restore();

    // Pear-shaped stuffed body.
    c.beginPath();
    c.moveTo(-49, -47);
    c.bezierCurveTo(-85, -22, -89, 25, -87, 72);
    c.bezierCurveTo(-87, 128, -63, 164, 0, 164);
    c.bezierCurveTo(63, 164, 87, 128, 87, 72);
    c.bezierCurveTo(89, 25, 85, -22, 49, -47);
    c.closePath();
    c.fillStyle = this.plushGradient(-10, 45, 105);
    c.fill();
    c.lineWidth = 1.6;
    c.strokeStyle = p.seam + '50';
    c.stroke();
    c.save();
    c.clip();
    this.drawTexture(0, 58, 0.86);
    const belly = c.createRadialGradient(-19, 44, 0, 0, 68, 80);
    belly.addColorStop(0, '#ffffff25');
    belly.addColorStop(1, '#ffffff00');
    this.ellipse(0, 61, 79, 94, belly);
    c.restore();

    c.save();
    c.setLineDash([2, 5]);
    c.lineWidth = 1.3;
    c.strokeStyle = p.seam + '68';
    c.beginPath();
    c.moveTo(-68, 48);
    c.bezierCurveTo(-74, 104, -56, 144, -13, 150);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -7);
    c.quadraticCurveTo(-8, 33, 0, 48);
    c.stroke();
    c.restore();

    // A tiny woven side label and embroidered heart patch.
    c.save();
    c.translate(85, 103);
    c.rotate(-0.09);
    this.roundRect(-3, -8, 25, 16, 3);
    c.fillStyle = '#fff9ee';
    c.fill();
    c.fillStyle = '#ad9388';
    c.font = '600 5.8px sans-serif';
    c.textAlign = 'center';
    c.fillText('SOFT', 10, 2);
    c.restore();
    c.save();
    c.translate(0, 66);
    c.rotate(-0.09);
    this.heart(0, 0, 21);
    c.fillStyle = p.inner;
    c.fill();
    c.setLineDash([1.5, 3]);
    c.lineWidth = 1.2;
    c.strokeStyle = p.seam + '70';
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = '#ffffffbb';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-5, -2);
    c.lineTo(4, 7);
    c.moveTo(4, -2);
    c.lineTo(-5, 7);
    c.stroke();
    c.restore();

    // Round bear ears behind the broad, cushioned head.
    this.ellipse(-68, -171, 30, 32, this.plushGradient(-67, -177, 34), -0.22, p.seam + '60');
    this.ellipse(68, -171, 30, 32, this.plushGradient(65, -177, 34), 0.22, p.seam + '60');
    this.ellipse(-68, -171, 15, 18, p.inner, -0.22);
    this.ellipse(68, -171, 15, 18, p.inner, 0.22);

    // Small neck shadow gives the head a tangible stuffed-toy silhouette.
    this.ellipse(0, -24, 57, 17, p.seam + '22');
    this.ellipse(0, -115, 96, 85, this.plushGradient(-17, -144, 99), 0, p.seam + '50');
    c.save();
    c.beginPath();
    c.ellipse(0, -115, 96, 85, 0, 0, Math.PI * 2);
    c.clip();
    this.drawTexture(0, -115, 0.8);
    c.restore();

    // Fine hand-sewn line around the jaw.
    c.save();
    c.setLineDash([2.1, 4.6]);
    c.strokeStyle = p.seam + '77';
    c.lineWidth = 1.4;
    c.beginPath();
    c.ellipse(0, -115, 87, 77, 0, 0.19, Math.PI - 0.19);
    c.stroke();
    c.beginPath();
    c.moveTo(-6, -193);
    c.quadraticCurveTo(-10, -178, -6, -168);
    c.stroke();
    c.restore();

    const faceGradient = c.createLinearGradient(-36, -167, 35, -55);
    faceGradient.addColorStop(0, '#fff8ec');
    faceGradient.addColorStop(1, '#f4e3ce');
    this.ellipse(0, -111, 65, 59, faceGradient);
    if (this.face && this.face.width > 0 && this.face.height > 0) {
      c.save();
      c.beginPath();
      c.ellipse(0, -111, 62, 56, 0, 0, Math.PI * 2);
      c.clip();
      const side = Math.min(this.face.width, this.face.height);
      c.drawImage(
        this.face,
        (this.face.width - side) / 2,
        (this.face.height - side) / 2,
        side,
        side,
        -63,
        -174,
        126,
        126,
      );
      c.restore();
      c.strokeStyle = '#fffaf0';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, -111, 63, 57, 0, 0, Math.PI * 2);
      c.stroke();
    } else {
      this.drawFace();
    }

    // Light on the plush fibers, kept well clear of the face.
    c.strokeStyle = '#ffffff57';
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(0, -115, 86, 75, 0, Math.PI * 1.12, Math.PI * 1.37);
    c.stroke();
  }

  private drawTexture(offsetX: number, offsetY: number, scale: number) {
    const c = this.ctx;
    c.lineWidth = 0.75;
    for (let i = 0; i < this.texture.length; i++) {
      const speckle = this.texture[i];
      const x = offsetX + speckle.x * scale;
      const y = offsetY + speckle.y * scale;
      c.strokeStyle = i % 3 === 0 ? '#68518113' : '#ffffff35';
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(speckle.angle) * 2.2, y + Math.sin(speckle.angle) * 2.2);
      c.stroke();
    }
  }

  private drawFace() {
    const c = this.ctx;
    const active = this.elapsed < this.expressionUntil;
    const happy = active && ['hug', 'tickle', 'confetti', 'pillow'].includes(this.expression);
    const blink = !this.reducedMotion && this.elapsed % 5700 > 5520;
    const squeezed =
      active && ['punch', 'slap', 'hammer', 'lightning', 'ice'].includes(this.expression);
    c.fillStyle = '#493c50';
    c.strokeStyle = '#493c50';
    c.lineWidth = 3;
    for (const direction of [-1, 1]) {
      const x = direction * 23;
      if (active && this.expression === 'hug') {
        this.heart(x, -119, 8);
        c.fillStyle = '#de849c';
        c.fill();
        c.fillStyle = '#493c50';
      } else if (blink || happy) {
        c.beginPath();
        c.moveTo(x - 7, -116);
        c.quadraticCurveTo(x, -126, x + 7, -116);
        c.stroke();
      } else if (squeezed) {
        c.beginPath();
        c.moveTo(x - direction * 6, -125);
        c.lineTo(x + direction * 3, -119);
        c.lineTo(x - direction * 6, -113);
        c.stroke();
      } else {
        this.ellipse(x, -120, 5, 7, '#493c50');
        this.ellipse(x - 1.2, -122.5, 1.35, 1.7, '#ffffff');
      }
    }
    this.ellipse(-40, -102, 10, 5.5, '#edb3aa80', -0.1);
    this.ellipse(40, -102, 10, 5.5, '#edb3aa80', 0.1);
    this.ellipse(0, -109, 4.5, 3.2, '#b6938b');
    c.strokeStyle = '#69515b';
    c.lineWidth = 2.3;
    if (active && !happy && !squeezed) {
      this.ellipse(0, -94, 6, 7, '#91616f');
    } else {
      c.beginPath();
      c.moveTo(-10, -99);
      c.quadraticCurveTo(0, happy ? -83 : -87, 10, -99);
      c.stroke();
    }
    // Embroidered brows give the neutral doll a gentle, slightly bemused face.
    c.strokeStyle = '#9e867c';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-31, -139);
    c.quadraticCurveTo(-25, -143, -19, -140);
    c.stroke();
    c.beginPath();
    c.moveTo(19, -140);
    c.quadraticCurveTo(25, -143, 31, -139);
    c.stroke();
  }

  private emitParticles(tool: ToolId, x: number, y: number, strength: number) {
    const config: Record<ToolId, { kind: ParticleKind; colors: string[]; count: number }> = {
      punch: { kind: 'star', colors: ['#ffc85e', '#f5a94e', '#ffffff'], count: 15 },
      slap: { kind: 'line', colors: ['#ed9eaa', '#eec76e', '#ffffff'], count: 19 },
      hammer: { kind: 'star', colors: ['#b9a1e4', '#f8ca65', '#ffffff'], count: 22 },
      tomato: { kind: 'circle', colors: ['#f17c6d', '#eea06f', '#f8b5a8'], count: 23 },
      pillow: { kind: 'feather', colors: ['#fffefb', '#dfd3f0', '#f7e9f1'], count: 22 },
      lightning: { kind: 'line', colors: ['#f7d85f', '#fff5af', '#bba3ef'], count: 25 },
      tornado: { kind: 'feather', colors: ['#c5b1ea', '#a8cddd', '#ffffff'], count: 28 },
      ice: { kind: 'snow', colors: ['#a7dae7', '#cdeef2', '#ffffff'], count: 25 },
      fire: { kind: 'flame', colors: ['#fac36d', '#f39372', '#ffe2a0'], count: 25 },
      tickle: { kind: 'circle', colors: ['#ecc3de', '#d1b9ee', '#f9d68c'], count: 18 },
      confetti: {
        kind: 'confetti',
        colors: ['#bc9ce5', '#ffc868', '#ea9fbc', '#9dceb9', '#8ecbdc'],
        count: 46,
      },
      hug: { kind: 'heart', colors: ['#eeb0c8', '#d49ac1', '#f4c3b6'], count: 20 },
    };
    const entry = config[tool];
    const count = this.reducedMotion ? 5 : Math.round(entry.count * (0.7 + strength * 0.3));
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(1.4, 5.8) * strength;
      const life = random(550, 1150);
      this.particles.push({
        x: x + (this.reducedMotion ? Math.cos(angle) * 28 : 0),
        y: y + (this.reducedMotion ? Math.sin(angle) * 28 : 0),
        vx: this.reducedMotion ? 0 : Math.cos(angle) * speed,
        vy: this.reducedMotion ? 0 : Math.sin(angle) * speed - 2,
        size: random(tool === 'confetti' ? 3 : 4, tool === 'hug' || tool === 'pillow' ? 11 : 8),
        life,
        maxLife: life,
        color: entry.colors[i % entry.colors.length],
        kind: entry.kind,
        rotation: random(0, Math.PI * 2),
        spin: this.reducedMotion ? 0 : random(-0.12, 0.12),
      });
    }
    this.particles = this.particles.slice(-240);
  }

  private drawParticles() {
    const c = this.ctx;
    for (const particle of this.particles) {
      c.save();
      c.translate(particle.x, particle.y);
      c.rotate(particle.rotation);
      c.globalAlpha = Math.min(1, (particle.life / particle.maxLife) * 2);
      const size = particle.size;
      c.fillStyle = particle.color;
      c.strokeStyle = particle.color;
      c.lineWidth = 2;
      if (particle.kind === 'heart') {
        this.heart(0, 0, size);
        c.fill();
      } else if (particle.kind === 'star') {
        this.star(0, 0, size, size * 0.4, 5);
        c.fill();
      } else if (particle.kind === 'confetti') {
        this.roundRect(-size / 2, -size, size, size * 1.8, 1.5);
        c.fill();
      } else if (particle.kind === 'line') {
        c.beginPath();
        c.moveTo(-size, 0);
        c.lineTo(size, 0);
        c.stroke();
      } else if (particle.kind === 'snow') {
        for (let i = 0; i < 3; i++) {
          c.rotate(Math.PI / 3);
          c.beginPath();
          c.moveTo(-size, 0);
          c.lineTo(size, 0);
          c.stroke();
        }
      } else if (particle.kind === 'feather') {
        this.ellipse(0, 0, size * 0.55, size * 1.5, particle.color);
        c.strokeStyle = '#aa96be66';
        c.lineWidth = 0.8;
        c.beginPath();
        c.moveTo(0, -size);
        c.lineTo(0, size * 1.5);
        c.stroke();
      } else if (particle.kind === 'flame') {
        c.beginPath();
        c.moveTo(0, -size * 1.5);
        c.bezierCurveTo(size * 1.3, -size * 0.2, size, size, 0, size);
        c.bezierCurveTo(-size, size, -size, 0, 0, -size * 1.5);
        c.fill();
      } else {
        this.ellipse(0, 0, size, size * 0.7, particle.color);
      }
      c.restore();
    }
  }

  private drawEffects() {
    if (this.reducedMotion) return;
    const c = this.ctx;
    for (const burst of this.bursts) {
      const progress = burst.age / burst.duration;
      if (progress > 0.66) continue;
      const alpha = Math.max(0, 1 - progress * 1.5);
      c.save();
      c.translate(burst.x, burst.y);
      c.globalAlpha = alpha;
      const radius = (18 + progress * 110) * burst.strength;
      if (['punch', 'slap', 'hammer'].includes(burst.tool)) {
        c.strokeStyle = burst.tool === 'hammer' ? '#b299df' : '#edb77f';
        c.lineWidth = 2;
        c.setLineDash(burst.tool === 'slap' ? [2, 8] : []);
        c.beginPath();
        c.arc(0, 0, radius, 0, Math.PI * 2);
        c.stroke();
        if (progress < 0.22) {
          this.star(0, 0, 35 + progress * 40, 19, 9);
          c.fillStyle = burst.tool === 'hammer' ? '#f4dd9a88' : '#ffd39699';
          c.fill();
        }
      } else if (burst.tool === 'tomato') {
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          this.ellipse(Math.cos(a) * 13, Math.sin(a) * 13, 18 - progress * 10, 13, '#ee8b7c55', a);
        }
      } else if (burst.tool === 'lightning') {
        c.strokeStyle = '#d3b36b';
        c.lineWidth = 9;
        c.lineJoin = 'round';
        const points = [
          [-8, -85],
          [-30, -35],
          [2, -37],
          [-16, 12],
          [31, -51],
          [6, -48],
          [22, -85],
        ];
        c.beginPath();
        c.moveTo(points[0][0], points[0][1]);
        for (const point of points.slice(1)) c.lineTo(point[0], point[1]);
        c.closePath();
        c.stroke();
        c.fillStyle = '#ffe799';
        c.fill();
      } else if (burst.tool === 'tornado') {
        c.strokeStyle = '#b5a3cd';
        c.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          c.beginPath();
          c.ellipse(
            Math.sin(progress * 20 + i) * 9,
            i * 21 - 40,
            67 - i * 13,
            12,
            -0.09,
            progress * 9 + i,
            progress * 9 + i + Math.PI * 1.6,
          );
          c.stroke();
        }
      } else if (burst.tool === 'ice') {
        c.fillStyle = '#ceeff05c';
        c.strokeStyle = '#a2d2de';
        c.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          c.save();
          c.rotate(i * 2.1 + 0.2);
          c.beginPath();
          c.moveTo(0, -18);
          c.lineTo(10, -46);
          c.lineTo(0, -67);
          c.lineTo(-10, -46);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();
        }
      } else if (burst.tool === 'tickle') {
        c.strokeStyle = '#c299d5';
        c.lineWidth = 3;
        for (const direction of [-1, 1]) {
          c.beginPath();
          c.moveTo(direction * 33, -20);
          c.bezierCurveTo(direction * 58, -40, direction * 23, 0, direction * 51, 18);
          c.stroke();
        }
      } else if (burst.tool === 'hug') {
        c.strokeStyle = '#eab5cb';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(0, 0, radius * 1.1, radius * 0.75, -0.1, 0.2, Math.PI - 0.2);
        c.stroke();
      } else if (burst.tool === 'confetti') {
        c.strokeStyle = '#cab6e7';
        c.lineWidth = 2;
        c.setLineDash([3, 10]);
        c.beginPath();
        c.arc(0, 0, radius, 0, Math.PI * 2);
        c.stroke();
      } else if (burst.tool === 'pillow') {
        for (let i = 0; i < 3; i++)
          this.ellipse((i - 1) * 22, -4 + (i % 2) * 9, 27 + progress * 18, 21, '#ffffff70');
      }
      c.restore();
    }
  }

  private drawComicText() {
    const c = this.ctx;
    for (let i = 0; i < this.bursts.length; i++) {
      const burst = this.bursts[i];
      const progress = burst.age / burst.duration;
      const enter = Math.min(1, progress * 8);
      const pop = this.reducedMotion ? 1 : 0.7 + Math.sin((enter * Math.PI) / 2) * 0.3;
      c.save();
      c.globalAlpha = Math.min(1, (1 - progress) * 3) * enter;
      const textX = clamp(burst.x + (i % 2 ? -15 : 15), 84, this.width - 84);
      const textY = clamp(
        burst.y - 55 - progress * (this.reducedMotion ? 0 : 38),
        40,
        this.height - 35,
      );
      c.translate(textX, textY);
      c.rotate(burst.angle);
      c.scale(pop, pop);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `800 ${burst.text.length > 6 ? 20 : 25}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      c.lineWidth = 7;
      c.lineJoin = 'round';
      c.strokeStyle = '#fffdf8';
      c.strokeText(burst.text, 0, 0);
      c.fillStyle = burst.tool === 'hug' ? '#c481a7' : '#816299';
      c.fillText(burst.text, 0, 0);
      c.restore();
    }
  }

  private heart(x: number, y: number, size: number) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x, y + size * 0.85);
    c.bezierCurveTo(
      x - size * 1.65,
      y - size * 0.05,
      x - size * 0.82,
      y - size * 1.1,
      x,
      y - size * 0.45,
    );
    c.bezierCurveTo(
      x + size * 0.82,
      y - size * 1.1,
      x + size * 1.65,
      y - size * 0.05,
      x,
      y + size * 0.85,
    );
    c.closePath();
  }

  private star(x: number, y: number, outer: number, inner: number, points: number) {
    const c = this.ctx;
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 ? inner : outer;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + width - radius, y);
    c.quadraticCurveTo(x + width, y, x + width, y + radius);
    c.lineTo(x + width, y + height - radius);
    c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    c.lineTo(x + radius, y + height);
    c.quadraticCurveTo(x, y + height, x, y + height - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y);
    c.closePath();
  }
}
