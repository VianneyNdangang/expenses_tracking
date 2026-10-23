import { CreateCommitmentSchema } from '../../../shared/schemas'
import { Commitment, type ICommitmentLine, type ICommitmentWitness } from '../../models/Commitment'
import { Worker } from '../../models/Worker'
import { Witness } from '../../models/Witness'
import { ItemPrice } from '../../models/ItemPrice'
import { LetterTemplate } from '../../models/LetterTemplate'
import { Settings, getOrCreateSettings } from '../../models/Settings'
import { getNextSequence } from '../../models/Counter'
import { decryptField, maskSensitive } from '../../utils/crypto'
import { evaluatePriceDifference } from '../../../shared/priceComparison'
import { withTransaction } from '../../utils/db'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = CreateCommitmentSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Données invalides'
    })
  }

  const { type = 'MATERIEL', workerId, purpose, city, date, witnessIds, templateVersion: requestedTemplateVersion, amount, lines = [], notes } = validation.data

  // 1. Récupération de l'employé
  const worker = await Worker.findById(workerId)
  if (!worker) {
    throw createError({ statusCode: 404, statusMessage: 'Employé introuvable' })
  }
  const workerCniRaw = decryptField(worker.cniEncrypted)
  const workerPhoneRaw = decryptField(worker.phoneEncrypted)

  const workerSnapshot = {
    civility: worker.civility,
    fullName: worker.fullName,
    cniMasked: maskSensitive(workerCniRaw),
    phoneMasked: maskSensitive(workerPhoneRaw)
  }

  // 2. Récupération des témoins
  const witnessesSnapshot: ICommitmentWitness[] = []
  if (witnessIds && witnessIds.length > 0) {
    const witnesses = await Witness.find({ _id: { $in: witnessIds } })
    for (const wt of witnesses) {
      const cniRaw = decryptField(wt.cniEncrypted)
      const phoneRaw = decryptField(wt.phoneEncrypted)
      witnessesSnapshot.push({
        witnessId: wt._id,
        civility: wt.civility,
        fullName: wt.fullName,
        cniMasked: maskSensitive(cniRaw),
        phoneMasked: maskSensitive(phoneRaw)
      })
    }
  }

  // 3. Récupération des paramètres et seuils
  const settings = await getOrCreateSettings()
  const toleranceDefault = settings.toleranceThreshold || 10
  const suspectThreshold = settings.suspectThreshold || 20

  // 4. Modèle de lettre (demandé ou actif)
  let templateVersion = requestedTemplateVersion
  if (!templateVersion) {
    const activeTemplate = await LetterTemplate.findOne({ isActive: true }).sort({ version: -1 })
    templateVersion = activeTemplate ? activeTemplate.version : 1
  }

  // 5. Calcul et gel des lignes d'articles ou du montant direct
  let totalRequested = 0
  const frozenLines: ICommitmentLine[] = []

  if (lines && lines.length > 0) {
    const itemIds = lines.map((l) => l.itemId)
    const activePrices = await ItemPrice.find({ itemId: { $in: itemIds }, endDate: null }).lean()
    const priceMap = new Map(activePrices.map((p) => [p.itemId.toString(), p]))

    for (const line of lines) {
      const activePrice = priceMap.get(line.itemId)
      const refPrice = activePrice ? activePrice.referencePrice : line.unitPriceDeclared
      const tolerance = activePrice ? activePrice.tolerancePercent : toleranceDefault

      const evalResult = evaluatePriceDifference(
        line.unitPriceDeclared,
        refPrice,
        tolerance,
        suspectThreshold
      )

      const lineTotal = Math.round(line.quantity * line.unitPriceDeclared)
      totalRequested += lineTotal

      frozenLines.push({
        itemId: line.itemId as any,
        name: line.name,
        unit: line.unit,
        quantity: line.quantity,
        unitPriceDeclared: line.unitPriceDeclared,
        totalPriceDeclared: lineTotal,
        referenceUnitPrice: refPrice,
        tolerancePercent: tolerance,
        differenceValue: evalResult.differenceValue,
        differencePercent: evalResult.differencePercent,
        status: evalResult.status
      })
    }
  } else {
    totalRequested = amount || 0
  }

  const commitmentDate = date ? new Date(date) : new Date()
  const currentYear = commitmentDate.getFullYear()

  // 6. Enregistrement transactionnel avec compteur séquentiel
  const createdCommitment = await withTransaction(async (session) => {
    let seq = await getNextSequence('commitment_number', session)
    let exists = await Commitment.exists({ seq }).session(session || null)
    while (exists) {
      seq = await getNextSequence('commitment_number', session)
      exists = await Commitment.exists({ seq }).session(session || null)
    }
    const letterNumber = `ENG-${currentYear}-${String(seq).padStart(4, '0')}`

    const doc = await Commitment.create(
      [
        {
          type,
          letterNumber,
          seq,
          workerId: worker._id,
          workerSnapshot,
          purpose,
          city: city || settings.defaultCity,
          date: commitmentDate,
          templateVersion,
          witnesses: witnessesSnapshot,
          items: frozenLines,
          amountRequested: totalRequested,
          amountApproved: 0,
          status: 'Demandé',
          notes: notes || '',
          isCancelled: false
        }
      ],
      { session }
    )

    return doc[0]
  })

  await logAudit(event, {
    action: 'CREATE_COMMITMENT',
    entity: 'Commitment',
    entityId: createdCommitment._id.toString(),
    after: {
      type: createdCommitment.type,
      letterNumber: createdCommitment.letterNumber,
      amountRequested: totalRequested,
      worker: workerSnapshot.fullName,
      itemsCount: frozenLines.length
    }
  })

  return {
    success: true,
    commitment: {
      id: createdCommitment._id,
      type: createdCommitment.type,
      letterNumber: createdCommitment.letterNumber,
      amountRequested: createdCommitment.amountRequested,
      status: createdCommitment.status
    }
  }
})
