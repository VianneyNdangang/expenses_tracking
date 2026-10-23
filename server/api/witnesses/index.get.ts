import { Witness } from '../../models/Witness'
import { decryptField, maskSensitive } from '../../utils/crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const includeArchived = query.includeArchived === 'true'

  const filter: any = {}
  if (!includeArchived) {
    filter.isArchived = false
  }

  const witnesses = await Witness.find(filter).sort({ fullName: 1 })

  return witnesses.map((w) => {
    const rawCni = decryptField(w.cniEncrypted)
    const rawPhone = decryptField(w.phoneEncrypted)

    return {
      id: w._id,
      civility: w.civility,
      fullName: w.fullName,
      cniMasked: maskSensitive(rawCni),
      phoneMasked: maskSensitive(rawPhone),
      isArchived: w.isArchived,
      createdAt: w.createdAt
    }
  })
})
