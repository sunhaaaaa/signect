// Unicode Hangul syllable decomposition (초성/중성/종성), further broken down
// into the ~24 basic 지문자 jamo (14 자음 + 10 모음) — matching how Korean
// fingerspelling actually signs a syllable: doubled consonants (ㄲ, ㅆ, ...)
// as the base consonant twice, and compound vowels (ㅟ, ㅢ, ㅘ, ...) as a
// sequence of basic vowels (e.g. 위 → ㅇ, ㅜ, ㅣ), since there's no separate
// hand shape for them in the basic set.
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

// Each entry maps a Unicode jamo to the sequence of basic jamo it's signed as.
const CHO_BASIC: Record<string, string[]> = {
  ㄲ: ['ㄱ', 'ㄱ'],
  ㄸ: ['ㄷ', 'ㄷ'],
  ㅃ: ['ㅂ', 'ㅂ'],
  ㅆ: ['ㅅ', 'ㅅ'],
  ㅉ: ['ㅈ', 'ㅈ'],
}

const JUNG_BASIC: Record<string, string[]> = {
  ㅐ: ['ㅏ', 'ㅣ'],
  ㅒ: ['ㅑ', 'ㅣ'],
  ㅔ: ['ㅓ', 'ㅣ'],
  ㅖ: ['ㅕ', 'ㅣ'],
  ㅘ: ['ㅗ', 'ㅏ'],
  ㅙ: ['ㅗ', 'ㅏ', 'ㅣ'],
  ㅚ: ['ㅗ', 'ㅣ'],
  ㅝ: ['ㅜ', 'ㅓ'],
  ㅞ: ['ㅜ', 'ㅓ', 'ㅣ'],
  ㅟ: ['ㅜ', 'ㅣ'],
  ㅢ: ['ㅡ', 'ㅣ'],
}

const JONG_BASIC: Record<string, string[]> = {
  ㄲ: ['ㄱ', 'ㄱ'],
  ㄳ: ['ㄱ', 'ㅅ'],
  ㄵ: ['ㄴ', 'ㅈ'],
  ㄶ: ['ㄴ', 'ㅎ'],
  ㄺ: ['ㄹ', 'ㄱ'],
  ㄻ: ['ㄹ', 'ㅁ'],
  ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅅ'],
  ㄾ: ['ㄹ', 'ㅌ'],
  ㄿ: ['ㄹ', 'ㅍ'],
  ㅀ: ['ㄹ', 'ㅎ'],
  ㅄ: ['ㅂ', 'ㅅ'],
  ㅆ: ['ㅅ', 'ㅅ'],
}

function toBasic(jamo: string, table: Record<string, string[]>): string[] {
  return table[jamo] ?? [jamo]
}

function decomposeSyllable(ch: string): string[] | null {
  const code = ch.codePointAt(0)! - 0xac00
  if (code < 0 || code > 11171) return null
  const cho = Math.floor(code / (21 * 28))
  const jung = Math.floor((code % (21 * 28)) / 28)
  const jong = code % 28

  const tokens = [...toBasic(CHO[cho], CHO_BASIC), ...toBasic(JUNG[jung], JUNG_BASIC)]
  if (JONG[jong]) tokens.push(...toBasic(JONG[jong], JONG_BASIC))
  return tokens
}

/** Decomposes a word into its ordered basic 지문자 jamo — e.g. "가위" → ["ㄱ","ㅏ","ㅇ","ㅜ","ㅣ"]. Returns null if any character isn't a Hangul syllable. */
export function decomposeWord(word: string): string[] | null {
  const tokens: string[] = []
  for (const ch of word) {
    const syl = decomposeSyllable(ch)
    if (!syl) return null
    tokens.push(...syl)
  }
  return tokens
}
