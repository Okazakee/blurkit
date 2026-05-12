import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from 'react'

import { encode } from 'blurkit/browser'

type Algorithm = 'blurhash' | 'thumbhash'
type OutputFormat = 'png' | 'jpeg'
type EncodeResult = Awaited<ReturnType<typeof encode>>
type CopyField = 'hash' | 'dataURL' | 'manifest'
type DemoStage = 'idle' | 'busy' | 'ready'

type DemoSample = {
  id: string
  label: string
  description: string
  filename: string
  svg: string
}

type SelectOption<T extends string> = {
  value: T
  label: string
  description: string
}

const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'coastline',
    label: 'Coastline',
    description: 'Wide landscape sample',
    filename: 'sample-coastline.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#8e6cff" />
          <stop offset="100%" stop-color="#67ecff" />
        </linearGradient>
        <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#11366f" />
          <stop offset="100%" stop-color="#08172d" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)" />
      <circle cx="1220" cy="180" r="110" fill="#fff1b8" opacity="0.95" />
      <path d="M0 520C220 470 380 460 560 500s270 95 450 74 365-110 590-48v354H0Z" fill="url(#sea)" />
      <path d="M0 650C205 600 425 578 628 612c172 29 274 102 472 105 183 3 318-80 500-56v239H0Z" fill="#0b0a16" />
    </svg>`,
  },
  {
    id: 'portrait',
    label: 'Portrait',
    description: 'Tall portrait sample',
    filename: 'sample-portrait.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#11162f" />
          <stop offset="100%" stop-color="#43298d" />
        </linearGradient>
      </defs>
      <rect width="900" height="1200" fill="url(#bg)" />
      <circle cx="450" cy="390" r="180" fill="#f1c8a8" />
      <path d="M270 980c16-180 118-284 180-284s164 104 180 284" fill="#67ecff" opacity="0.95" />
      <path d="M240 322c25-160 151-238 210-238 82 0 183 66 220 214-85-51-154-73-214-73-76 0-148 29-216 97Z" fill="#080914" />
      <rect x="170" y="960" width="560" height="160" rx="80" fill="#8e6cff" opacity="0.88" />
    </svg>`,
  },
  {
    id: 'icon-board',
    label: 'Icon board',
    description: 'Compact graphic sample',
    filename: 'sample-icons.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <rect width="1200" height="900" rx="80" fill="#0e1021" />
      <rect x="120" y="120" width="960" height="660" rx="44" fill="#141938" />
      <rect x="190" y="190" width="220" height="220" rx="48" fill="#67ecff" />
      <rect x="490" y="190" width="220" height="220" rx="48" fill="#8e6cff" />
      <rect x="790" y="190" width="220" height="220" rx="48" fill="#f7a9ff" />
      <circle cx="300" cy="600" r="112" fill="#ffe08c" />
      <path d="M600 500h150c68 0 124 56 124 124s-56 124-124 124H600Z" fill="#67ecff" opacity="0.85" />
      <path d="M468 726 612 474l144 252Z" fill="#8e6cff" opacity="0.92" />
    </svg>`,
  },
]

const ALGORITHM_OPTIONS: SelectOption<Algorithm>[] = [
  {
    value: 'blurhash',
    label: 'BlurHash',
    description: 'Configurable blur grid for richer gradients.',
  },
  {
    value: 'thumbhash',
    label: 'ThumbHash',
    description: 'Compact placeholder with built-in aspect data.',
  },
]

const OUTPUT_OPTIONS: SelectOption<OutputFormat>[] = [
  {
    value: 'png',
    label: 'PNG',
    description: 'Sharper edges and transparent-safe output.',
  },
  {
    value: 'jpeg',
    label: 'JPEG',
    description: 'Smaller output with opaque compression.',
  },
]

function createSampleFile(sample: DemoSample): File {
  return new File([sample.svg], sample.filename, { type: 'image/svg+xml' })
}

function isSupportedImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|webp)$/i.test(file.name)
}

function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
  const selectedOption = options.find((option) => option.value === value) ?? options[0]!

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className={`bk-select ${isOpen ? 'bk-select--open' : ''}`} ref={rootRef}>
      <span className="bk-demo-label">{label}</span>
      <button
        className="bk-select-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="bk-select-trigger-copy">
          <strong>{selectedOption.label}</strong>
          <span>{selectedOption.description}</span>
        </span>
        <span className="bk-select-arrow" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path
              d="M4 6.5 8 10.5l4-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </span>
      </button>
      {isOpen ? (
        <div className="bk-select-menu" id={listboxId} role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`bk-select-option ${option.value === value ? 'bk-select-option--active' : ''}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <span className="bk-select-option-copy">
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </span>
              <span className="bk-select-check" aria-hidden="true">
                {option.value === value ? (
                  <svg viewBox="0 0 16 16" focusable="false">
                    <path
                      d="M3.5 8.5 6.5 11.5 12.5 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function BlurDemo() {
  const [file, setFile] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [algorithm, setAlgorithm] = useState<Algorithm>('blurhash')
  const [size, setSize] = useState(32)
  const [componentX, setComponentX] = useState(4)
  const [componentY, setComponentY] = useState(3)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png')
  const [result, setResult] = useState<EncodeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isEncoding, setIsEncoding] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [copyField, setCopyField] = useState<CopyField | null>(null)
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const uploadDescribedBy = ['bk-demo-upload-hint', uploadError ? 'bk-demo-upload-error' : null].filter(Boolean).join(' ')
  const stage: DemoStage = isEncoding ? 'busy' : result ? 'ready' : 'idle'

  const manifestPreview = useMemo(() => {
    if (!result) {
      return null
    }

    return JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        images: {
          [file?.name ?? 'upload']: result,
        },
      },
      null,
      2,
    )
  }, [file?.name, result])

  useEffect(() => {
    if (!file) {
      setPreviewURL(null)
      return
    }

    const objectURL = URL.createObjectURL(file)
    setPreviewURL(objectURL)
    return () => URL.revokeObjectURL(objectURL)
  }, [file])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!file) {
        setResult(null)
        setError(null)
        setIsEncoding(false)
        return
      }

      setIsEncoding(true)
      setError(null)

      try {
        const next = await encode(file, {
          algorithm,
          size,
          componentX,
          componentY,
          outputFormat,
        })

        if (!cancelled) {
          setResult(next)
          setError(null)
          setIsEncoding(false)
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : String(nextError))
          setResult(null)
          setIsEncoding(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [algorithm, componentX, componentY, file, outputFormat, retryNonce, size])

  async function copyValue(field: CopyField, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopyField(field)
      window.setTimeout(() => {
        setCopyField((current) => (current === field ? null : current))
      }, 1400)
    } catch {
      setError('Copy failed. Your browser did not grant clipboard access.')
    }
  }

  function resetDemo() {
    setFile(null)
    setPreviewURL(null)
    setResult(null)
    setError(null)
    setUploadError(null)
    setIsDragging(false)
    setActiveSampleId(null)
    setCopyField(null)
    setRetryNonce(0)
    setFileInputKey((current) => current + 1)
  }

  function handleIncomingFile(nextFile: File | null, source: 'upload' | 'sample') {
    if (!nextFile) {
      return
    }

    if (!isSupportedImage(nextFile)) {
      setUploadError('Only image files are supported in the browser demo.')
      return
    }

    setUploadError(null)
    setError(null)
    setResult(null)
    setFile(nextFile)
    setActiveSampleId(source === 'sample' ? nextFile.name : null)
    setFileInputKey((current) => current + 1)
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleIncomingFile(event.dataTransfer.files?.[0] ?? null, 'upload')
  }

  function downloadPlaceholder() {
    if (!result) {
      return
    }

    const anchor = document.createElement('a')
    anchor.href = result.dataURL
    anchor.download = `${file?.name?.replace(/\.[^.]+$/, '') ?? 'placeholder'}.${outputFormat}`
    anchor.click()
  }

  return (
    <div className="bk-demo">
      <div className="bk-demo-intro">
        <p className="site-muted">
          Upload an image, switch algorithms, and inspect the exact <span className="site-inline-code">hash</span>,{' '}
          <span className="site-inline-code">dataURL</span>, and manifest entry shape returned by the browser runtime.
        </p>
      </div>

      <div className="bk-demo-workbench">
        <section className="bk-demo-column bk-demo-column--controls">
          <div className="bk-demo-panel-copy">
            <span className="bk-demo-panel-kicker">1. Input controls</span>
            <h3>Choose a source and tune the encoding pass.</h3>
          </div>

          <div className="bk-demo-statusbar" aria-live="polite">
            <div className={`bk-demo-status ${stage === 'busy' ? 'bk-demo-status--busy' : stage === 'ready' ? 'bk-demo-status--ready' : ''}`}>
              {stage === 'busy' ? 'Generating placeholder…' : stage === 'ready' ? 'Placeholder ready' : 'Waiting for upload'}
            </div>
            {error ? (
              <div className="bk-demo-error-row">
                <p className="bk-demo-error">{error}</p>
                {file ? (
                  <button className="site-button site-button--ghost site-button--small" type="button" onClick={() => setRetryNonce((current) => current + 1)}>
                    Retry
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className={`bk-demo-card bk-demo-card--hero bk-demo-dropzone ${isDragging ? 'bk-demo-dropzone--dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="bk-demo-dropzone-copy">
              <span className="bk-demo-label">Upload an image</span>
              <p id="bk-demo-upload-hint">Drop a file here or use the picker. PNG, JPEG, WebP, SVG, and other image formats are accepted.</p>
            </div>
            <input
              key={fileInputKey}
              ref={fileInputRef}
              className="bk-demo-file-input"
              type="file"
              accept="image/*"
              aria-describedby={uploadDescribedBy}
              onChange={(event) => handleIncomingFile(event.target.files?.[0] ?? null, 'upload')}
            />
            <div className="bk-demo-toolbar">
              <button className="site-button site-button--primary" type="button" onClick={() => fileInputRef.current?.click()}>
                Choose image
              </button>
              <button className="site-button site-button--ghost" type="button" onClick={resetDemo}>
                Reset
              </button>
            </div>
            <div className="bk-demo-meta">
              <span>Processing stays in the browser.</span>
              <span>{file ? file.name : 'No file selected'}</span>
            </div>
            {uploadError ? (
              <p className="bk-demo-error bk-demo-error--inline" id="bk-demo-upload-error">
                {uploadError}
              </p>
            ) : null}
            <div className="bk-demo-samples" aria-label="Sample images">
              {DEMO_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  className={`bk-demo-sample ${activeSampleId === sample.filename ? 'bk-demo-sample--active' : ''}`}
                  type="button"
                  onClick={() => handleIncomingFile(createSampleFile(sample), 'sample')}
                >
                  <strong>{sample.label}</strong>
                  <span>{sample.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bk-demo-card bk-demo-controls-card">
            <div className="bk-demo-control-grid">
              <CustomSelect label="Algorithm" value={algorithm} options={ALGORITHM_OPTIONS} onChange={setAlgorithm} />
              <CustomSelect label="Output format" value={outputFormat} options={OUTPUT_OPTIONS} onChange={setOutputFormat} />

              <label className="bk-demo-control">
                <span className="bk-demo-label">Size</span>
                <input
                  type="range"
                  min="12"
                  max="64"
                  value={size}
                  onChange={(event) => setSize(Number(event.target.value))}
                />
                <div className="bk-demo-meta">
                  <span>Longest side</span>
                  <strong>{size}px</strong>
                </div>
              </label>

              <label className="bk-demo-control" aria-disabled={algorithm !== 'blurhash'} data-disabled={algorithm !== 'blurhash' || undefined}>
                <span className="bk-demo-label" title="Controls horizontal detail for the BlurHash grid. Higher values retain more structure.">
                  BlurHash X components
                </span>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={componentX}
                  disabled={algorithm !== 'blurhash'}
                  onChange={(event) => setComponentX(Number(event.target.value))}
                />
                <div className="bk-demo-meta">
                  <span>Horizontal detail</span>
                  <strong>{componentX}</strong>
                </div>
              </label>

              <label className="bk-demo-control" aria-disabled={algorithm !== 'blurhash'} data-disabled={algorithm !== 'blurhash' || undefined}>
                <span className="bk-demo-label" title="Controls vertical detail for the BlurHash grid. Higher values retain more structure.">
                  BlurHash Y components
                </span>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={componentY}
                  disabled={algorithm !== 'blurhash'}
                  onChange={(event) => setComponentY(Number(event.target.value))}
                />
                <div className="bk-demo-meta">
                  <span>Vertical detail</span>
                  <strong>{componentY}</strong>
                </div>
              </label>
            </div>
          </div>
        </section>

        <section className="bk-demo-column bk-demo-column--preview">
          <div className="bk-demo-panel-copy">
            <span className="bk-demo-panel-kicker">2. Main preview</span>
            <h3>Compare source pixels against the generated placeholder.</h3>
          </div>

          <div className="bk-demo-card bk-demo-stage-card">
            <div className="bk-demo-preview bk-demo-preview--featured">
              <figure className="bk-demo-media">
                <figcaption>Original upload</figcaption>
                {previewURL ? (
                  <>
                    <div className="bk-demo-media-frame">
                      <img
                        src={previewURL}
                        alt="Original upload"
                        loading="lazy"
                        decoding="async"
                        width={result?.meta?.originalWidth}
                        height={result?.meta?.originalHeight}
                      />
                      {isEncoding ? (
                        <div className="bk-demo-media-overlay">
                          <span className="bk-demo-spinner" aria-hidden="true" />
                          <span>Processing source</span>
                        </div>
                      ) : null}
                    </div>
                    {result?.meta ? (
                      <div className="bk-demo-dimensions">
                        <span>
                          Original: {result.meta.originalWidth} × {result.meta.originalHeight}
                        </span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="bk-demo-empty">
                    <strong>No image selected</strong>
                    <span>Choose a PNG, JPEG, or WebP file to preview the original image here.</span>
                  </div>
                )}
              </figure>

              <figure className="bk-demo-media">
                <figcaption>Rendered placeholder</figcaption>
                {result ? (
                  <>
                    <div className="bk-demo-media-frame">
                      <img
                        src={result.dataURL}
                        alt="Generated placeholder"
                        loading="lazy"
                        decoding="async"
                        width={result.width}
                        height={result.height}
                      />
                      {isEncoding ? (
                        <div className="bk-demo-media-overlay">
                          <span className="bk-demo-spinner" aria-hidden="true" />
                          <span>Refreshing preview</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="bk-demo-dimensions">
                      <span>
                        Placeholder: {result.width} × {result.height}
                      </span>
                      {result.meta ? (
                        <span>
                          Source: {result.meta.originalWidth} × {result.meta.originalHeight}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : isEncoding ? (
                  <div className="bk-demo-empty bk-demo-empty--loading">
                    <span className="bk-demo-spinner" aria-hidden="true" />
                    <strong>Generating placeholder…</strong>
                    <span>The browser runtime is decoding, hashing, and rendering a preview.</span>
                  </div>
                ) : error ? (
                  <div className="bk-demo-empty">
                    <strong>Placeholder failed</strong>
                    <span>Adjust the input or settings and try again. The original preview remains available.</span>
                  </div>
                ) : (
                  <div className="bk-demo-empty">
                    <strong>No placeholder yet</strong>
                    <span>Upload an image to render the generated preview here.</span>
                  </div>
                )}
              </figure>
            </div>
          </div>
        </section>

        <section className="bk-demo-column bk-demo-column--outputs">
          <div className="bk-demo-panel-copy">
            <span className="bk-demo-panel-kicker">3. Metadata output</span>
            <h3>Copy the exact values you would ship in production.</h3>
          </div>

          <div className="bk-demo-results">
            <div className="bk-demo-card">
              <div className="bk-demo-output-header">
                <h3>Hash</h3>
                {result ? (
                  <button className="site-button site-button--ghost site-button--small" type="button" onClick={() => copyValue('hash', result.hash)}>
                    {copyField === 'hash' ? 'Copied' : 'Copy'}
                  </button>
                ) : null}
              </div>
              {result ? (
                <pre>{result.hash}</pre>
              ) : (
                <div className="bk-demo-empty bk-demo-empty--compact">
                  <strong>No hash yet</strong>
                  <span>The selected algorithm output will appear here after encoding.</span>
                </div>
              )}
            </div>

            <div className="bk-demo-card">
              <div className="bk-demo-output-header">
                <h3>Data URL</h3>
                {result ? (
                  <div className="bk-demo-output-actions">
                    <button className="site-button site-button--ghost site-button--small" type="button" onClick={() => copyValue('dataURL', result.dataURL)}>
                      {copyField === 'dataURL' ? 'Copied' : 'Copy'}
                    </button>
                    <button className="site-button site-button--ghost site-button--small" type="button" onClick={downloadPlaceholder}>
                      Download
                    </button>
                  </div>
                ) : null}
              </div>
              {result ? (
                <pre>{result.dataURL}</pre>
              ) : (
                <div className="bk-demo-empty bk-demo-empty--compact">
                  <strong>No data URL yet</strong>
                  <span>The rendered placeholder data URL will appear here once generation finishes.</span>
                </div>
              )}
            </div>

            <div className="bk-demo-card">
              <div className="bk-demo-output-header">
                <h3>Manifest preview</h3>
                {manifestPreview ? (
                  <button className="site-button site-button--ghost site-button--small" type="button" onClick={() => copyValue('manifest', manifestPreview)}>
                    {copyField === 'manifest' ? 'Copied' : 'Copy'}
                  </button>
                ) : null}
              </div>
              {manifestPreview ? (
                <pre>{manifestPreview}</pre>
              ) : (
                <div className="bk-demo-empty bk-demo-empty--compact">
                  <strong>No manifest yet</strong>
                  <span>The JSON manifest entry for this image will appear here after a successful encode.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
