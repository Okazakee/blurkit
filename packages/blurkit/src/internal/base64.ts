function toBinaryString(bytes: Uint8Array): string {
  let result = ''
  for (const byte of bytes) {
    result += String.fromCharCode(byte)
  }
  return result
}

function fromBinaryString(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length)
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index)
  }
  return bytes
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  return btoa(toBinaryString(bytes))
}

function decodeBase64(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'))
  }

  return fromBinaryString(atob(value))
}

export function toBase64URL(bytes: Uint8Array): string {
  return encodeBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function fromBase64URL(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (normalized.length % 4)) % 4
  return decodeBase64(normalized + '='.repeat(padding))
}

export function bytesToDataURL(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${encodeBase64(bytes)}`
}

