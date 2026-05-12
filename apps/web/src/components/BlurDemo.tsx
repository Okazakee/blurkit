import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import type { BlurAlgorithm, BlurOutputFormat, BlurResult } from 'blurkit'
import { encode } from 'blurkit/browser'

type OutputTab = 'dataURL' | 'hash' | 'details'

type DemoSource = {
  input: Blob
  kind: 'preset' | 'upload'
  label: string
  previewURL: string
  size: number
  type: string
}

type SelectOption<T extends string> = {
  description?: string
  label: string
  value: T
}

const TEST_IMAGE_PATH = '/test.webp'
const TEST_IMAGE_LABEL = 'test.webp'
const SIZE_MIN = 8
const SIZE_MAX = 96
const COMPONENT_MIN = 1
const COMPONENT_MAX = 9

const algorithmOptions: SelectOption<BlurAlgorithm>[] = [
  { value: 'blurhash', label: 'BlurHash', description: 'More tunable' },
  { value: 'thumbhash', label: 'ThumbHash', description: 'Compact default' },
]

const outputFormatOptions: SelectOption<BlurOutputFormat>[] = [
  { value: 'png', label: 'PNG', description: 'Lossless' },
  { value: 'jpeg', label: 'JPEG', description: 'Smaller output' },
]

function sanitizePositiveIntegerInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) {
    return ''
  }

  const normalized = String(Number.parseInt(digits, 10))
  return normalized === '0' ? '' : normalized
}

function parseOptionalPositiveInteger(value: string): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function createSource(blob: Blob, label: string, kind: DemoSource['kind']): DemoSource {
  return {
    input: blob,
    kind,
    label,
    previewURL: URL.createObjectURL(blob),
    size: blob.size,
    type: blob.type || 'image/png',
  }
}

function formatDimensions(width?: number, height?: number): string {
  if (!width || !height) {
    return 'Pending'
  }

  return `${width} × ${height}`
}

function buildDetails(result: BlurResult | null): string {
  if (!result) {
    return '// Generate a placeholder to inspect the result payload.'
  }

  return JSON.stringify(
    {
      algorithm: result.algorithm,
      width: result.width,
      height: result.height,
      meta: result.meta ?? null,
    },
    null,
    2,
  )
}

