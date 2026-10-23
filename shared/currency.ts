/**
 * Utilitaires de conversion et formatage monétaire FCFA en français
 */

const UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
const PARTICULIERS = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
const DIZAINES = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']

function convertLessThanHundred(n: number): string {
  if (n < 10) return UNITES[n]
  if (n < 20) return PARTICULIERS[n - 10]

  const d = Math.floor(n / 10)
  const u = n % 10

  if (d === 7) {
    if (u === 1) return 'soixante-et-onze'
    return `soixante-${PARTICULIERS[u]}`
  }

  if (d === 8) {
    if (u === 0) return 'quatre-vingts'
    return `quatre-vingt-${UNITES[u]}`
  }

  if (d === 9) {
    return `quatre-vingt-${PARTICULIERS[u]}`
  }

  // d entre 2 et 6
  if (u === 1) {
    return `${DIZAINES[d]}-et-un`
  }
  if (u > 1) {
    return `${DIZAINES[d]}-${UNITES[u]}`
  }
  return DIZAINES[d]
}

function convertLessThanThousand(n: number, isEnd: boolean = true): string {
  if (n === 0) return ''
  const c = Math.floor(n / 100)
  const r = n % 100

  let str = ''
  if (c === 1) {
    str = 'cent'
  } else if (c > 1) {
    str = `${UNITES[c]} cent`
    if (r === 0 && isEnd) str += 's'
  }

  const restStr = convertLessThanHundred(r)
  if (restStr) {
    str = str ? `${str} ${restStr}` : restStr
  }

  return str
}

/**
 * Convertit un entier positif en toutes lettres en français
 */
export function integerToFrenchWords(n: number): string {
  if (n === 0) return 'zéro'
  if (n < 0) return `moins ${integerToFrenchWords(-n)}`

  n = Math.floor(n)

  const billions = Math.floor(n / 1_000_000_000)
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1_000)
  const units = n % 1_000

  const chunks: string[] = []

  if (billions > 0) {
    if (billions === 1) {
      chunks.push('un milliard')
    } else {
      chunks.push(`${integerToFrenchWords(billions)} milliards`)
    }
  }

  if (millions > 0) {
    const hasFollowing = thousands > 0 || units > 0
    if (millions === 1) {
      chunks.push('un million')
    } else {
      chunks.push(`${convertLessThanThousand(millions, !hasFollowing)} millions`)
    }
  }

  if (thousands > 0) {
    const hasFollowing = units > 0
    if (thousands === 1) {
      chunks.push('mille')
    } else {
      // Dans 'deux cent mille', cent est suivi de mille donc reste invariable
      chunks.push(`${convertLessThanThousand(thousands, false)} mille`)
    }
  }

  if (units > 0) {
    chunks.push(convertLessThanThousand(units, true))
  }

  return chunks.join(' ').trim()
}

/**
 * Convertit un montant FCFA en toutes lettres avec devise
 * Ex: 2000000 -> "Deux millions de francs CFA"
 * Ex: 1 -> "Un franc CFA"
 * Ex: 350000 -> "Trois cent cinquante mille francs CFA"
 */
export function amountInWordsFCFA(amount: number): string {
  const rounded = Math.round(amount || 0)
  if (rounded === 0) return 'Zéro franc CFA'

  const words = integerToFrenchWords(rounded)
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1)

  // Règle française pour millions et milliards : "de francs CFA"
  const endsWithMillionOrBillion = /(millions?|milliards?)$/i.test(words.trim())
  const currencyString = endsWithMillionOrBillion ? 'de francs CFA' : 'francs CFA'

  if (rounded === 1) {
    return 'Un franc CFA'
  }

  return `${capitalized} ${currencyString}`
}

/**
 * Formate un montant entier en FCFA avec séparateur de milliers
 * Ex: 2000000 -> "2 000 000 FCFA"
 */
export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 FCFA'
  const rounded = Math.round(amount)
  // Utilise un espace insécable pour les milliers
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} FCFA`
}
