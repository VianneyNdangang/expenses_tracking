import { Item } from '../../models/Item'
import { ItemPrice } from '../../models/ItemPrice'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const includeArchived = query.includeArchived === 'true'

  const filter: any = {}
  if (!includeArchived) {
    filter.isArchived = false
  }

  const items = await Item.find(filter).sort({ name: 1 }).lean()

  // Récupérer le prix actif pour chaque article
  const itemIds = items.map(i => i._id)
  const activePrices = await ItemPrice.find({
    itemId: { $in: itemIds },
    endDate: null
  }).lean()

  const priceMap = new Map(activePrices.map(p => [p.itemId.toString(), p]))

  return items.map(item => {
    const price = priceMap.get(item._id.toString())
    return {
      id: item._id,
      name: item.name,
      unit: item.unit,
      notes: item.notes,
      isArchived: item.isArchived,
      referencePrice: price ? price.referencePrice : 0,
      tolerancePercent: price ? price.tolerancePercent : 10,
      priceStartDate: price ? price.startDate : null,
      createdAt: item.createdAt
    }
  })
})
