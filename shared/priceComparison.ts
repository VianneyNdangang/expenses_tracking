import type { LineStatus } from './schemas'

export interface PriceComparisonResult {
  referencePrice: number
  declaredPrice: number
  tolerancePercent: number
  suspectThresholdPercent: number
  differenceValue: number
  differencePercent: number
  status: LineStatus
  label: string
  badgeColor: 'success' | 'warning' | 'error'
}

/**
 * Calcule l'écart et le statut d'un prix déclaré par rapport au prix de référence
 */
export function evaluatePriceDifference(
  declaredPrice: number,
  referencePrice: number,
  tolerancePercent: number = 10,
  suspectThresholdPercent?: number
): PriceComparisonResult {
  const suspectThreshold = suspectThresholdPercent ?? tolerancePercent * 2
  const diffVal = Math.round(declaredPrice - referencePrice)
  
  let diffPct = 0
  if (referencePrice > 0) {
    diffPct = Math.round(((declaredPrice - referencePrice) / referencePrice) * 1000) / 10
  }

  let status: LineStatus = 'conforme'
  let label = 'Conforme'
  let badgeColor: 'success' | 'warning' | 'error' = 'success'

  if (diffVal <= 0) {
    status = 'conforme'
    label = diffVal < 0 ? 'Avantageux' : 'Conforme'
    badgeColor = 'success'
  } else if (diffPct <= tolerancePercent) {
    status = 'conforme'
    label = 'Toléré'
    badgeColor = 'success'
  } else if (diffPct <= suspectThreshold) {
    status = 'a_verifier'
    label = 'À vérifier'
    badgeColor = 'warning'
  } else {
    status = 'suspect'
    label = 'Suspect (Élevé)'
    badgeColor = 'error'
  }

  return {
    referencePrice,
    declaredPrice,
    tolerancePercent,
    suspectThresholdPercent: suspectThreshold,
    differenceValue: diffVal,
    differencePercent: diffPct,
    status,
    label,
    badgeColor
  }
}
