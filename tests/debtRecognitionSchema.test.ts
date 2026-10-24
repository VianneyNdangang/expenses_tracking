import { describe, expect, it } from 'vitest'
import { CreateDebtRecognitionSchema } from '../shared/schemas'

const validRecognition = {
  debtorName: 'Jean Dupont',
  creditorName: 'Entreprise Abdouraman',
  amount: 250000,
  recognitionDate: '2026-10-23',
  dueDate: '2026-11-23',
  purpose: 'Remboursement d’une avance de trésorerie',
  notes: ''
}

describe('Validation des reconnaissances de dette', () => {
  it('accepte une reconnaissance valide avec échéance', () => {
    expect(CreateDebtRecognitionSchema.safeParse(validRecognition).success).toBe(true)
  })

  it('refuse une échéance antérieure à la date de reconnaissance', () => {
    const result = CreateDebtRecognitionSchema.safeParse({
      ...validRecognition,
      dueDate: '2026-10-22'
    })

    expect(result.success).toBe(false)
  })

  it('refuse une date invalide ou un montant non entier', () => {
    const result = CreateDebtRecognitionSchema.safeParse({
      ...validRecognition,
      amount: 250000.5,
      recognitionDate: '2026-02-30'
    })

    expect(result.success).toBe(false)
  })
})
