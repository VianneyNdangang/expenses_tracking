import { Commitment } from '../../models/Commitment'
import { Payment } from '../../models/Payment'
import { Justification } from '../../models/Justification'
import { LetterTemplate, DEFAULT_LETTER_TEMPLATE } from '../../models/LetterTemplate'
import { getOrCreateSettings } from '../../models/Settings'
import { amountInWordsFCFA, formatFCFA } from '../../../shared/currency'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const commitment = await Commitment.findById(id).lean()

  if (!commitment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Engagement introuvable'
    })
  }

  // Paiement rattaché
  const payment = await Payment.findOne({ commitmentId: commitment._id }).lean()

  // Justification rattachée
  const justification = await Justification.findOne({ commitmentId: commitment._id }).lean()

  // Paramètres patron
  const settings = await getOrCreateSettings()

  // Modèle de lettre correspondant à la version
  let template = await LetterTemplate.findOne({ version: commitment.templateVersion }).lean()
  if (!template) {
    template = { content: DEFAULT_LETTER_TEMPLATE } as any
  }

  const effectiveAmount = commitment.amountApproved > 0 ? commitment.amountApproved : commitment.amountRequested
  const amountInWords = amountInWordsFCFA(effectiveAmount)

  // Remplacement des variables pour la prévisualisation et l'impression de la lettre
  const formattedDate = new Date(commitment.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const accordSoussigne = commitment.workerSnapshot.civility === 'Mme' || commitment.workerSnapshot.civility === 'Mlle' ? 'soussignée' : 'soussigné'

  let generatedLetterText = template?.content || DEFAULT_LETTER_TEMPLATE
  generatedLetterText = generatedLetterText
    .replace(/{accord_soussigne}/g, accordSoussigne)
    .replace(/{nom_employe}/g, `${commitment.workerSnapshot.civility} ${commitment.workerSnapshot.fullName}`)
    .replace(/{cni_employe}/g, commitment.workerSnapshot.cniMasked)
    .replace(/{telephone_employe}/g, commitment.workerSnapshot.phoneMasked)
    .replace(/{montant_chiffres}/g, formatFCFA(effectiveAmount).replace(' FCFA', ''))
    .replace(/{montant_lettres}/g, amountInWords)
    .replace(/{titre_patron}/g, settings.patronCivility)
    .replace(/{nom_patron}/g, settings.patronName)
    .replace(/{motif}/g, commitment.purpose)
    .replace(/{delai_jours}/g, String(settings.justificationDelayDays || 7))
    .replace(/{ville}/g, commitment.city)
    .replace(/{date}/g, formattedDate)

  return {
    ...commitment,
    id: commitment._id,
    type: commitment.type || 'MATERIEL',
    amountInWords,
    formattedAmountRequested: formatFCFA(commitment.amountRequested),
    formattedAmountApproved: formatFCFA(commitment.amountApproved),
    formattedEffectiveAmount: formatFCFA(effectiveAmount),
    generatedLetterText,
    payment: payment
      ? {
          ...payment,
          id: payment._id,
          formattedAmount: formatFCFA(payment.amount)
        }
      : null,
    justification: justification
      ? {
          ...justification,
          id: justification._id,
          formattedAmountSpent: formatFCFA(justification.amountSpent),
          formattedBalance: formatFCFA(justification.balance)
        }
      : null,
    settings: {
      patronCivility: settings.patronCivility,
      patronName: settings.patronName,
      patronPhone: settings.patronPhone,
      patronAddress: settings.patronAddress,
      justificationDelayDays: settings.justificationDelayDays
    }
  }
})
