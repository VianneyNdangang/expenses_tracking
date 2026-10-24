import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'

export interface ILetterTemplate extends SqlDocument {
  version: number
  content: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export const LetterTemplate = defineSqlModel<ILetterTemplate>('LetterTemplate', {
  version: { type: sqlTypes.INTEGER, allowNull: false, unique: true },
  content: { type: sqlTypes.TEXT('long'), allowNull: false },
  isActive: { type: sqlTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: 'letter_templates', indexes: [{ fields: ['version'], unique: true }] })

export const DEFAULT_LETTER_TEMPLATE = `Je soussigné {accord_soussigne} {nom_employe}, titulaire de la CNI n° {cni_employe}, joignable au {telephone_employe}, reconnais avoir reçu la somme de {montant_chiffres} FCFA ({montant_lettres}) de {titre_patron} {nom_patron}, pour le motif suivant : {motif}.

Je m'engage formellement et sur l'honneur à :
1. Affecter l'intégralité de cette somme exclusivement à l'acquisition des fournitures et prestations énumérées dans le tableau ci-après.
2. Fournir l'ensemble des factures régulières et reçus justificatifs de paiement dans un délai maximal de {delai_jours} jours calendaires à compter de la date de remise des fonds.
3. Restituer immédiatement et sans délai au patron tout reliquat non dépensé.
4. Assumer l'entière responsabilité civile, matérielle et pénale en cas de détournement, perte, utilisation non conforme ou non-justification de cette somme.`
