import { z } from 'zod'

// --- Enums partagés ---
export const CivilityEnum = z.enum(['M.', 'Mme', 'Mlle'])
export type Civility = z.infer<typeof CivilityEnum>

export const CommitmentStatusEnum = z.enum(['Demandé', 'Accepté', 'Payé', 'Justifié', 'Refusé'])
export type CommitmentStatus = z.infer<typeof CommitmentStatusEnum>

export const LineStatusEnum = z.enum(['conforme', 'a_verifier', 'suspect'])
export type LineStatus = z.infer<typeof LineStatusEnum>

export const PaymentMethodEnum = z.enum(['Espèces', 'Virement', 'Chèque', 'Mobile Money', 'Autre'])
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>

// --- Authentification ---
export const LoginSchema = z.object({
  username: z.string().min(3, 'Identifiant requis (min 3 caractères)').trim(),
  password: z.string().min(6, 'Mot de passe requis (min 6 caractères)'),
  totpCode: z.string().optional()
})
export type LoginInput = z.infer<typeof LoginSchema>

// --- Rôles et Utilisateurs ---
export const UserRoleEnum = z.enum(['PATRON', 'SECRETAIRE', 'TECHNICIEN'])
export type UserRole = z.infer<typeof UserRoleEnum>

export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'PATRON', label: 'Patron', description: 'Direction générale : accès complet, validation financière, paramètres et gestion des utilisateurs.' },
  { value: 'SECRETAIRE', label: 'Secrétaire', description: 'Gestion administrative : saisie des engagements, suivi des factures, gestion des employés et témoins.' },
  { value: 'TECHNICIEN', label: 'Technicien', description: 'Contrôle technique : gestion des articles, prix du marché et suivi technique des matériaux.' }
]

export const CreateUserSchema = z.object({
  username: z.string().min(3, "L'identifiant doit comporter au moins 3 caractères").trim().toLowerCase(),
  name: z.string().min(2, 'Le nom complet est requis (min 2 caractères)').trim(),
  role: UserRoleEnum,
  password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères')
})
export type CreateUserInput = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z.object({
  name: z.string().min(2, 'Le nom complet est requis (min 2 caractères)').trim().optional(),
  role: UserRoleEnum.optional(),
  password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères').optional()
})
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit comporter au moins 8 caractères')
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>

// --- Articles (Items) ---
export const ItemSchema = z.object({
  name: z.string().min(2, "Le nom de l'article est requis (min 2 caractères)").trim(),
  unit: z.string().min(1, "L'unité est requise (ex: Unité, Sac, Kg, Litre)").trim(),
  notes: z.string().optional().default('')
})
export type ItemInput = z.infer<typeof ItemSchema>

export const CreateItemSchema = z.object({
  name: z.string().min(2, "Le nom de l'article est requis (min 2 caractères)").trim(),
  unit: z.string().min(1, "L'unité est requise (ex: Unité, Sac, Barre, Camion)").trim(),
  referencePrice: z.number().int('Le prix doit être un entier').positive('Le prix de référence doit être un entier positif en FCFA'),
  tolerancePercent: z.number().min(0, 'La tolérance minimum est 0%').max(100, 'La tolérance maximum est 100%').default(10),
  notes: z.string().optional().default('')
})
export type CreateItemInput = z.infer<typeof CreateItemSchema>

// --- Prix d'article ---
export const NewPriceSchema = z.object({
  referencePrice: z.number().int('Le prix doit être un entier').positive('Le prix de référence doit être supérieur à zéro'),
  tolerancePercent: z.number().min(0, 'La tolérance minimum est 0%').max(100, 'La tolérance maximum est 100%').default(10),
  notes: z.string().optional().default('')
})
export type NewPriceInput = z.infer<typeof NewPriceSchema>

export const ItemPriceSchema = z.object({
  itemId: z.string().min(1, 'Article requis'),
  referencePrice: z.number().int().positive('Le prix de référence doit être un entier positif en FCFA'),
  tolerancePercent: z.number().min(0).max(100).default(10),
  notes: z.string().optional().default('')
})
export type ItemPriceInput = z.infer<typeof ItemPriceSchema>

// --- Employés et Témoins ---
export const PersonSchema = z.object({
  civility: CivilityEnum,
  fullName: z.string().min(2, 'Nom complet requis').trim(),
  cni: z.string().min(5, 'Numéro de CNI requis').trim(),
  phone: z.string().min(6, 'Numéro de téléphone requis').trim()
})
export type PersonInput = z.infer<typeof PersonSchema>

export const CommitmentTypeEnum = z.enum(['MATERIEL', 'PRET', 'SALAIRE', 'AUTRE'])
export type CommitmentType = z.infer<typeof CommitmentTypeEnum>

