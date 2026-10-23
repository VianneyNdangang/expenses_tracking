import { Commitment } from '../../../models/Commitment'
import { getOrCreateSettings } from '../../../models/Settings'
import { validateSession } from '../../../utils/session'
import { generateCommitmentPdf } from '../../../utils/pdfGenerator'

export default defineEventHandler(async (event) => {
  // 1. Validation de l'authentification
  const session = await validateSession(event)
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session expirée ou non authentifiée'
    })
  }

  // 2. Récupération de l'engagement
  const id = getRouterParam(event, 'id')
  const commitment = await Commitment.findById(id).lean()

  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  // 3. Récupération des paramètres de la direction
  const settings = await getOrCreateSettings()

  // 4. Génération du buffer PDF
  const pdfBuffer = await generateCommitmentPdf({
    type: commitment.type || 'MATERIEL',
    letterNumber: commitment.letterNumber,
    date: commitment.date,
    city: commitment.city,
    templateVersion: commitment.templateVersion,
    purpose: commitment.purpose,
    amountRequested: commitment.amountRequested,
    amountApproved: commitment.amountApproved,
    workerSnapshot: commitment.workerSnapshot,
    items: commitment.items,
    witnesses: commitment.witnesses,
    settings: {
      patronCivility: settings.patronCivility,
      patronName: settings.patronName,
      patronAddress: settings.patronAddress,
      patronPhone: settings.patronPhone,
      justificationDelayDays: settings.justificationDelayDays || 7
    }
  })

  // 5. En-têtes pour téléchargement direct du fichier
  const sanitizedLetterNumber = (commitment.letterNumber || 'ENG')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `Lettre_Engagement_${sanitizedLetterNumber}.pdf`

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'Content-Length', pdfBuffer.length)

  return pdfBuffer
})
