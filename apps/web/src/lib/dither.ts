export type MatrixId = 'bayer2' | 'bayer4' | 'bayer8' | 'noise'

export type DitherOptions = {
  /** Ordered matrix (or noise mask) used to quantise the tone. */
  matrix: MatrixId
  /** Tone above which a cell is inked. */
  /** Inverts the comparison, so bright areas stay paper. */
  invert?: boolean
  /** Ink colour as a hex string. */
  ink: string
  /** Optional second ink used for the densest part of the field. */
  hotInk?: string
  /** Tone at which `hotInk` takes over. */
  hotAbove?: number
  /** Optional per-cell mask (>= 0.5) that forces `hotInk` on inked cells. */
  hotMask?: Float32Array
  /** Paper colour as a hex string. */
  paper: string
}

const MATRIX_SIZES = {
  bayer2: 2,
  bayer4: 4,
  bayer8: 8,
} as const satisfies Record<Exclude<MatrixId, 'noise'>, 2 | 4 | 8>

const matrixCache = new Map<number, Float32Array>()

function buildBayer(size: number): number[] {
  if (size <= 1) {
    return [0]
  }

  const halfSize = size / 2
  const half = buildBayer(halfSize)
  const matrix = Array.from({ length: size * size }, () => 0)

  for (let y = 0; y < halfSize; y += 1) {
    for (let x = 0; x < halfSize; x += 1) {
      const value = (half[y * halfSize + x] ?? 0) * 4
      const row = y * size
      const nextRow = (y + halfSize) * size

      matrix[row + x] = value
      matrix[row + x + halfSize] = value + 2
      matrix[nextRow + x] = value + 3
      matrix[nextRow + x + halfSize] = value + 1
    }
  }

  return matrix
}

/** Normalised Bayer thresholds in the range (0, 1). */
export function bayerTable(size: 2 | 4 | 8): Float32Array {
  const cached = matrixCache.get(size)
  if (cached) {
    return cached
  }

  const raw = buildBayer(size)
  const table = new Float32Array(size * size)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = raw[y * size + x] ?? 0
      table[y * size + x] = (value + 0.5) / (size * size)
    }
  }

  matrixCache.set(size, table)
  return table
}

const NOISE_SIZE = 64
let noiseBuffer: Float32Array | null = null

function noiseTable(): Float32Array {
  if (noiseBuffer) {
    return noiseBuffer
  }

  let seed = 0x9e3779b9
  const table = new Float32Array(NOISE_SIZE * NOISE_SIZE)

  for (let index = 0; index < table.length; index += 1) {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    table[index] = (seed >>> 0) / 0xffffffff
  }

  noiseBuffer = table
  return table
}

function thresholdFor(matrix: MatrixId, x: number, y: number): number {
  if (matrix === 'noise') {
    const table = noiseTable()
    return table[(y % NOISE_SIZE) * NOISE_SIZE + (x % NOISE_SIZE)] ?? 0.5
  }

  const size = MATRIX_SIZES[matrix]
  const table = bayerTable(size)
  return table[(y % size) * size + (x % size)] ?? 0.5
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized.padEnd(6, '0')

  const channel = (start: number) => Number.parseInt(value.slice(start, start + 2), 16) || 0

  return [channel(0), channel(2), channel(4)]
}

function resolveInks(options: Pick<DitherOptions, 'ink' | 'hotInk' | 'paper'>) {
  return {
    paper: hexToRgb(options.paper),
    ink: hexToRgb(options.ink),
    hotInk: hexToRgb(options.hotInk ?? options.ink),
  }
}

/**
 * Turns one tone per cell (0 = paper, 1 = ink) into ordered-dither pixels.
 * The output is one pixel per cell; scale it up with `image-rendering: pixelated`.
 */
export function toneToImageData(tones: Float32Array, width: number, height: number, options: DitherOptions): ImageData {
  const colors = resolveInks(options)
  const hotAbove = options.hotAbove ?? 0.78
  const invert = options.invert ?? false
  const bytes = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      const tone = tones[index] ?? 0
      const mask = thresholdFor(options.matrix, x, y)
      const passes = invert ? tone < mask : tone > mask
      const hot = options.hotMask ? (options.hotMask[index] ?? 0) >= 0.5 : tone >= hotAbove
      const color = passes ? (hot ? colors.hotInk : colors.ink) : colors.paper
      const offset = index * 4

      bytes[offset] = color[0]
      bytes[offset + 1] = color[1]
      bytes[offset + 2] = color[2]
      bytes[offset + 3] = 255
    }
  }

  return new ImageData(bytes, width, height)
}

function luminanceFromImageData(data: ImageData): Float32Array {
  const { data: pixels } = data
  const luminance = new Float32Array(data.width * data.height)

  for (let index = 0; index < luminance.length; index += 1) {
    const offset = index * 4
    luminance[index] =
      ((pixels[offset] ?? 0) * 0.299 + (pixels[offset + 1] ?? 0) * 0.587 + (pixels[offset + 2] ?? 0) * 0.114) / 255
  }

  return luminance
}

/**
 * Area-averages an image into a cell grid and returns one tone per cell.
 * The crop follows `object-fit: cover` so the grid never stretches.
 */
export function sampleTones(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  columns: number,
  rows: number,
): Float32Array {
  const sourceAspect = sourceWidth / sourceHeight
  const targetAspect = columns / rows

  let sw = sourceWidth
  let sh = sourceHeight

  if (sourceAspect > targetAspect) {
    sw = sourceHeight * targetAspect
  } else {
    sh = sourceWidth / targetAspect
  }

  const sx = (sourceWidth - sw) / 2
  const sy = (sourceHeight - sh) / 2

  context.clearRect(0, 0, columns, rows)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, sx, sy, sw, sh, 0, 0, columns, rows)

  return luminanceFromImageData(context.getImageData(0, 0, columns, rows))
}