// --- Lignes d'engagement ---
export const CommitmentLineSchema = z.object({
  itemId: z.string().min(1, 'Article requis'),
  name: z.string().min(1, "Nom de l'article"),
  unit: z.string().min(1, 'Unité'),
  quantity: z.number().positive('La quantité doit être supérieure à zéro'),
  unitPriceDeclared: z.number().int().nonnegative('Le prix unitaire déclaré doit être un entier FCFA positif')
})
export type CommitmentLineInput = z.infer<typeof CommitmentLineSchema>

// --- Création d'engagement ---
export const CreateCommitmentSchema = z.object({
  type: CommitmentTypeEnum.optional().default('MATERIEL'),
  workerId: z.string().min(1, 'Employé requis'),
  purpose: z.string().min(3, 'Le motif est requis').trim(),
  city: z.string().min(2, 'La ville est requise').trim(),
  date: z.string().or(z.date()).optional(),
  witnessIds: z.array(z.string()).max(2, 'Maximum 2 témoins').default([]),
  templateVersion: z.number().int().positive().optional(),
  amount: z.number().int('Le montant doit être un entier').positive('Le montant doit être un entier positif en FCFA').optional(),
  lines: z.array(CommitmentLineSchema).optional().default([]),
  notes: z.string().optional().default('')
}).superRefine((data, ctx) => {
  if (data.type === 'MATERIEL') {
    if (!data.lines || data.lines.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lines'],
        message: 'Au moins un article doit être saisi pour un achat de matériel'
      })
    }
  } else {
    const hasAmount = typeof data.amount === 'number' && data.amount > 0
    const hasLines = Array.isArray(data.lines) && data.lines.length > 0
    if (!hasAmount && !hasLines) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: 'Veuillez saisir un montant supérieur à zéro ou des articles'
      })
    }
  }
})
export type CreateCommitmentInput = z.infer<typeof CreateCommitmentSchema>

// --- Décision Patron (Acceptation / Refus) ---
export const ApproveCommitmentSchema = z.object({
  approved: z.boolean(),
  amountApproved: z.number().int().nonnegative('Montant accordé invalide').optional(),
  refusalReason: z.string().optional()
})
export type ApproveCommitmentInput = z.infer<typeof ApproveCommitmentSchema>

// --- Enregistrement du Paiement ---
export const CreatePaymentSchema = z.object({
  commitmentId: z.string().min(1, 'Engagement requis'),
  amount: z.number().int().positive('Le montant payé doit être un entier supérieur à zéro'),
  date: z.string().or(z.date()).optional(),
  method: PaymentMethodEnum,
  reference: z.string().optional().default(''),
  notes: z.string().optional().default('')
})
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>

// --- Enregistrement de la Justification ---
export const CreateJustificationSchema = z.object({
  commitmentId: z.string().min(1, 'Engagement requis'),
  amountSpent: z.number().int().nonnegative('Le montant dépensé doit être un entier FCFA positif'),
  notes: z.string().optional().default(''),
  date: z.string().or(z.date()).optional()
})
export type CreateJustificationInput = z.infer<typeof CreateJustificationSchema>

// --- Paramètres Généraux ---
export const SettingsSchema = z.object({
  patronCivility: CivilityEnum,
  patronName: z.string().min(2, 'Nom du patron requis').trim(),
  patronPhone: z.string().min(6, 'Téléphone du patron requis').trim(),
  patronAddress: z.string().min(2, 'Adresse du patron requise').trim(),
  defaultCity: z.string().min(2, 'Ville par défaut requise').trim(),
  justificationDelayDays: z.number().int().min(1, 'Le délai doit être d’au moins 1 jour').default(7),
  toleranceThreshold: z.number().min(0).max(100).default(10),
  suspectThreshold: z.number().min(0).max(200).default(20)
})
export type SettingsInput = z.infer<typeof SettingsSchema>

// --- Modèle de Lettre ---
export const LetterTemplateSchema = z.object({
  content: z.string({ required_error: 'Le contenu du modèle de lettre est trop court' }).min(50, 'Le contenu du modèle de lettre est trop court'),
  password: z.string({ required_error: 'Le mot de passe du patron est requis pour confirmer la création' }).min(1, 'Le mot de passe du patron est requis pour confirmer la création')
})
export type LetterTemplateInput = z.infer<typeof LetterTemplateSchema>

export const ActivateTemplateSchema = z.object({
  version: z.number().int().positive('Numéro de version invalide')
})
export type ActivateTemplateInput = z.infer<typeof ActivateTemplateSchema>

// --- Annulation d'engagement ---
export const CancelCommitmentSchema = z.object({
  reason: z.string().min(5, "Le motif d'annulation doit comporter au moins 5 caractères").trim()
})
export type CancelCommitmentInput = z.infer<typeof CancelCommitmentSchema>

// --- Helper universel de validation de formulaire ---
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: Record<string, string>
  firstError: string
}

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: {},
      firstError: ''
    }
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }

  return {
    success: false,
    errors,
    firstError: result.error.issues[0]?.message || 'Données du formulaire non valides'
  }
}

