import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Heart,
  ImagePlus,
  LoaderCircle,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import { DollEngine } from './dollEngine';
import type { DollStyle, ToolId } from './dollEngine';
import { createPhotoFace, downloadCanvas } from './photo';
import type { PhotoFace } from './photo';

const TOOLS: {
  id: ToolId;
  name: string;
  note: string;
  color: string;
  category: 'release' | 'soft';
}[] = [
  { id: 'punch', name: '拳拳出击', note: '烦恼，接招吧！', color: '#f0aba4', category: 'release' },
  { id: 'slap', name: '拍拍脑袋', note: '拍走不开心', color: '#f3c878', category: 'release' },
  { id: 'hammer', name: '弹簧大锤', note: '把压力敲扁扁', color: '#b2a2d3', category: 'release' },
  { id: 'tomato', name: '番茄投手', note: '给生活加点酱', color: '#e99683', category: 'release' },
  { id: 'pillow', name: '枕头大战', note: '软乎乎的反击', color: '#a6c4d1', category: 'release' },
  {
    id: 'lightning',
    name: '闪电充能',
    note: '滋啦！重新充电',
    color: '#e7ca6d',
    category: 'release',
  },
  { id: 'tornado', name: '烦恼旋风', note: '坏情绪，飞走', color: '#9cb4cc', category: 'release' },
  { id: 'ice', name: '冰冻一下', note: '先给心情降个温', color: '#a7cdd5', category: 'release' },
  { id: 'fire', name: '小火苗', note: '把烦恼烧成烟花', color: '#edb07e', category: 'release' },
  { id: 'tickle', name: '挠痒痒', note: '不许不开心', color: '#bdc799', category: 'soft' },
  { id: 'confetti', name: '彩纸派对', note: '你值得被庆祝', color: '#c5a6c6', category: 'soft' },
  { id: 'hug', name: '抱抱时间', note: '好了，抱一下吧', color: '#dba7ab', category: 'soft' },
];

function PuffMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 28 : 42}
      height={small ? 28 : 42}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M25 5c7-7 18 3 13 11 11 1 10 16 1 17 5 10-10 16-15 8-7 10-20 0-15-8-12-3-8-18 1-18C8 5 20 0 25 5Z"
        fill="currentColor"
      />
      <circle cx="19" cy="21" r="2" fill="#f5f3ec" />
      <circle cx="29" cy="21" r="2" fill="#f5f3ec" />
      <path d="M20 29q5 4 9-1" stroke="#f5f3ec" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ToolGlyph({ id }: { id: ToolId }) {
  const ink = '#4c4052';
  const common = {
    stroke: ink,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg viewBox="0 0 64 56" fill="none" aria-hidden="true" className="tool-glyph">
      {id === 'punch' && (
        <g {...common}>
          <path d="m20 40-3-11c-3-10 0-20 10-20h12c8 0 12 7 11 14l-1 12-10 9Z" fill="#ee9d96" />
          <path d="M22 30c-8-8-15-1-10 7l10 9m14-35v11m-9-11v10m17-8v9" />
          <path d="m21 40 23-3 2 12-23 3Z" fill="#c96564" />
          <path d="m28 45 10-1" stroke="#ffe4db" />
        </g>
      )}
      {id === 'slap' && (
        <g {...common}>
          <path
            d="m19 29-5-12c-2-5 4-7 6-3l6 11-3-17c-1-5 5-5 6-1l4 16 1-17c0-5 6-5 6 0l-1 19 5-12c2-4 7-2 5 3l-5 18c-1 3 9-8 12-3 2 3-5 10-9 15-5 8-19 7-25-1l-10-9c-4-5 1-9 5-5l7 6"
            fill="#efc582"
          />
          <path d="M30 34q5-4 10 0" />
        </g>
      )}
      {id === 'hammer' && (
        <g {...common}>
          <path d="m29 27 8 2-5 24-7-2Z" fill="#dca97f" />
          <path d="M32 28v-7m-5 4 11 2m-9-7 10 2" />
          <path d="m13 6 38 8-5 20-38-8Z" fill="#b3a0d5" />
          <path d="m15 7-5 18m34-12-5 19" stroke="#e0d3ee" strokeWidth="4" />
          <path d="m5 9-3-4m50 34 6 4" />
        </g>
      )}
      {id === 'tomato' && (
        <g {...common}>
          <path
            d="M53 32c0 13-11 20-22 18C6 51 5 26 16 20c8-5 11 0 16 0 8-6 21 0 21 12Z"
            fill="#e98573"
          />
          <path d="m30 22-11-7 10 1 4-10 3 10 11-3-8 9-9 2Z" fill="#80975f" />
          <path d="M17 32q-2 8 6 10" stroke="#fbc1a3" strokeWidth="3" />
          <circle cx="45" cy="34" r="2" fill="#bd5f58" stroke="none" />
        </g>
      )}
      {id === 'pillow' && (
        <g {...common}>
          <path
            d="M10 9c14 5 27 4 42 0-4 12-3 25 0 38-15-4-29-4-43 0 4-14 5-26 1-38Z"
            fill="#b7d3dc"
          />
          <path d="M15 15q17 4 32 0M15 41q16-3 31 0" stroke="#7e9eaf" strokeDasharray="3 4" />
          <path d="m27 24 6 6-7 4m18-17 2 5" stroke="#fff4df" />
        </g>
      )}
      {id === 'lightning' && (
        <g {...common}>
          <path d="m34 3-20 28 15 1-5 21 25-32-16 1 8-19Z" fill="#efcd65" />
          <path d="m10 13-4-3m43 29 7 4m-1-31 4-3" />
        </g>
      )}
      {id === 'tornado' && (
        <g {...common}>
          <path
            d="M13 12c-13-4 31-12 40 0 7 10-44 11-43 3m7 10c7 6 30 3 31-2M22 35c7 3 18 1 20-1m-16 9q7 3 10-1m-5 7 3 3"
            stroke="#88a7c1"
            strokeWidth="5"
          />
          <path d="m6 33-3 2m47 7 4 1" />
        </g>
      )}
      {id === 'ice' && (
        <g {...common} stroke="#759bb5">
          <path
            d="M32 4v47M10 15l43 26M11 42l42-27m-27-5 6 6 7-6m-13 35 6-7 7 7M12 23l10-2-3-9m27 32-2-10 10-2M12 34l10 3-3 9m28-33-3 10 10 2"
            strokeWidth="3"
          />
          <circle cx="32" cy="28" r="5" fill="#c3e2e7" />
        </g>
      )}
      {id === 'fire' && (
        <g {...common}>
          <path
            d="M23 25C17 16 36 14 31 3c18 9 8 22 14 19 17 17 6 31-12 31-24 0-29-20-15-33-1 6 1 9 5 5Z"
            fill="#efa075"
          />
          <path d="M31 48c-12 0-12-12-1-20-2 7 8 7 8 13q0 7-7 7Z" fill="#f4d08c" stroke="none" />
        </g>
      )}
      {id === 'tickle' && (
        <g {...common}>
          <path d="M14 45C5 31 22 9 51 6 55 32 37 48 23 42" fill="#becf9c" />
          <path d="m12 52 29-34m-21 9 2 13m8-23 1 13m6-17 1 9m-5 16 11-3" />
        </g>
      )}
      {id === 'confetti' && (
        <g {...common}>
          <path d="m10 49 9-28 18 18Z" fill="#b3a2ce" />
          <path d="m14 39 12 4m-9-13 15 7" stroke="#eed79a" strokeWidth="3" />
          <path d="M26 23c-8-17 13-15 7-22m4 30C53 19 40 12 54 9" stroke="#d68f9d" />
          <path d="m43 40 7 5m-31-32 3-5m18 4 3 4m-2 7 5 2" stroke="#b6b966" strokeWidth="4" />
        </g>
      )}
      {id === 'hug' && (
        <g {...common}>
          <path
            d="M32 44S6 30 12 17C19 4 29 14 32 18 40 3 56 13 52 25c-3 8-20 19-20 19Z"
            fill="#e4a1ac"
          />
          <path d="M6 35c6-2 8 1 12 2m40-2c-5-2-7 1-11 2M23 25h1m15 0h1m-13 6q5 4 10 0" />
        </g>
      )}
    </svg>
  );
}

