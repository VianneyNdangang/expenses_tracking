import { Item } from '../../../models/Item'
import { ItemPrice } from '../../../models/ItemPrice'
import { withTransaction } from '../../../utils/db'
import { logAudit } from '../../../utils/audit'
import { NewPriceSchema } from '../../../../shared/schemas'
import { requireRole } from '../../../utils/roles'

export default defineEventHandler(async (event) => {
  requireRole(event, 'PATRON', 'TECHNICIEN')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const validation = NewPriceSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const item = await Item.findById(id)
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article introuvable'
    })
  }

  const { referencePrice, tolerancePercent, notes } = validation.data
  const now = new Date()

  const newPriceDoc = await withTransaction(async (session) => {
    // Clôturer l'ancien prix actif
    await ItemPrice.updateMany(
      { itemId: item._id, endDate: null },
      { $set: { endDate: now } },
      { transaction: session }
    )

    // Créer le nouveau prix actif
    return ItemPrice.create({
      itemId: item._id,
      referencePrice,
      tolerancePercent,
      startDate: now,
      endDate: null,
      notes: notes || 'Mise à jour du prix de référence'
    }, { transaction: session })
  })

  await logAudit(event, {
    action: 'UPDATE_ITEM_PRICE',
    entity: 'ItemPrice',
    entityId: newPriceDoc._id.toString(),
    after: { itemId: item._id, referencePrice, tolerancePercent }
  })

  return {
    success: true,
    price: newPriceDoc
  }
})
