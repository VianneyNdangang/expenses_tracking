import { describe, it, expect } from 'vitest'
import { evaluatePriceDifference } from '../shared/priceComparison'

describe('Comparaison des prix et détection des écarts', () => {
  it('considère un prix inférieur ou égal au prix de référence comme conforme', () => {
    const cheaper = evaluatePriceDifference(9000, 10000, 10, 20)
    expect(cheaper.status).toBe('conforme')
    expect(cheaper.differenceValue).toBe(-1000)
    expect(cheaper.differencePercent).toBe(-10)

    const equal = evaluatePriceDifference(10000, 10000, 10, 20)
    expect(equal.status).toBe('conforme')
    expect(equal.differenceValue).toBe(0)
    expect(equal.differencePercent).toBe(0)
  })

  it('considère un dépassement dans la tolérance comme conforme / toléré', () => {
    // 10 500 pour 10 000 avec tolérance 10% (+5%)
    const withinTolerance = evaluatePriceDifference(10500, 10000, 10, 20)
    expect(withinTolerance.status).toBe('conforme')
    expect(withinTolerance.differencePercent).toBe(5)
  })

  it('marque un écart entre tolérance et seuil suspect comme à vérifier', () => {
    // 11 500 pour 10 000 avec tolérance 10% et suspect 20% (+15%)
    const toCheck = evaluatePriceDifference(11500, 10000, 10, 20)
    expect(toCheck.status).toBe('a_verifier')
    expect(toCheck.badgeColor).toBe('warning')
    expect(toCheck.differencePercent).toBe(15)
  })

  it('marque un écart au-delà du seuil suspect comme suspect', () => {
    // 13 000 pour 10 000 avec tolérance 10% et suspect 20% (+30%)
    const suspect = evaluatePriceDifference(13000, 10000, 10, 20)
    expect(suspect.status).toBe('suspect')
    expect(suspect.badgeColor).toBe('error')
    expect(suspect.differencePercent).toBe(30)
  })
})