function DemoSelect<T extends string>({
  labelledBy,
  onChange,
  options,
  value,
}: {
  labelledBy: string
  onChange(value: T): void
  options: SelectOption<T>[]
  value: T
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className={`live-demo-select ${open ? 'live-demo-select--open' : ''}`.trim()} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelledBy}
        className="live-demo-select-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="live-demo-select-copy">
          <strong>{selected?.label}</strong>
          {selected?.description ? <span>{selected.description}</span> : null}
        </span>
      </button>

      {open ? (
        <div className="live-demo-select-menu" role="listbox" aria-labelledby={labelledBy}>
          {options.map((option) => (
            <button
              key={option.value}
              aria-selected={option.value === value}
              className={`live-demo-select-option ${option.value === value ? 'live-demo-select-option--active' : ''}`.trim()}
              role="option"
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span className="live-demo-select-copy">
                <strong>{option.label}</strong>
                {option.description ? <span>{option.description}</span> : null}
              </span>
              {option.value === value ? <span className="live-demo-select-check" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function BlurDemo() {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadErrorId = useId()
  const dimensionsHintId = useId()
  const algorithmLabelId = useId()
  const formatLabelId = useId()

  const [source, setSource] = useState<DemoSource | null>(null)
  const [result, setResult] = useState<BlurResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isEncoding, setIsEncoding] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<OutputTab>('dataURL')

  const [algorithm, setAlgorithm] = useState<BlurAlgorithm>('blurhash')
  const [size, setSize] = useState(32)
  const [widthInput, setWidthInput] = useState('')
  const [heightInput, setHeightInput] = useState('')
  const [componentX, setComponentX] = useState(4)
  const [componentY, setComponentY] = useState(3)
  const [outputFormat, setOutputFormat] = useState<BlurOutputFormat>('png')

  const width = useMemo(() => parseOptionalPositiveInteger(widthInput), [widthInput])
  const height = useMemo(() => parseOptionalPositiveInteger(heightInput), [heightInput])
  const hasDimensionOverride = width !== undefined || height !== undefined
  const usesBlurhash = algorithm === 'blurhash'
  const detailsOutput = useMemo(() => buildDetails(result), [result])

  const options = useMemo(
    () => ({
      algorithm,
      size,
      width,
      height,
      componentX,
      componentY,
      outputFormat,
    }),
    [algorithm, size, width, height, componentX, componentY, outputFormat],
  )

  useEffect(() => {
    let disposed = false

    async function loadPreset() {
      try {
        const response = await fetch(TEST_IMAGE_PATH)
        if (!response.ok) {
          throw new Error(`Failed to load ${TEST_IMAGE_PATH}. Add apps/web/public/test.webp to enable the preset demo.`)
        }

        const blob = await response.blob()
        const file =
          typeof File === 'function'
            ? new File([blob], TEST_IMAGE_LABEL, { type: blob.type || 'image/webp' })
            : blob

        const nextSource = createSource(file, TEST_IMAGE_LABEL, 'preset')
        if (disposed) {
          URL.revokeObjectURL(nextSource.previewURL)
          return
        }

        setSource((current) => {
          if (current) {
            URL.revokeObjectURL(nextSource.previewURL)
            return current
          }

          return nextSource
        })
        setError(null)
      } catch (caught) {
        if (!disposed) {
          setError(caught instanceof Error ? caught.message : 'Unable to load the preset image.')
        }
      } finally {
        if (!disposed) {
          setIsBootstrapping(false)
        }
      }
    }

    void loadPreset()

    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (!source) {
      return
    }

    return () => {
      URL.revokeObjectURL(source.previewURL)
    }
  }, [source])

  useEffect(() => {
    if (!source) {
      return
    }

    const currentSource = source
    let cancelled = false
    setIsEncoding(true)

    async function generatePlaceholder() {
      try {
        const nextResult = await encode(currentSource.input, options)
        if (cancelled) {
          return
        }

        setResult(nextResult)
        setError(null)
      } catch (caught) {
        if (!cancelled) {
          setResult(null)
          setError(caught instanceof Error ? caught.message : 'Unable to generate a placeholder for this image.')
        }
      } finally {
        if (!cancelled) {
          setIsEncoding(false)
        }
      }
    }

    void generatePlaceholder()

    return () => {
      cancelled = true
    }
  }, [source, options])

  function applyBlob(blob: Blob, label: string, kind: DemoSource['kind']) {
    if (!blob.type.startsWith('image/')) {
      setError('Only image files are supported in the browser demo.')
      return
    }

    setSource((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewURL)
      }

      return createSource(blob, label, kind)
    })
    setError(null)
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      applyBlob(file, file.name, 'upload')
    }

    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      applyBlob(file, file.name, 'upload')
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }

    setIsDragging(false)
  }

  function handleDropzoneKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div className="live-demo">
      <div className="live-demo-intro">
        <span className="live-demo-kicker">Live demo</span>
        <h2>Test blurkit in the browser.</h2>
        <p>Drop an image, adjust the settings, and inspect the generated output.</p>
      </div>

      <div className="live-demo-shell">
        <aside className="live-demo-rail">
          <section
            className={`live-demo-card live-demo-input-card ${isDragging ? 'live-demo-input-card--dragging' : ''}`.trim()}
            role="button"
            tabIndex={0}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={handleDropzoneKeyDown}
            onClick={() => inputRef.current?.click()}
          >
            <span className="live-demo-dropzone-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 16V7m0 0-3 3m3-3 3 3M5 17.5v.5A2 2 0 0 0 7 20h10a2 2 0 0 0 2-2v-.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                ></path>
              </svg>
            </span>

            <div className="live-demo-dropzone-copy">
              <span className="live-demo-card-kicker">Image input</span>
              <h3>Drop or browse</h3>
              <p>Use any local image. Processing stays in the browser.</p>
            </div>

            <input
              ref={inputRef}
              className="live-demo-file-input"
              type="file"
              accept="image/*"
              aria-describedby={error ? uploadErrorId : undefined}
              aria-invalid={Boolean(error)}
              onChange={handleFileSelection}
            />

            {error ? <p className="live-demo-error" id={uploadErrorId}>{error}</p> : null}
          </section>

          <section className="live-demo-card live-demo-controls">
            <h3>Controls</h3>

            <div className="live-demo-control-groups">
              <div className="live-demo-control-group">
                <label className="live-demo-field">
                  <span id={algorithmLabelId}>Algorithm</span>
                  <DemoSelect
                    labelledBy={algorithmLabelId}
                    options={algorithmOptions}
                    value={algorithm}
                    onChange={(value) => setAlgorithm(value)}
                  />
                </label>

                <label className="live-demo-field">
                  <span id={formatLabelId}>Output format</span>
                  <DemoSelect
                    labelledBy={formatLabelId}
                    options={outputFormatOptions}
                    value={outputFormat}
                    onChange={(value) => setOutputFormat(value)}
                  />
                </label>
              </div>

              <div className="live-demo-control-group">
                <label className="live-demo-field" aria-describedby={dimensionsHintId}>
                  <span>Size</span>
                  <div className="live-demo-range-row">
                    <input
                      type="range"
                      min={SIZE_MIN}
                      max={SIZE_MAX}
                      step={1}
                      value={size}
                      disabled={hasDimensionOverride}
                      onChange={(event) => setSize(Number.parseInt(event.target.value, 10))}
                    />
                    <strong>{size}px</strong>
                  </div>
                </label>

                <p className="live-demo-hint" id={dimensionsHintId}>
                  {hasDimensionOverride ? 'Size is ignored while width or height is set.' : 'Size scales the longest side.'}
                </p>

                <div className="live-demo-inline-fields">
                  <label className="live-demo-field">
                    <span>Width</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="auto"
                      value={widthInput}
                      onChange={(event) => setWidthInput(sanitizePositiveIntegerInput(event.target.value))}
                    />
                  </label>

                  <label className="live-demo-field">
                    <span>Height</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="auto"
                      value={heightInput}
                      onChange={(event) => setHeightInput(sanitizePositiveIntegerInput(event.target.value))}
                    />
                  </label>
                </div>
              </div>

              <div className="live-demo-control-group">
                <div className="live-demo-control-row">
                  <label className="live-demo-field" data-disabled={!usesBlurhash}>
                    <span>componentX</span>
                    <div className="live-demo-range-row">
                      <input
                        type="range"
                        min={COMPONENT_MIN}
                        max={COMPONENT_MAX}
                        step={1}
                        value={componentX}
                        disabled={!usesBlurhash}
                        onChange={(event) => setComponentX(Number.parseInt(event.target.value, 10))}
                      />
                      <strong>{componentX}</strong>
                    </div>
                  </label>

                  <label className="live-demo-field" data-disabled={!usesBlurhash}>
                    <span>componentY</span>
                    <div className="live-demo-range-row">
                      <input
                        type="range"
                        min={COMPONENT_MIN}
                        max={COMPONENT_MAX}
                        step={1}
                        value={componentY}
                        disabled={!usesBlurhash}
                        onChange={(event) => setComponentY(Number.parseInt(event.target.value, 10))}
                      />
                      <strong>{componentY}</strong>
                    </div>
                  </label>
                </div>

                <p className="live-demo-hint">
                  {usesBlurhash ? 'Higher values preserve more structure.' : 'These controls only apply to BlurHash.'}
                </p>
              </div>
            </div>
          </section>
        </aside>

        <div className="live-demo-stage">
          <section className="live-demo-card live-demo-preview-card">
            <div className="live-demo-preview-grid">
              <figure className="live-demo-frame">
                <figcaption>
                  <strong>Source</strong>
                  <span>{source?.kind === 'preset' ? 'Preset' : 'Upload'}</span>
                </figcaption>
                {source ? (
                  <img alt="Selected source preview" src={source.previewURL} />
                ) : (
                  <div className="live-demo-empty">
                    <strong>Loading preset image</strong>
                    <span>The demo boots from the local sample.</span>
                  </div>
                )}
              </figure>

              <figure className="live-demo-frame">
                <figcaption>
                  <strong>Placeholder</strong>
                  <span>{outputFormat.toUpperCase()}</span>
                </figcaption>
                {result ? (
                  <img alt="Generated placeholder preview" src={result.dataURL} />
                ) : (
                  <div className={`live-demo-empty ${isEncoding || isBootstrapping ? 'live-demo-empty--loading' : ''}`.trim()}>
                    {isEncoding || isBootstrapping ? <span className="live-demo-spinner" aria-hidden="true" /> : null}
                    <strong>{isEncoding || isBootstrapping ? 'Generating placeholder' : 'Placeholder preview'}</strong>
                    <span>{isEncoding || isBootstrapping ? 'Processing in the browser runtime.' : 'Choose an image to see the output.'}</span>
                  </div>
                )}
              </figure>
            </div>

            <dl className="live-demo-facts">
              <div>
                <dt>Original</dt>
                <dd>{formatDimensions(result?.meta?.originalWidth, result?.meta?.originalHeight)}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{formatDimensions(result?.width, result?.height)}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{result?.meta?.format ?? source?.type.replace('image/', '') ?? 'Pending'}</dd>
              </div>
            </dl>
          </section>

          <section className="live-demo-card live-demo-output-card">
            <div className="live-demo-output-header">
              <h3>Outputs</h3>
              <div className="live-demo-tab-list" role="tablist" aria-label="Placeholder outputs">
                {(['dataURL', 'hash', 'details'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`live-demo-tab ${activeTab === tab ? 'live-demo-tab--active' : ''}`.trim()}
                    role="tab"
                    type="button"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'dataURL' ? 'dataURL' : tab === 'hash' ? 'hash' : 'details'}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'dataURL' ? <pre>{result?.dataURL ?? '// Waiting for a generated data URL.'}</pre> : null}
            {activeTab === 'hash' ? <pre>{result?.hash ?? '// Waiting for a generated hash.'}</pre> : null}
            {activeTab === 'details' ? <pre>{detailsOutput}</pre> : null}
          </section>
        </div>
      </div>
    </div>
  )
}
