import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILetterTemplate extends Document {
  version: number
  content: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const LetterTemplateSchema = new Schema<ILetterTemplate>(
  {
    version: { type: Number, required: true, unique: true },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

export const LetterTemplate: Model<ILetterTemplate> = mongoose.models.LetterTemplate || mongoose.model<ILetterTemplate>('LetterTemplate', LetterTemplateSchema)

/**
 * Texte par défaut pour la version 1 du modèle de lettre d'engagement
 */
export const DEFAULT_LETTER_TEMPLATE = `Je soussigné {accord_soussigne} {nom_employe}, titulaire de la CNI n° {cni_employe}, joignable au {telephone_employe}, reconnais avoir reçu la somme de {montant_chiffres} FCFA ({montant_lettres}) de {titre_patron} {nom_patron}, pour le motif suivant : {motif}.

Je m'engage formellement et sur l'honneur à :
1. Affecter l'intégralité de cette somme exclusivement à l'acquisition des fournitures et prestations énumérées dans le tableau ci-après.
2. Fournir l'ensemble des factures régulières et reçus justificatifs de paiement dans un délai maximal de {delai_jours} jours calendaires à compter de la date de remise des fonds.
3. Restituer immédiatement et sans délai au patron tout reliquat non dépensé.
4. Assumer l'entière responsabilité civile, matérielle et pénale en cas de détournement, perte, utilisation non conforme ou non-justification de cette somme.`;
