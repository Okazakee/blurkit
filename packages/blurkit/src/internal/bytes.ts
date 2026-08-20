/**
 * Returns an exact, owned view of a byte sequence.
 *
 * Typed-array views (including Node Buffer) may be a window into a larger
 * backing allocation with a non-zero `byteOffset` and a `byteLength` shorter
 * than the underlying `ArrayBuffer`. Consuming `view.buffer` directly would
 * read bytes outside the view. This helper normalizes to the exact view and
 * copies only when the view is not already a full-buffer view.
 */
export function toOwnedBytes(view: Uint8Array): Uint8Array<ArrayBuffer> {
  const buffer = view.buffer
  if (view.byteOffset === 0 && view.byteLength === buffer.byteLength) {
    // SAFETY: the checks above prove this view covers its backing buffer
    // exactly, so it is a plain ArrayBuffer-backed Uint8Array.
    return view as Uint8Array<ArrayBuffer>
  }

  const copy = new Uint8Array(view.byteLength)
  copy.set(view)
  return copy
}
