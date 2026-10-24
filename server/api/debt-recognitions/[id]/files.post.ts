import fs from 'node:fs/promises'
import path from 'node:path'
import { DebtRecognition } from '../../../models/DebtRecognition'
import { logAudit } from '../../../utils/audit'
import { requireRole } from '../../../utils/roles'
import { savePrivateDocument } from '../../../utils/privateFiles'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, 'PATRON', 'SECRETAIRE')
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })

  const recognition = await DebtRecognition.findById(id)
  if (!recognition) throw createError({ statusCode: 404, statusMessage: 'Reconnaissance de dette introuvable.' })

  const body = await readBody<{ kind?: unknown, filename?: unknown, base64?: unknown }>(event)
  if (
    (body?.kind !== 'signed' && body?.kind !== 'justification')
    || typeof body.filename !== 'string'
    || typeof body.base64 !== 'string'
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Type de document ou fichier manquant.' })
  }

  if (body.kind === 'signed' && recognition.status !== 'BROUILLON') {
    throw createError({ statusCode: 409, statusMessage: 'Le document signé ne peut être modifié après validation.' })
  }
  if (body.kind === 'justification' && recognition.status !== 'VALIDEE') {
    throw createError({ statusCode: 409, statusMessage: 'Justifiez la dette après sa validation et une seule fois.' })
  }

  const storageDir = path.resolve(process.cwd(), 'storage', 'debt-recognitions')
  const safeReference = recognition.reference.replace(/[^a-zA-Z0-9_-]/g, '_')
  const savedDocument = await savePrivateDocument(
    body.base64,
    body.filename,
    storageDir,
    `debt_${safeReference}_${body.kind}`
  )

  const previousReference = body.kind === 'signed'
    ? recognition.signedDocumentRef
    : recognition.justificationRef
  if (body.kind === 'signed') {
    recognition.signedDocumentRef = `private:${savedDocument.storedFilename}`
    recognition.signedDocumentFilename = savedDocument.originalFilename
  } else {
    recognition.justificationRef = `private:${savedDocument.storedFilename}`
    recognition.justificationFilename = savedDocument.originalFilename
    recognition.status = 'JUSTIFIEE'
    recognition.justifiedById = user._id.toString()
    recognition.justifiedByName = user.name
    recognition.justifiedAt = new Date()
  }

  try {
    await recognition.save()
  } catch (error) {
    await fs.unlink(savedDocument.filePath)
    throw error
  }

  await logAudit(event, {
    action: body.kind === 'signed' ? 'UPLOAD_SIGNED_DEBT_RECOGNITION' : 'JUSTIFY_DEBT_RECOGNITION',
    entity: 'DebtRecognition',
    entityId: recognition._id.toString(),
    before: body.kind === 'signed' ? { document: previousReference ? 'present' : 'absent' } : undefined,
    after: {
      reference: recognition.reference,
      filename: savedDocument.originalFilename,
      ...(body.kind === 'justification' ? { justifiedBy: user.name } : {})
    }
  })

  return { success: true, kind: body.kind, filename: savedDocument.originalFilename }
})
