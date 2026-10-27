import { useEffect, useRef } from 'react'

import { toneToImageData } from '../lib/dither'

const CELL = 5
const PAPER = '#0a0a0b'
const INK = '#e9e5dd'
const HOT_INK = '#63dff6'

/**
 * One tone per cell for a slow signal trace: a wavy centre line that
 * fades into paper, with a faint printed grain across the band.
 */
function buildTones(columns: number, rows: number, seconds: number): Float32Array {
  const tones = new Float32Array(columns * rows)
  const spread = 0.1

  for (let y = 0; y < rows; y += 1) {
    const ny = (y + 0.5) / rows

    for (let x = 0; x < columns; x += 1) {
      const nx = (x + 0.5) / columns
      const wave =
        0.5 +
        0.19 * Math.sin(nx * 5.6 + seconds * 0.32) +
        0.07 * Math.sin(nx * 12.4 - seconds * 0.21) +
        0.03 * Math.sin(nx * 26.1 + seconds * 0.47)
      const distance = (ny - wave) / spread

      tones[y * columns + x] = Math.min(0.82, 0.05 + 0.8 * Math.exp(-distance * distance))
    }
  }

  return tones
}

export function SignalBand() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const element: HTMLCanvasElement = canvas
    const ctx: CanvasRenderingContext2D = context

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let columns = 0
    let rows = 0
    let frame = 0
    let lastPaint = 0
    let visible = true
    let started = performance.now()

    function paint(seconds: number) {
      const tones = buildTones(columns, rows, seconds)
      const pixels = toneToImageData(tones, columns, rows, {
        matrix: 'bayer8',
        ink: INK,
        hotInk: HOT_INK,
        hotAbove: 0.45,
        paper: PAPER,
      })

      ctx.putImageData(pixels, 0, 0)
    }

    function resize() {
      const bounds = element.getBoundingClientRect()
      const nextColumns = Math.max(24, Math.round(bounds.width / CELL))
      const nextRows = Math.max(8, Math.round(bounds.height / CELL))

      if (nextColumns === columns && nextRows === rows) {
        return
      }

      columns = nextColumns
      rows = nextRows
      element.width = columns
      element.height = rows
      paint((performance.now() - started) / 1000)
    }

    function tick(now: number) {
      if (!visible || document.hidden) {
        frame = requestAnimationFrame(tick)
        return
      }

      if (now - lastPaint > 1000 / 18) {
        lastPaint = now
        paint((now - started) / 1000)
      }

      frame = requestAnimationFrame(tick)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(element)

    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
    })
    intersectionObserver.observe(element)

    resize()

    if (reducedMotion) {
      paint(2.4)
    } else {
      started = performance.now()
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="band__canvas" aria-hidden="true" />
}
