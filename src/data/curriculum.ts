import type { SignCategory } from '../types/sign'

export const CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
export const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']
export const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export type LearnTab = 'number' | 'letter' | 'word'

export interface CurriculumItem {
  id: string
  label: string
  category: SignCategory
}

/** Matches /dev/capture's suggested ID convention, so recorded refs line up automatically. */
export function curriculumId(category: SignCategory, label: string) {
  return `${category}-${label}`
}

export const NUMBER_CURRICULUM: CurriculumItem[] = NUMBERS.map((label) => ({
  id: curriculumId('number', label),
  label,
  category: 'number',
}))

export const LETTER_CURRICULUM: CurriculumItem[] = [
  ...CONSONANTS.map((label) => ({ id: curriculumId('consonant', label), label, category: 'consonant' as const })),
  ...VOWELS.map((label) => ({ id: curriculumId('vowel', label), label, category: 'vowel' as const })),
]

export const LEARN_TABS: { key: LearnTab; label: string }[] = [
  { key: 'number', label: '지숫자' },
  { key: 'letter', label: '지문자' },
  { key: 'word', label: '단어' },
]
