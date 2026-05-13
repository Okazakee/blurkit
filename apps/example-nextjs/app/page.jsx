import path from 'node:path'
import { encode } from 'blurkit/node'

const imagePath = path.join(process.cwd(), 'public', 'hero.svg')
const placeholder = await encode(imagePath, {
  algorithm: 'blurhash',
  size: 32,
  outputFormat: 'png',
})

export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>blurkit + Next.js</h1>
      <p style={{ color: '#444', marginTop: 0 }}>
        This page uses <code>blurkit/node</code> in a server component to generate a placeholder from a local file.
      </p>

      <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <figure style={{ margin: 0 }}>
          <figcaption style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Generated placeholder</figcaption>
          <img
            src={placeholder.dataURL}
            alt="Generated placeholder"
            style={{ width: '100%', borderRadius: 12, border: '1px solid #ddd', background: '#f4f4f4' }}
          />
        </figure>

        <figure style={{ margin: 0 }}>
          <figcaption style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Source image</figcaption>
          <img
            src="/hero.svg"
            alt="Source image"
            style={{ width: '100%', borderRadius: 12, border: '1px solid #ddd', background: '#f4f4f4' }}
          />
        </figure>
      </section>

      <pre style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: 12, background: '#101828', color: '#d0d5dd', overflowX: 'auto' }}>
{JSON.stringify({
  hash: placeholder.hash,
  width: placeholder.width,
  height: placeholder.height,
  algorithm: placeholder.algorithm,
}, null, 2)}
      </pre>
    </main>
  )
}
