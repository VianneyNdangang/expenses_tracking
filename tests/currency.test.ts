import { describe, it, expect } from 'vitest'
import { amountInWordsFCFA, formatFCFA, integerToFrenchWords } from '../shared/currency'

describe('Conversion des nombres en lettres et formatage FCFA', () => {
  it('formate correctement les montants avec séparateur de milliers', () => {
    expect(formatFCFA(0)).toBe('0 FCFA')
    expect(formatFCFA(1000)).toBe('1 000 FCFA')
    expect(formatFCFA(2000000)).toBe('2 000 000 FCFA')
    expect(formatFCFA(15450250)).toBe('15 450 250 FCFA')
  })

  it('convertit les entiers en français de base', () => {
    expect(integerToFrenchWords(0)).toBe('zéro')
    expect(integerToFrenchWords(1)).toBe('un')
    expect(integerToFrenchWords(21)).toBe('vingt-et-un')
    expect(integerToFrenchWords(71)).toBe('soixante-et-onze')
    expect(integerToFrenchWords(80)).toBe('quatre-vingts')
    expect(integerToFrenchWords(81)).toBe('quatre-vingt-un')
    expect(integerToFrenchWords(100)).toBe('cent')
    expect(integerToFrenchWords(200)).toBe('deux cents')
    expect(integerToFrenchWords(205)).toBe('deux cent cinq')
    expect(integerToFrenchWords(1000)).toBe('mille')
    expect(integerToFrenchWords(2000)).toBe('deux mille')
    expect(integerToFrenchWords(1000000)).toBe('un million')
    expect(integerToFrenchWords(2000000)).toBe('deux millions')
  })

  it('convertit les montants en phrases officielles FCFA', () => {
    expect(amountInWordsFCFA(0)).toBe('Zéro franc CFA')
    expect(amountInWordsFCFA(1)).toBe('Un franc CFA')
    expect(amountInWordsFCFA(2000000)).toBe('Deux millions de francs CFA')
    expect(amountInWordsFCFA(350000)).toBe('Trois cent cinquante mille francs CFA')
    expect(amountInWordsFCFA(1500000)).toBe('Un million cinq cent mille francs CFA')
  })
})
