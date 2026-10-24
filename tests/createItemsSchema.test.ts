import { describe, expect, it } from 'vitest'
import { CreateItemsSchema, UpdateCredentialsSchema } from '../shared/schemas'

const validItem = (name: string) => ({
  name,
  unit: 'Sac',
  referencePrice: 5000,
  tolerancePercent: 10,
  notes: ''
})

describe('Validation de la création multiple d’articles', () => {
  it('accepte plusieurs articles valides', () => {
    const result = CreateItemsSchema.safeParse([
      validItem('Ciment'),
      validItem('Sable')
    ])

    expect(result.success).toBe(true)
  })

  it('refuse les noms d’articles répétés sans tenir compte de la casse', () => {
    const result = CreateItemsSchema.safeParse([
      validItem('Ciment'),
      validItem('ciment')
    ])

    expect(result.success).toBe(false)
  })

  it('limite le nombre d’articles soumis à 100', () => {
    const result = CreateItemsSchema.safeParse(
      Array.from({ length: 101 }, (_, index) => validItem(`Article ${index}`))
    )

    expect(result.success).toBe(false)
  })
})

describe('Validation de la modification des identifiants', () => {
  it('accepte une modification d’identifiant avec le mot de passe actuel', () => {
    const result = UpdateCredentialsSchema.safeParse({
      currentPassword: 'motdepasseactuel',
      username: 'nouvel-identifiant'
    })

    expect(result.success).toBe(true)
  })

  it('n’accepte pas une modification du rôle dans les données de profil', () => {
    const result = UpdateCredentialsSchema.safeParse({
      currentPassword: 'motdepasseactuel',
      username: 'nouvel-identifiant',
      role: 'TECHNICIEN'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('role')
    }
  })

  it('exige un identifiant ou un nouveau mot de passe à modifier', () => {
    const result = UpdateCredentialsSchema.safeParse({
      currentPassword: 'motdepasseactuel'
    })

    expect(result.success).toBe(false)
  })
})