function Modal({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex="0"], a[href]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === panel.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || document.activeElement === panel.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panel}
      >
        <button className="icon-button modal-close" aria-label="关闭弹窗" onClick={onClose}>
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

function PhotoModal({
  onClose,
  onApply,
  initialName,
}: {
  onClose: () => void;
  onApply: (face: HTMLCanvasElement, name: string) => void;
  initialName: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [name, setName] = useState(initialName === '烦恼小怪兽' ? '' : initialName);
  const [result, setResult] = useState<PhotoFace | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const load = (next?: File) => {
    if (next) {
      setFile(next);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setError('');
    }
  };
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let processed: PhotoFace | undefined;
    setBusy(true);
    setError('');
    setResult(null);
    const timeout = window.setTimeout(() => {
      createPhotoFace(file, { zoom, offsetX, offsetY })
        .then((value) => {
          processed = value;
          if (cancelled) value.dispose();
          else {
            setResult(value);
            setPreview(value.canvas.toDataURL('image/png'));
            setBusy(false);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : '照片处理失败，请重试。');
            setBusy(false);
            setPreview('');
          }
        });
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      processed?.dispose();
    };
  }, [file, zoom, offsetX, offsetY]);
  return (
    <Modal title="定制我的布偶" onClose={onClose} className="photo-modal">
      <span className="eyebrow">
        <Sparkles size={14} /> 每一种烦恼，都有一个软着陆
      </span>
      <h2>让布偶，有一点像 TA。</h2>
      <p className="modal-intro">选一张照片，做成属于你的卡通照片布偶。</p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif"
        aria-label="上传人物照片"
        className="visually-hidden"
        onChange={(e) => {
          load(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <div
        className={`photo-drop ${dragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          load(e.dataTransfer.files[0]);
        }}
      >
        {preview ? (
          <>
            <div className="photo-comparison">
              <figure>
                <img src={result?.originalUrl} alt="原照片" />
                <figcaption>你的照片</figcaption>
              </figure>
              <ArrowRight size={20} />
              <figure>
                <img src={preview} alt="卡通化布偶头像预览" />
                <figcaption>软乎乎的 TA</figcaption>
              </figure>
            </div>
            <button className="text-button" onClick={() => input.current?.click()}>
              换一张照片 <Camera size={14} />
            </button>
          </>
        ) : (
          <button className="drop-action" onClick={() => input.current?.click()}>
            <span className="upload-icon">
              <ImagePlus size={28} />
            </span>
            <strong>点击选择，或拖入照片</strong>
            <span>清晰正面照效果更好 · 最大 12 MB</span>
          </button>
        )}
        {busy && (
          <div className="photo-loading">
            <LoaderCircle className="spin" size={24} />
            <span>正在揉成软乎乎的样子…</span>
          </div>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <div className="crop-controls">
          <label>
            放大裁切
            <input
              aria-label="放大裁切"
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(+e.target.value)}
            />
          </label>
          <label>
            左右位置
            <input
              aria-label="左右位置"
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={offsetX}
              onChange={(e) => setOffsetX(+e.target.value)}
            />
          </label>
          <label>
            上下位置
            <input
              aria-label="上下位置"
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={offsetY}
              onChange={(e) => setOffsetY(+e.target.value)}
            />
          </label>
        </div>
      )}
      <label className="name-field">
        给它起个小名 <span>选填</span>
        <input
          aria-label="布偶小名"
          maxLength={12}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="比如：周一、坏心情、烦恼怪"
        />
      </label>
      <p className="privacy-note">
        <ShieldCheck size={15} /> 照片仅在本地处理，不上传，刷新页面即清除。
      </p>
      <button
        className="primary-button full-width"
        disabled={!result || busy}
        onClick={() => {
          if (result) onApply(result.canvas, name.trim() || '我的出气布偶');
        }}
      >
        生成我的布偶 <Sparkles size={16} />
      </button>
    </Modal>
  );
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DollEngine | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastHit = useRef(0);
  const comboRef = useRef(0);
  const sessionStartedAt = useRef(Date.now());
  const challengeDeadline = useRef<number | null>(null);
  const currentHit = useRef<(x?: number, y?: number) => void>(() => {});
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const holdInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [tool, setTool] = useState<ToolId>('punch');
  const [filter, setFilter] = useState<'all' | 'soft'>('all');
  const [intensity, setIntensity] = useState(55);
  const [style, setStyle] = useState<DollStyle>('lavender');
  const [face, setFace] = useState<HTMLCanvasElement | null>(null);
  const [name, setName] = useState('烦恼小怪兽');
  const [sound, setSound] = useState(false);
  const [total, setTotal] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [relief, setRelief] = useState(24);
  const [seconds, setSeconds] = useState(0);
  const [challenge, setChallenge] = useState<number | null>(null);
  const [challengeHits, setChallengeHits] = useState(0);
  const [modal, setModal] = useState<'photo' | 'about' | 'breathe' | null>(null);
  const [breathTime, setBreathTime] = useState(0);
  const [toast, setToast] = useState('');
  const selected = TOOLS.find((item) => item.id === tool)!;
  const challengeRunning = challenge !== null;
  const closeModal = useCallback(() => setModal(null), []);

  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3400);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new DollEngine(canvasRef.current);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);
  useEffect(() => {
    engineRef.current?.setStyle(style);
  }, [style]);
  useEffect(() => {
    engineRef.current?.setFace(face);
  }, [face]);
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - sessionStartedAt.current) / 1000));
      if (Date.now() - lastHit.current > 1400) {
        comboRef.current = 0;
        setCombo(0);
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!challengeRunning) return;
    const interval = setInterval(() => {
      if (challengeDeadline.current !== null)
        setChallenge(Math.max(0, Math.ceil((challengeDeadline.current - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(interval);
  }, [challengeRunning]);
  useEffect(() => {
    if (challenge !== 0) return;
    challengeDeadline.current = null;
    notify(`挑战完成！60 秒释放了 ${challengeHits} 次，辛苦啦。`);
    setChallenge(null);
  }, [challenge, challengeHits, notify]);
  useEffect(() => {
    if (modal !== 'breathe') return;
    setBreathTime(0);
    const interval = setInterval(() => setBreathTime((v) => v + 1), 1000);
    return () => clearInterval(interval);
  }, [modal]);
  useEffect(() => {
    if (modal === 'breathe' && breathTime >= 36) {
      setModal(null);
      setRelief((v) => Math.min(100, v + 10));
      notify('慢慢来，你已经为自己留出了 36 秒。');
    }
  }, [breathTime, modal, notify]);
  const stopHold = useCallback(() => {
    clearTimeout(holdTimeout.current);
    clearInterval(holdInterval.current);
  }, []);
  useEffect(() => {
    window.addEventListener('pointerup', stopHold);
    window.addEventListener('pointercancel', stopHold);
    window.addEventListener('blur', stopHold);
    return () => {
      stopHold();
      clearTimeout(toastTimer.current);
      window.removeEventListener('pointerup', stopHold);
      window.removeEventListener('pointercancel', stopHold);
      window.removeEventListener('blur', stopHold);
      void audioRef.current?.close();
    };
  }, [stopHold]);

  const playSound = (id: ToolId) => {
    if (!sound) return;
    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      if (context.state === 'suspended') void context.resume();
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      const start = context.currentTime;
      oscillator.type = ['lightning', 'ice'].includes(id) ? 'triangle' : 'sine';
      const frequency =
        id === 'hug'
          ? 520
          : id === 'confetti'
            ? 730
            : id === 'hammer'
              ? 95
              : id === 'punch'
                ? 160
                : 320;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency / 3), start + 0.14);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(start + 0.22);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      /* Sound is optional when the browser lacks Web Audio. */
    }
  };

  const hit = (x?: number, y?: number) => {
    const now = Date.now();
    comboRef.current = now - lastHit.current < 1400 ? comboRef.current + 1 : 1;
    lastHit.current = now;
    setCombo(comboRef.current);
    setBest((v) => Math.max(v, comboRef.current));
    setTotal((v) => v + 1);
    setRelief((v) =>
      Math.min(100, v + (selected.category === 'soft' ? 2.6 : 0.8 + intensity / 80)),
    );
    if (challenge !== null) setChallengeHits((v) => v + 1);
    engineRef.current?.hit(tool, intensity, x, y);
    playSound(tool);
  };
  currentHit.current = hit;

  const reset = () => {
    stopHold();
    engineRef.current?.reset();
    setTotal(0);
    setBest(0);
    setCombo(0);
    comboRef.current = 0;
    sessionStartedAt.current = Date.now();
    challengeDeadline.current = null;
    setRelief(24);
    setSeconds(0);
    setChallenge(null);
    setChallengeHits(0);
    lastHit.current = 0;
    notify('新的一局，把不开心都放下。');
  };

  const saveReport = () => {
    const output = document.createElement('canvas');
    output.width = 1080;
    output.height = 1350;
    const ctx = output.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#f5f3ec';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#7562a8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('PUFF / 出气事务所', 72, 94);
    ctx.fillStyle = '#2e2932';
    ctx.font = 'bold 70px sans-serif';
    ctx.fillText('坏心情，到此为止。', 72, 205);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#78717d';
    ctx.fillText('给自己一点时间，也给情绪一个出口。', 76, 260);
    ctx.fillStyle = '#eae4ef';
    ctx.beginPath();
    ctx.roundRect(72, 310, 936, 660, 40);
    ctx.fill();
    const ratio = canvasRef.current.width / canvasRef.current.height;
    const height = Math.min(630, 900 / ratio);
    ctx.drawImage(canvasRef.current, 540 - (height * ratio) / 2, 325, height * ratio, height);
    ctx.fillStyle = '#2e2932';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(`${total} 次释放`, 90, 1070);
    ctx.fillText(`${best} 次连击`, 570, 1070);
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#78717d';
    ctx.fillText(`今日搭档：${name}`, 90, 1125);
    ctx.fillText(`轻松指数：${Math.round(relief)}%`, 570, 1125);
    ctx.fillStyle = '#7562a8';
    ctx.font = '28px sans-serif';
    ctx.fillText('辛苦了。接下来的时间，留给好心情。', 90, 1250);
    downloadCanvas(output, `PUFF-今日好心情-${new Date().toISOString().slice(0, 10)}.png`);
    notify('解压战报已生成，收好这份好心情。');
  };

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch {
      notify('当前浏览器暂不支持全屏，直接玩也一样开心。');
    }
  };
  const breathPhase =
    breathTime % 12 < 4 ? '慢慢吸气' : breathTime % 12 < 6 ? '轻轻停留' : '缓缓呼气';
  const breathRemaining =
    breathTime % 12 < 4
      ? 4 - (breathTime % 12)
      : breathTime % 12 < 6
        ? 6 - (breathTime % 12)
        : 12 - (breathTime % 12);

  return (
    <>
      <header className="site-header">
        <a className="brand" href="./" aria-label="PUFF 出气事务所首页">
          <PuffMark />
          <span className="brand-word">
            puff<span className="brand-dot">.</span>
          </span>
          <span className="brand-divider" />
          <span className="brand-cn">
            出气事务所<span>LET IT ALL OUT.</span>
          </span>
        </a>
        <div className="header-right">
          <span className="open-sign">
            <i /> 正在接收坏心情
          </span>
          <button className="about-button" onClick={() => setModal('about')}>
            <CircleHelp size={16} /> 使用指南
          </button>
        </div>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span className="little-line" /> 你的情绪，值得有个出口
            </div>
            <h1>
              今天的气，<span>今天撒。</span>
              <svg className="title-spark" viewBox="0 0 44 44" aria-hidden="true">
                <path
                  d="m22 2-1 13M41 16l-12 5M34 37l-9-10M5 31l12-7M8 5l8 11"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </h1>
            <p>把不开心交给软乎乎的它，给好心情腾个位置。</p>
          </div>
          <div className="intro-note">
            <span className="hand-arrow">↙</span>
            <span>
              生活很硬，
              <br />
              还好布偶很软。
            </span>
            <Sparkles size={20} />
          </div>
        </section>
        <div className="workspace">
          <aside className="tool-panel panel">
            <div className="panel-heading">
              <h2>
                <span className="tiny-square" /> 解压工具箱
              </h2>
              <span className="count-badge">12 种快乐</span>
            </div>
            <div className="tool-tabs" role="group" aria-label="工具分类">
              <button
                aria-pressed={filter === 'all'}
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                尽情释放 <span>12</span>
              </button>
              <button
                aria-pressed={filter === 'soft'}
                className={filter === 'soft' ? 'active' : ''}
                onClick={() => {
                  setFilter('soft');
                  if (selected.category !== 'soft') setTool('hug');
                }}
              >
                温柔一点 <Heart size={12} />
              </button>
            </div>
            <div className="tool-grid">
              {TOOLS.filter((item) => filter === 'all' || item.category === 'soft').map((item) => (
                <button
                  key={item.id}
                  className={`tool-card ${tool === item.id ? 'selected' : ''}`}
                  onClick={() => setTool(item.id)}
                  aria-label={`选择${item.name}`}
                  aria-pressed={tool === item.id}
                  title={item.note}
                >
                  <ToolGlyph id={item.id} />
                  <span>{item.name}</span>
                  {tool === item.id && (
                    <span className="tool-check">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="intensity-control">
              <div className="control-heading">
                <label htmlFor="intensity">出气力度</label>
                <span>
                  {intensity < 34 ? '轻轻的' : intensity < 70 ? '刚刚好' : '超解压'}{' '}
                  <span className="strength-dots">
                    {'●'.repeat(intensity < 34 ? 1 : intensity < 70 ? 2 : 3)}
                  </span>
                </span>
              </div>
              <input
                id="intensity"
                type="range"
                min="1"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(+e.target.value)}
                style={{ '--range-value': `${intensity}%` } as React.CSSProperties}
              />
              <div className="range-labels">
                <span>轻轻拍</span>
                <span>放开来</span>
              </div>
            </div>
            <div className="tool-footnote">
              <Heart size={13} /> 怎么玩都可以，它会一直软乎乎。
            </div>
          </aside>
          <section className="play-column">
            <div className="play-stage" ref={stageRef}>
              <div className="stage-top">
                <span className="stage-pill">
                  <span className="status-dot" /> {face ? '专属照片布偶' : '软乎乎的陪伴'}
                </span>
                <div>
                  <button
                    className={`icon-button ${sound ? 'sound-on' : ''}`}
                    aria-label={sound ? '关闭音效' : '开启音效'}
                    aria-pressed={sound}
                    onClick={() => setSound((v) => !v)}
                    title={sound ? '关闭音效' : '开启音效'}
                  >
                    {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                  <button
                    className="icon-button fullscreen-button"
                    aria-label="全屏玩耍"
                    onClick={() => void fullscreen()}
                  >
                    <Maximize2 size={17} />
                  </button>
                </div>
              </div>
              <span className="stage-doodle doodle-star">✳</span>
              <span className="stage-doodle doodle-spark">✧</span>
              <span className="stage-doodle doodle-orbit">◌</span>
              <div className="canvas-wrap">
                <canvas
                  ref={canvasRef}
                  role="button"
                  tabIndex={0}
                  aria-label={`点击布偶，使用${selected.name}`}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.currentTarget.focus({ preventScroll: true });
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left,
                      y = e.clientY - rect.top;
                    stopHold();
                    hit(x, y);
                    holdTimeout.current = setTimeout(() => {
                      holdInterval.current = setInterval(() => currentHit.current(x, y), 175);
                    }, 320);
                  }}
                  onPointerLeave={stopHold}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      if (!e.repeat) hit();
                    }
                  }}
                />
                <div className={`combo-popup ${combo > 1 ? 'visible' : ''}`} aria-hidden="true">
                  <span>COMBO</span>
                  <strong>
                    {combo}
                    <i>×</i>
                  </strong>
                  <small>
                    {combo >= 20
                      ? '坏心情大撤退！'
                      : combo >= 10
                        ? '这波很解压！'
                        : '继续，别客气！'}
                  </small>
                </div>
              </div>
              <div className="doll-name">
                <span>{name}</span>
                <span className="doll-name-tag">情绪回收员 No.001</span>
              </div>
              <div className="stage-bottom">
                <span className="selected-tool-mini">
                  <span style={{ background: selected.color }} />
                  <span>{selected.name}</span>
                </span>
                <span className="play-hint">
                  点击 / 长按布偶 <span>·</span> <kbd>空格</kbd> 也可以
                </span>
              </div>
            </div>
            <div className="doll-customize">
              <div className="doll-colors" role="group" aria-label="布偶颜色">
                <span>换个心情</span>
                {(
                  [
                    { id: 'lavender', label: '葡萄紫', color: '#ad99cb' },
                    { id: 'peach', label: '蜜桃粉', color: '#e6ad9e' },
                    { id: 'mint', label: '开心绿', color: '#a8bea8' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    className={`color-dot ${style === item.id ? 'active' : ''}`}
                    style={{ '--swatch': item.color } as React.CSSProperties}
                    aria-label={item.label}
                    aria-pressed={style === item.id}
                    onClick={() => setStyle(item.id)}
                  >
                    {style === item.id && <Check size={12} />}
                  </button>
                ))}
                {face && (
                  <button
                    className="text-button remove-photo"
                    onClick={() => {
                      setFace(null);
                      setName('烦恼小怪兽');
                      notify('已换回原来的小怪兽，照片已从布偶移除。');
                    }}
                  >
                    还原布偶
                  </button>
                )}
              </div>
              <button className="customize-button" onClick={() => setModal('photo')}>
                <Camera size={16} /> 定制我的布偶 <ArrowUpRight size={15} />
              </button>
            </div>
          </section>
          <aside className="status-column">
            <section className="mood-panel">
              <div className="mood-header">
                <h2>心情晴雨表</h2>
                <span className="mood-sun">☼</span>
              </div>
              <p>让坏心情，一点一点漏光。</p>
              <div className="mood-gauge">
                <svg viewBox="0 0 220 130" aria-hidden="true">
                  <path
                    d="M24 110a86 86 0 0 1 172 0"
                    fill="none"
                    stroke="#706582"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M24 110a86 86 0 0 1 172 0"
                    fill="none"
                    stroke="#e1ed9d"
                    strokeWidth="10"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={`${relief} 100`}
                  />
                  <path d="m63 107 12 0m70 0 12 0" stroke="#e1ed9d" strokeWidth="2" />
                </svg>
                <div>
                  <strong data-testid="relief">
                    {Math.round(relief)}
                    <small>%</small>
                  </strong>
                  <span>轻松指数</span>
                </div>
              </div>
              <span className="mood-label">
                {relief >= 90
                  ? '☀ 心里开始放晴啦'
                  : relief >= 60
                    ? '☁ 舒服多了，继续放松'
                    : '☁ 再给自己一点时间'}
              </span>
              <div className="mood-panel-foot">随互动变化的趣味指标</div>
            </section>
            <section className="session-panel panel">
              <div className="panel-heading">
                <h2>这一刻，为自己</h2>
                <span className="session-live">
                  <i /> 此次
                </span>
              </div>
              <div className="session-stats">
                <div>
                  <strong data-testid="hit-count">{total.toString().padStart(2, '0')}</strong>
                  <span>释放次数</span>
                </div>
                <div>
                  <strong data-testid="best-combo">{best.toString().padStart(2, '0')}</strong>
                  <span>最高连击</span>
                </div>
                <div>
                  <strong>
                    {Math.floor(seconds / 60)
                      .toString()
                      .padStart(2, '0')}
                    <small>:{(seconds % 60).toString().padStart(2, '0')}</small>
                  </strong>
                  <span>陪伴时间</span>
                </div>
              </div>
              <button
                className={`challenge-button ${challenge !== null ? 'running' : ''}`}
                onClick={() => {
                  if (challenge !== null) {
                    challengeDeadline.current = null;
                    setChallenge(null);
                    notify(`提前收工，也很棒。你释放了 ${challengeHits} 次。`);
                  } else {
                    challengeDeadline.current = Date.now() + 60000;
                    setChallenge(60);
                    setChallengeHits(0);
                    notify('60 秒挑战开始！点击或长按布偶，尽情释放。');
                  }
                }}
              >
                <span className="challenge-icon">
                  <Timer size={18} />
                </span>
                <span>
                  <strong>
                    {challenge !== null
                      ? `还剩 ${challenge} 秒 · ${challengeHits} 次`
                      : '60 秒释放挑战'}
                  </strong>
                  <small>
                    {challenge !== null ? '点击这里可以提前结束' : '给坏心情一个下班倒计时'}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
              <button className="report-button" onClick={saveReport}>
                <ArrowDownToLine size={14} /> 收好今日好心情 <ArrowUpRight size={13} />
              </button>
            </section>
            <button className="breathing-card" onClick={() => setModal('breathe')}>
              <span className="breath-icon">
                <Wind size={25} />
              </span>
              <span>
                <strong>也可以，什么都不做。</strong>
                <small>
                  跟着呼吸，给自己 36 秒 <ArrowRight size={12} />
                </small>
              </span>
            </button>
          </aside>
        </div>
        <footer className="page-footer">
          <span>
            <ShieldCheck size={14} /> 你的照片和心情，都只属于你。
            <span className="footer-separator">/</span> 不上传 · 不记录 · 只解压
          </span>
          <button className="text-button reset-button" onClick={reset}>
            <RotateCcw size={13} /> 重新开始
          </button>
        </footer>
      </main>
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        <span>
          <PuffMark small />
        </span>
        {toast}
      </div>
      {modal === 'photo' && (
        <PhotoModal
          onClose={closeModal}
          onApply={(value, nickname) => {
            setFace(value);
            setName(nickname);
            closeModal();
            notify('专属布偶就位！坏心情，现在可以交给它了。');
          }}
          initialName={name}
        />
      )}
      {modal === 'about' && (
        <Modal title="使用指南" onClose={closeModal}>
          <span className="eyebrow">WELCOME TO PUFF</span>
          <h2>这里，允许不开心。</h2>
          <p className="modal-intro">选一个小玩意，把情绪交给软乎乎的布偶。</p>
          <div className="guide-steps">
            <div>
              <span>01</span>
              <p>
                <strong>选个出气搭档</strong>
                直接用小怪兽，或上传照片生成卡通照片布偶。可以调节裁切和颜色。
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <strong>用你的方式放松</strong>
                选择工具、调整力度，点击或长按布偶。键盘空格与回车也能互动。
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <strong>让好心情多待一会儿</strong>试试 60 秒挑战、36
                秒呼吸，或下载属于你的解压战报。
              </p>
            </div>
          </div>
          <p className="privacy-note">
            <ShieldCheck size={16} /> 照片经本地滤镜与裁切处理，不调用 AI
            服务、不上传服务器。页面刷新后照片与本次记录清除。
          </p>
          <button className="primary-button full-width" onClick={closeModal}>
            知道啦，开始解压 <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {modal === 'breathe' && (
        <Modal title="36 秒呼吸放松" onClose={closeModal} className="breath-modal">
          <span className="eyebrow">TAKE A LITTLE BREAK</span>
          <h2>这一小会儿，只管呼吸。</h2>
          <p className="modal-intro">不用表现得很好，舒服就好。</p>
          <div
            className={`breath-orbit ${breathTime % 12 < 4 ? 'inhale' : breathTime % 12 < 6 ? 'hold' : 'exhale'}`}
          >
            <div className="breath-bubble">
              <Wind size={28} />
              <strong>{breathPhase}</strong>
              <span>{breathRemaining}</span>
            </div>
          </div>
          <div className="breath-rounds">
            {[0, 1, 2].map((i) => (
              <span key={i} className={Math.floor(breathTime / 12) >= i ? 'active' : ''} />
            ))}
            <p>
              第 {Math.min(3, Math.floor(breathTime / 12) + 1)} / 3 轮 · 吸气 4 秒，停留 2 秒，呼气
              6 秒
            </p>
          </div>
          <button className="text-button" onClick={closeModal}>
            我准备好回来了 <ArrowRight size={14} />
          </button>
        </Modal>
      )}
    </>
  );
}

export default App;
