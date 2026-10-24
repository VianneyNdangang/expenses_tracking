import { DebtRecognition } from '../../../models/DebtRecognition'
import { generateDebtRecognitionPdf } from '../../../utils/debtRecognitionPdf'
import { requireRole } from '../../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'SECRETAIRE')

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })

  const recognition = await DebtRecognition.findById(id)
  if (!recognition) throw createError({ statusCode: 404, statusMessage: 'Reconnaissance de dette introuvable.' })

  const pdf = await generateDebtRecognitionPdf(recognition)
  const filename = `Reconnaissance_Dette_${recognition.reference.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `${getQuery(event).inline === '1' ? 'inline' : 'attachment'}; filename="${filename}"`)
  setHeader(event, 'Content-Length', pdf.length)
  setHeader(event, 'Cache-Control', 'private, no-store')
  return pdf
})
