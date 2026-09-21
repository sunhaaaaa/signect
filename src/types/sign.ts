export type SignCategory = 'consonant' | 'vowel' | 'number' | 'word'

export interface SignReference {
  id: string
  label: string
  category: SignCategory
  /** Sub-topic within 'word' (e.g. 음식, 가족·관계) — inferred from the label text, see scripts/classify_word_topics.py. */
  topic?: string
  /**
   * Wrist-relative (x, y) landmarks flattened to 42 numbers. For a static
   * capture this is the average pose; for a motion capture it's the average
   * of `sequence` (kept so every reference still works with plain
   * cosine-similarity matching even where DTW isn't used).
   */
  vector: number[]
  /** Present for motion (non-static) captures — the full per-frame path, for DTW matching. */
  sequence?: number[][]
}
