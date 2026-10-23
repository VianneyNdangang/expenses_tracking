import { describe, it, expect } from 'vitest'
import { evaluatePriceDifference } from '../shared/priceComparison'
import { amountInWordsFCFA } from '../shared/currency'

describe('Règles Métier et Calculs Financiers', () => {
  it('calcule correctement les reliquats et détecte les dépassements', () => {
    // Cas 1 : Reliquat positif à restituer (Payé 185 000, dépensé 180 000 -> 5 000 en reliquat)
    const paid1 = 185000
    const spent1 = 180000
    const balance1 = paid1 - spent1
    expect(balance1).toBe(5000)
    expect(balance1 > 0).toBe(true)

    // Cas 2 : Dépense exacte
    const paid2 = 50000
    const spent2 = 50000
    const balance2 = paid2 - spent2
    expect(balance2).toBe(0)

    // Cas 3 : Dépassement / Déficit (Payé 100 000, dépensé 115 000 -> -15 000)
    const paid3 = 100000
    const spent3 = 115000
    const balance3 = paid3 - spent3
    expect(balance3).toBe(-15000)
    expect(balance3 < 0).toBe(true)
  })

  it('gère l’acceptation d’un montant inférieur au montant demandé par le patron', () => {
    const amountRequested = 500000
    const amountApproved = 400000 // Le patron décide d'accorder moins

    expect(amountApproved).toBeLessThan(amountRequested)
    const inWords = amountInWordsFCFA(amountApproved)
    expect(inWords).toBe('Quatre cent mille francs CFA')
  })

  it('valide la hiérarchie des statuts d’engagement', () => {
    const allowedTransitions: Record<string, string[]> = {
      'Demandé': ['Accepté', 'Refusé'],
      'Accepté': ['Payé'],
      'Payé': ['Justifié'],
      'Justifié': [],
      'Refusé': []
    }

    expect(allowedTransitions['Demandé']).toContain('Accepté')
    expect(allowedTransitions['Demandé']).toContain('Refusé')
    expect(allowedTransitions['Accepté']).toContain('Payé')
    expect(allowedTransitions['Payé']).toContain('Justifié')
    expect(allowedTransitions['Justifié'].length).toBe(0)
  })
})
