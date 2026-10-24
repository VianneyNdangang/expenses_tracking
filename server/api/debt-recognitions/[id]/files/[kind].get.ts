import fs from 'node:fs/promises'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { DebtRecognition } from '../../../../models/DebtRecognition'
import { requireRole } from '../../../../utils/roles'
import { resolvePrivateDocument } from '../../../../utils/privateFiles'

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
  const kind = getRouterParam(event, 'kind')
  if (!id || (kind !== 'signed' && kind !== 'justification')) {
    throw createError({ statusCode: 404, statusMessage: 'Document introuvable.' })
  }

  const recognition = await DebtRecognition.findById(id)
  if (!recognition) throw createError({ statusCode: 404, statusMessage: 'Reconnaissance de dette introuvable.' })

  const reference = kind === 'signed' ? recognition.signedDocumentRef : recognition.justificationRef
  const originalFilename = kind === 'signed' ? recognition.signedDocumentFilename : recognition.justificationFilename
  if (!reference || !originalFilename) {
    throw createError({ statusCode: 404, statusMessage: 'Aucun document n’est enregistré.' })
  }

  const storageDir = path.resolve(process.cwd(), 'storage', 'debt-recognitions')
  const filePath = resolvePrivateDocument(reference, storageDir)
  try {
    await fs.access(filePath)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw createError({ statusCode: 404, statusMessage: 'Le document n’est plus disponible.' })
    }
    throw error
  }

  const extension = path.extname(filePath).toLowerCase()
  const safeFilename = Array.from(originalFilename.split(/[\\/]/).pop() || 'document', (character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 || character === '"' ? '_' : character
  }).join('')
  const disposition = getQuery(event).download === '1' ? 'attachment' : 'inline'

  setHeader(event, 'Content-Type', MIME_TYPES[extension] || 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `${disposition}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`)
  setHeader(event, 'Cache-Control', 'private, no-store')
  return sendStream(event, createReadStream(filePath))
})
