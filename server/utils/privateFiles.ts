import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

export const MAX_PRIVATE_DOCUMENT_SIZE = 20 * 1024 * 1024

const FILE_TYPES: Record<string, { extensions: string[] }> = {
  'application/pdf': { extensions: ['.pdf'] },
  'image/jpeg': { extensions: ['.jpg', '.jpeg'] },
  'image/png': { extensions: ['.png'] },
  'image/webp': { extensions: ['.webp'] }
}

const hasValidFileSignature = (buffer: Buffer, mimeType: string) => {
  if (mimeType === 'application/pdf') return buffer.subarray(0, 5).toString() === '%PDF-'
  if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mimeType === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  return false
}

const sanitizeOriginalFilename = (filename: string) => {
  const basename = filename.trim().split(/[\\/]/).pop() || ''
  return Array.from(basename, (character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 ? '_' : character
  }).join('').slice(0, 255)
}

export async function savePrivateDocument(
  dataUrl: string,
  filename: string,
  storageDir: string,
  prefix: string
) {
  const originalFilename = sanitizeOriginalFilename(filename)
  const match = dataUrl.match(/^data:(application\/pdf|image\/jpeg|image\/png|image\/webp);base64,([A-Za-z0-9+/]+={0,2})$/i)
  if (!originalFilename || !match) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format de fichier non pris en charge. Utilisez un PDF, un JPG, un PNG ou un WEBP.'
    })
  }

  const mimeType = match[1]!.toLowerCase()
  const fileType = FILE_TYPES[mimeType]
  if (!fileType) {
    throw createError({ statusCode: 400, statusMessage: 'Format de fichier non pris en charge.' })
  }

  const extension = path.extname(originalFilename).toLowerCase()
  if (!fileType.extensions.includes(extension)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'L’extension du fichier ne correspond pas à son format.'
    })
  }

  const encodedFile = match[2]!
  if (encodedFile.length % 4 !== 0 || encodedFile.length > Math.ceil(MAX_PRIVATE_DOCUMENT_SIZE * 4 / 3) + 4) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Le fichier doit peser moins de 20 Mo.'
    })
  }

  const buffer = Buffer.from(encodedFile, 'base64')
  if (
    buffer.length === 0
    || buffer.length > MAX_PRIVATE_DOCUMENT_SIZE
    || buffer.toString('base64') !== encodedFile
  ) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Le fichier est vide, invalide ou dépasse 20 Mo.'
    })
  }
  if (!hasValidFileSignature(buffer, mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le contenu du fichier ne correspond pas à son format.'
    })
  }

  await fs.mkdir(storageDir, { recursive: true })
  const storedFilename = `${prefix}_${crypto.randomUUID()}${extension}`
  const filePath = path.join(storageDir, storedFilename)
  await fs.writeFile(filePath, buffer, { flag: 'wx' })

  return { originalFilename, storedFilename, filePath }
}

export function resolvePrivateDocument(reference: string, storageDir: string) {
  if (!reference.startsWith('private:')) {
    throw createError({ statusCode: 404, statusMessage: 'Document introuvable.' })
  }

  const filename = reference.slice('private:'.length)
  if (!filename || path.basename(filename) !== filename) {
    throw createError({ statusCode: 404, statusMessage: 'Document introuvable.' })
  }

  return path.join(storageDir, filename)
}
