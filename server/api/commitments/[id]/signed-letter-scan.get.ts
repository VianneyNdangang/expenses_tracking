import fs from 'node:fs/promises'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { Commitment } from '../../../models/Commitment'
import { requireRole } from '../../../utils/roles'

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'SECRETAIRE')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant d’engagement manquant.' })
  }

  const commitment = await Commitment.findById(id)
  if (!commitment?.signedLetterScanUrl) {
    throw createError({ statusCode: 404, statusMessage: 'Aucun scan signé n’est enregistré pour cet engagement.' })
  }

  const storedReference = commitment.signedLetterScanUrl
  const storageDir = path.resolve(process.cwd(), 'storage', 'signed-letter-scans')
  let filePath: string

  if (storedReference.startsWith('private:')) {
    const storedFilename = storedReference.slice('private:'.length)
    if (!storedFilename || path.basename(storedFilename) !== storedFilename) {
      throw createError({ statusCode: 404, statusMessage: 'Document introuvable.' })
    }
    filePath = path.join(storageDir, storedFilename)
  } else if (storedReference.startsWith('/uploads/')) {
    const legacyFilename = storedReference.split(/[\\/]/).pop() || ''
    if (!legacyFilename || path.basename(legacyFilename) !== legacyFilename) {
      throw createError({ statusCode: 404, statusMessage: 'Document introuvable.' })
    }
    filePath = path.resolve(process.cwd(), 'public', 'uploads', legacyFilename)
  } else {
    throw createError({ statusCode: 404, statusMessage: 'Document introuvable.' })
  }

  try {
    await fs.access(filePath)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw createError({ statusCode: 404, statusMessage: 'Le fichier du scan n’est plus disponible.' })
    }
    throw error
  }

  const extension = path.extname(filePath).toLowerCase()
  const mimeType = MIME_TYPES[extension] || 'application/octet-stream'
  const rawFilename = (commitment.signedLetterScanFilename || `lettre-signee${extension}`)
    .split(/[\\/]/)
    .pop()!
  const safeFilename = Array.from(rawFilename, (character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 || character === '"' ? '_' : character
  }).join('')
  const disposition = getQuery(event).download === '1' ? 'attachment' : 'inline'

  setHeader(event, 'Content-Type', mimeType)
  setHeader(event, 'Content-Disposition', `${disposition}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`)
  setHeader(event, 'Cache-Control', 'private, no-store')

  return sendStream(event, createReadStream(filePath))
})
