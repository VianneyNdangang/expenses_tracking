import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { Commitment } from '../../../models/Commitment'
import { logAudit } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const commitment = await Commitment.findById(id)
  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  // Accepte un fichier en base64 : { filename: string, base64: string }
  const { filename, base64 } = body || {}
  if (!base64 || !filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Fichier ou nom de fichier manquant'
    })
  }

  // Extraction du buffer depuis base64
  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
  const data = matches ? matches[2] : base64
  const buffer = Buffer.from(data, 'base64')

  // Sécurisation du dossier de stockage dans public/uploads
  const uploadDir = path.resolve(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const safeExt = path.extname(filename).toLowerCase() || '.pdf'
  const safeName = `scan_${commitment.letterNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${crypto.randomBytes(4).toString('hex')}${safeExt}`
  const filePath = path.join(uploadDir, safeName)

  fs.writeFileSync(filePath, buffer)
  const fileUrl = `/uploads/${safeName}`

  commitment.signedLetterScanUrl = fileUrl
  commitment.signedLetterScanFilename = filename
  await commitment.save()

  await logAudit(event, {
    action: 'UPLOAD_SIGNED_LETTER_SCAN',
    entity: 'Commitment',
    entityId: commitment._id.toString(),
    after: { filename, url: fileUrl }
  })

  return {
    success: true,
    url: fileUrl,
    filename
  }
})
