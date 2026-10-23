import { describe, it, expect } from 'vitest'
import { CreateCommitmentSchema, validateForm } from '../shared/schemas'
import { generateCommitmentPdf } from '../server/utils/pdfGenerator'

describe('Diversification des types d’engagement & Lisibilité de la lettre', () => {
  it('1. Valide un engagement de type MATERIEL uniquement s’il contient des articles', () => {
    // Échec sans articles
    const invalidRes = validateForm(CreateCommitmentSchema, {
      type: 'MATERIEL',
      workerId: '650000000000000000000001',
      purpose: 'Achat de ciment',
      city: 'Yaoundé',
      lines: []
    })
    expect(invalidRes.success).toBe(false)
    expect(invalidRes.firstError).toContain('article')

    // Succès avec articles
    const validRes = validateForm(CreateCommitmentSchema, {
      type: 'MATERIEL',
      workerId: '650000000000000000000001',
      purpose: 'Achat de fer et ciment',
      city: 'Yaoundé',
      lines: [
        {
          itemId: '650000000000000000000002',
          name: 'Fer 10',
          unit: 'Barre',
          quantity: 5,
          unitPriceDeclared: 4500
        }
      ]
    })
    expect(validRes.success).toBe(true)
    expect(validRes.data?.type).toBe('MATERIEL')
  })

  it('2. Valide un engagement de type PRET avec montant direct sans articles', () => {
    const res = validateForm(CreateCommitmentSchema, {
      type: 'PRET',
      workerId: '650000000000000000000001',
      purpose: 'Avance remboursable pour frais médicaux',
      city: 'Douala',
      amount: 150000,
      lines: []
    })
    expect(res.success).toBe(true)
    expect(res.data?.type).toBe('PRET')
    expect(res.data?.amount).toBe(150000)
    expect(res.data?.lines).toHaveLength(0)
  })

  it('3. Valide un engagement de type SALAIRE avec montant direct', () => {
    const res = validateForm(CreateCommitmentSchema, {
      type: 'SALAIRE',
      workerId: '650000000000000000000001',
      purpose: 'Paiement salaire quinzaine d’octobre',
      city: 'Bafoussam',
      amount: 200000
    })
    expect(res.success).toBe(true)
    expect(res.data?.type).toBe('SALAIRE')
    expect(res.data?.amount).toBe(200000)
  })

  it('4. Rejette un PRET ou SALAIRE si ni montant ni articles ne sont fournis', () => {
    const res = validateForm(CreateCommitmentSchema, {
      type: 'PRET',
      workerId: '650000000000000000000001',
      purpose: 'Prêt sans montant',
      city: 'Yaoundé',
      amount: 0,
      lines: []
    })
    expect(res.success).toBe(false)
  })

  it('5. Génère un PDF valide et justifié pour un engagement de type PRET sans articles', async () => {
    const pdfBuffer = await generateCommitmentPdf({
      type: 'PRET',
      letterNumber: 'ENG-2026-0099',
      date: new Date('2026-10-23'),
      city: 'Yaoundé',
      templateVersion: 1,
      purpose: 'Avance remboursable pour urgence familiale',
      amountRequested: 100000,
      amountApproved: 100000,
      workerSnapshot: {
        civility: 'M.',
        fullName: 'Jean Dupont',
        cniMasked: '1234 •••• 5678',
        phoneMasked: '699 ••• 123'
      },
      items: [],
      witnesses: [
        {
          civility: 'M.',
          fullName: 'Paul Martin',
          cniMasked: '9876 •••• 4321'
        }
      ],
      settings: {
        patronCivility: 'M.',
        patronName: 'El Hadj Abdouraman',
        patronAddress: 'Quartier Briqueterie, Yaoundé',
        patronPhone: '+237 677 00 00 00',
        justificationDelayDays: 7
      }
    })

    expect(pdfBuffer).toBeInstanceOf(Buffer)
    expect(pdfBuffer.length).toBeGreaterThan(1000)
    // En-tête standard PDF : %PDF-
    expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-')
  })

  it('6. Génère un PDF valide pour un engagement de type SALAIRE', async () => {
    const pdfBuffer = await generateCommitmentPdf({
      type: 'SALAIRE',
      letterNumber: 'ENG-2026-0100',
      date: new Date('2026-10-23'),
      city: 'Douala',
      templateVersion: 1,
      purpose: 'Règlement solde de tout compte et salaire du mois',
      amountRequested: 250000,
      amountApproved: 250000,
      workerSnapshot: {
        civility: 'Mme',
        fullName: 'Marie Claire',
        cniMasked: '5555 •••• 9999',
        phoneMasked: '670 ••• 888'
      },
      settings: {
        patronCivility: 'M.',
        patronName: 'El Hadj Abdouraman',
        patronAddress: 'Yaoundé',
        patronPhone: '+237 677 00 00 00',
        justificationDelayDays: 7
      }
    })

    expect(pdfBuffer).toBeInstanceOf(Buffer)
    expect(pdfBuffer.length).toBeGreaterThan(1000)
  })
})
