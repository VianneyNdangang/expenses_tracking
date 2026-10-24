import { describe, expect, it } from 'vitest'
import { generateDebtRecognitionPdf } from '../server/utils/debtRecognitionPdf'
import type { IDebtRecognition } from '../server/models/DebtRecognition'

const recognition: IDebtRecognition = {
  _id: 'debt-recognition-test',
  reference: 'RD-2026-00001',
  debtorName: 'Jean Dupont',
  creditorName: 'Entreprise Abdouraman',
  amount: 250000,
  recognitionDate: new Date('2026-10-23T00:00:00.000Z'),
  dueDate: new Date('2026-11-23T00:00:00.000Z'),
  purpose: 'Remboursement d’une avance de trésorerie',
  notes: '',
  status: 'BROUILLON',
  createdById: 'user-test',
  createdByName: 'Secrétaire',
  createdAt: new Date('2026-10-23T00:00:00.000Z'),
  updatedAt: new Date('2026-10-23T00:00:00.000Z')
}

describe('Génération PDF des reconnaissances de dette', () => {
  it('produit un document PDF non vide', async () => {
    const pdf = await generateDebtRecognitionPdf(recognition)

    expect(pdf.toString('utf-8', 0, 5)).toBe('%PDF-')
    expect(pdf.length).toBeGreaterThan(1000)
  })
})
