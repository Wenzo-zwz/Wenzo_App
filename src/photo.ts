/** Photos stay in this browser tab. No image data is uploaded or persisted. */
export interface PhotoFaceOptions {
  /** 1 shows the largest centered square; 2.5 is the closest supported crop. */
  zoom?: number;
  /** Crop positions are normalized from -1 (left/top) to 1 (right/bottom). */
  offsetX?: number;
  offsetY?: number;
}

export interface PhotoFace {
  canvas: HTMLCanvasElement;
  /** A local blob URL for the crop editor. Call dispose when it is no longer used. */
  originalUrl: string;
  dispose: () => void;
}

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const FACE_SIZE = 512;
const SUPPORTED_FORMATS = 'JPG、PNG、WebP、GIF、BMP 或 AVIF';

function clamp(value: number | undefined, low: number, high: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(high, Math.max(low, value))
    : fallback;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/** Check the actual container, not the file extension or caller-provided MIME type. */
async function validateImage(file: File): Promise<void> {
  if (!file || file.size === 0) throw new Error('这张图片是空的，请重新选择一张照片。');
  if (file.size > MAX_FILE_BYTES) throw new Error('图片有点大，请选择 12 MB 以内的照片。');

  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png =
    bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
  const gif = ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a';
  const webp = ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP';
  const bmp = ascii(bytes, 0, 2) === 'BM';
  // AVIF uses an ISO-BMFF ftyp box; inspect major and compatible brands.
  const avif =
    ascii(bytes, 4, 4) === 'ftyp' &&
    Array.from({ length: Math.max(0, Math.floor((bytes.length - 8) / 4)) }, (_, index) =>
      ascii(bytes, 8 + index * 4, 4),
    ).some((brand) => brand === 'avif' || brand === 'avis');

  if (!jpeg && !png && !gif && !webp && !bmp && !avif) {
    throw new Error(`暂时无法使用这种图片，请选择 ${SUPPORTED_FORMATS} 格式。`);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片没能读取成功，请换一张完整、清晰的照片。'));
    image.src = url;
  });
}

/** A soft, bright poster effect: recognisable facial features without harsh shadows. */
function softenIntoComic(context: CanvasRenderingContext2D): void {
  const pixels = context.getImageData(0, 0, FACE_SIZE, FACE_SIZE);
  const data = pixels.data;
  const luminance = new Float32Array(FACE_SIZE * FACE_SIZE);

  for (let pixel = 0; pixel < luminance.length; pixel += 1) {
    const i = pixel * 4;
    luminance[pixel] = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
  }

  for (let y = 0; y < FACE_SIZE; y += 1) {
    for (let x = 0; x < FACE_SIZE; x += 1) {
      const pixel = y * FACE_SIZE + x;
      const i = pixel * 4;
      const luma = luminance[pixel];
      // Only add a subtle line at high-contrast boundaries; retain soft skin tones.
      let line = 0;
      if (x > 0 && x < FACE_SIZE - 1 && y > 0 && y < FACE_SIZE - 1) {
        const horizontal = Math.abs(luminance[pixel + 1] - luminance[pixel - 1]);
        const vertical = Math.abs(luminance[pixel + FACE_SIZE] - luminance[pixel - FACE_SIZE]);
        line = Math.min(0.1, Math.max(0, (horizontal + vertical - 44) / 850));
      }

      for (let channel = 0; channel < 3; channel += 1) {
        // Lift deep shadows slightly, add restrained color, then blend posterized tones.
        const saturated = luma + (data[i + channel] - luma) * 1.12;
        const warm = channel === 0 ? 2 : channel === 2 ? -1 : 0;
        const lifted = Math.min(255, Math.max(0, saturated * 0.96 + 9 + warm));
        const posterized = Math.round(lifted / 28) * 28;
        data[i + channel] = Math.min(
          255,
          Math.max(0, (lifted * 0.68 + posterized * 0.32) * (1 - line)),
        );
      }
    }
  }

  context.putImageData(pixels, 0, 0);
}

/**
 * Decode, crop and stylize a local image. Browser decoding applies EXIF orientation.
 * The caller owns the returned blob URL and must dispose it on replacement/unmount.
 */
export async function createPhotoFace(
  file: File,
  options: PhotoFaceOptions = {},
): Promise<PhotoFace> {
  await validateImage(file);

  const originalUrl = URL.createObjectURL(file);
  let bitmap: ImageBitmap | undefined;
  let disposed = false;
  const dispose = () => {
    if (!disposed) {
      URL.revokeObjectURL(originalUrl);
      disposed = true;
    }
  };

  try {
    let source: ImageBitmap | HTMLImageElement;
    if (typeof createImageBitmap === 'function') {
      try {
        // Explicitly request the default EXIF-aware orientation in supporting browsers.
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        source = bitmap;
      } catch {
        // Some browsers decode a format with <img> but not with createImageBitmap.
        source = await loadImage(originalUrl);
      }
    } else {
      source = await loadImage(originalUrl);
    }

    const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    if (width <= 0 || height <= 0) throw new Error('图片尺寸不完整，请换一张照片。');

    const zoom = clamp(options.zoom, 1, 2.5, 1);
    const cropSize = Math.min(width, height) / zoom;
    const x = ((width - cropSize) / 2) * (1 + clamp(options.offsetX, -1, 1, 0));
    const y = ((height - cropSize) / 2) * (1 + clamp(options.offsetY, -1, 1, 0));
    const canvas = document.createElement('canvas');
    canvas.width = FACE_SIZE;
    canvas.height = FACE_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('当前浏览器无法生成玩偶头像，请尝试更新浏览器。');

    context.fillStyle = '#fff6e5';
    context.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, x, y, cropSize, cropSize, 0, 0, FACE_SIZE, FACE_SIZE);
    softenIntoComic(context);
    return { canvas, originalUrl, dispose };
  } catch (error) {
    dispose();
    if (error instanceof Error && /[\u3400-\u9fff]/u.test(error.message)) throw error;
    throw new Error('图片没能处理成功，请换一张照片后再试。');
  } finally {
    bitmap?.close();
  }
}

/** Download a generated image without sending its contents to a server. */
export function downloadCanvas(canvas: HTMLCanvasElement, filename = '解压小玩偶.png'): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser time to start reading the download before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }, 'image/png');
}
