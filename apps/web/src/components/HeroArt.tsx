import { useEffect, useRef } from 'react'

import { toneToImageData } from '../lib/dither'

const CELL = 4
const PAPER = '#0a0a0b'
const INK = '#e9e5dd'
const HOT_INK = '#63dff6'

/**
 * Decorative page artwork: a lit sphere printed in two tones.
 * No image input, no controls - it is a texture for the hero, not a feature.
 */
function buildTones(columns: number, rows: number, seconds: number) {
  const tones = new Float32Array(columns * rows)
  const highlight = new Float32Array(columns * rows)
  const aspect = columns / Math.max(1, rows)
  const centerX = 0.54
  const centerY = 0.47
  const radius = 0.43

  const lightAngle = -0.5 + Math.sin(seconds * 0.12) * 0.8
  const lx = Math.cos(lightAngle) * 0.62
  const ly = -0.58
  const lz = Math.sqrt(Math.max(0.15, 1 - lx * lx - ly * ly))

  for (let y = 0; y < rows; y += 1) {
    const ny = (y + 0.5) / rows

    for (let x = 0; x < columns; x += 1) {
      const nx = (x + 0.5) / columns
      const dx = ((nx - centerX) * aspect) / radius
      const dy = (ny - centerY) / radius
      const distanceSquared = dx * dx + dy * dy

      if (distanceSquared >= 1) {
        tones[y * columns + x] = 0.03
        continue
      }

      const nz = Math.sqrt(1 - distanceSquared)
      const diffuse = Math.max(0, dx * lx + dy * ly + nz * lz)
      const rim = (1 - nz) ** 5
      const tone = Math.min(0.87, 0.04 + 0.8 * diffuse ** 1.5 + 0.22 * rim)

      tones[y * columns + x] = tone
      // Lit dots carry the accent; shadow dots stay bone.
      highlight[y * columns + x] = tone >= 0.24 ? 1 : 0
    }
  }

  return { tones, highlight }
}

export function HeroArt() {
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
      const { tones, highlight } = buildTones(columns, rows, seconds)
      const pixels = toneToImageData(tones, columns, rows, {
        matrix: 'bayer8',
        ink: INK,
        hotInk: HOT_INK,
        hotMask: highlight,
        paper: PAPER,
      })

      ctx.putImageData(pixels, 0, 0)
    }

    function resize() {
      const bounds = element.getBoundingClientRect()
      const nextColumns = Math.max(24, Math.round(bounds.width / CELL))
      const nextRows = Math.max(24, Math.round(bounds.height / CELL))

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

      if (now - lastPaint > 1000 / 15) {
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
      paint(1.2)
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

  return <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
}
