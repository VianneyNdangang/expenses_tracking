import { DebtRecognition } from '../../models/DebtRecognition'
import { serializeDebtRecognition } from '../../utils/debtRecognition'
import { requireRole } from '../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'SECRETAIRE')

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })

  const recognition = await DebtRecognition.findById(id)
  if (!recognition) throw createError({ statusCode: 404, statusMessage: 'Reconnaissance de dette introuvable.' })

  return serializeDebtRecognition(recognition)
})
