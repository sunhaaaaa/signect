export type TileState = 'correct' | 'present' | 'absent'

/** Standard two-pass Wordle scoring — one tile per token (jamo, syllable, whatever the caller passes in). */
export function evaluateGuess(guessTokens: string[], targetTokens: string[]): TileState[] {
  const result: TileState[] = new Array(guessTokens.length).fill('absent')
  const targetUsed = new Array(targetTokens.length).fill(false)

  for (let i = 0; i < guessTokens.length; i++) {
    if (guessTokens[i] === targetTokens[i]) {
      result[i] = 'correct'
      targetUsed[i] = true
    }
  }
  for (let i = 0; i < guessTokens.length; i++) {
    if (result[i] === 'correct') continue
    const idx = targetTokens.findIndex((c, j) => c === guessTokens[i] && !targetUsed[j])
    if (idx !== -1) {
      result[i] = 'present'
      targetUsed[idx] = true
    }
  }
  return result
}

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** Deterministic pick from a word list, seeded by a string (e.g. today's date). */
export function pickWordForSeed(words: string[], seed: string): string {
  if (words.length === 0) return ''
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return words[hash % words.length]
}

export function pickRandomWord(words: string[], exclude?: string): string {
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]
  let word = words[Math.floor(Math.random() * words.length)]
  while (word === exclude) {
    word = words[Math.floor(Math.random() * words.length)]
  }
  return word
}
