import { DebtRecognition } from '../../models/DebtRecognition'
import { requireRole } from '../../utils/roles'
import { serializeDebtRecognition } from '../../utils/debtRecognition'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'SECRETAIRE')

  const recognitions = await DebtRecognition.find().sort({ recognitionDate: -1 })
  return recognitions.map(serializeDebtRecognition)
})
