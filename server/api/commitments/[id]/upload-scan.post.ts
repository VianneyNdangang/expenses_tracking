import fs from 'node:fs/promises'
import path from 'node:path'
import { Commitment } from '../../../models/Commitment'
import { logAudit } from '../../../utils/audit'
import { requireRole } from '../../../utils/roles'
import { savePrivateDocument } from '../../../utils/privateFiles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'SECRETAIRE')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant d’engagement manquant.' })
  }

  const commitment = await Commitment.findById(id)
  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  if (!['Accepté', 'Payé', 'Justifié'].includes(commitment.status) || commitment.isCancelled) {
    throw createError({
      statusCode: 409,
      statusMessage: 'La lettre signée peut être jointe après acceptation de l’engagement.'
    })
  }

  const body = await readBody<{ filename?: unknown, base64?: unknown }>(event)
  if (typeof body?.filename !== 'string' || typeof body.base64 !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Fichier ou nom de fichier manquant'
    })
  }

  const uploadDir = path.resolve(process.cwd(), 'storage', 'signed-letter-scans')
  const safeLetterNumber = commitment.letterNumber.replace(/[^a-zA-Z0-9]/g, '_')
  const savedDocument = await savePrivateDocument(body.base64, body.filename, uploadDir, `signed_${safeLetterNumber}`)

  const previousScanReference = commitment.signedLetterScanUrl
  commitment.signedLetterScanUrl = `private:${savedDocument.storedFilename}`
  commitment.signedLetterScanFilename = savedDocument.originalFilename
  try {
    await commitment.save()
  } catch (error) {
    await fs.unlink(savedDocument.filePath)
    throw error
  }

  await logAudit(event, {
    action: 'UPLOAD_SIGNED_LETTER_SCAN',
    entity: 'Commitment',
    entityId: commitment._id.toString(),
    before: { scan: previousScanReference ? 'present' : 'absent' },
    after: { filename: savedDocument.originalFilename }
  })

  return {
    success: true,
    filename: savedDocument.originalFilename
  }
})
