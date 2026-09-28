import type { SignReference } from '../types/sign'
import type { ProgressData } from './progressStore'
import { NUMBER_CURRICULUM, LETTER_CURRICULUM } from '../data/curriculum'

// Duolingo-style continuous lesson path. Every practiceable item (지숫자 +
// 지문자 + every word) is flattened into ONE long, deterministic order and
// chunked into small numbered lessons — not one node per whole category —
// so there are hundreds of nodes instead of ~15, and the path never runs out
// in a few days. Nodes are strictly sequential: lesson N unlocks only once
// lesson N-1's new items are all mastered.
export type LessonCategory = 'number' | 'consonant' | 'vowel' | 'word'

export interface LessonItem {
  category: LessonCategory
  label: string
  /** Word items only — 대분류 topic, used for the node's icon/caption. */
  topic?: string
  /** Review items reinforce earlier lessons; they don't gate completion. */
  isReview: boolean
}

export interface LessonNode {
  id: string
  /** 1-based, shown directly on the node ("Node 1, 2, 3…"). */
  index: number
  items: LessonItem[]
  newCount: number
  doneCount: number
  done: boolean
  /** Dominant category/topic among this lesson's new items, for its icon/caption. */
  summary: { kind: 'number' | 'letter' | 'word'; topic?: string }
}

export interface LevelPath {
  nodes: LessonNode[]
  /** Completed-lesson count — this IS the level, by design (not a separate curve). */
  level: number
  /** Index into `nodes` of the first not-done node, or nodes.length if every node is done. */
  currentIndex: number
}

const LESSON_SIZE = 6
// When building lesson N, pull one review item each from N-2 and N-5 lessons
// back (when they exist) — light spaced repetition without a scheduler.
const REVIEW_OFFSETS = [2, 5]

// Roughly "most commonly reached for in daily life" first — not a
// linguistic difficulty ranking (see 기획서 §09).
const TOPIC_ORDER = [
  '가족·관계',
  '음식',
  '감정·상태',
  '사람·직업',
  '시간·날짜',
  '색깔·외형',
  '사물·생활',
  '동물·자연',
  '학교·교육',
  '기관·장소',
  '복지·장애',
  '동작·묘사',
  '사회·법률·행정',
  '기타',
]

function orderedTopics(presentTopics: Set<string>): string[] {
  const ordered = TOPIC_ORDER.filter((t) => presentTopics.has(t))
  const rest = Array.from(presentTopics)
    .filter((t) => !TOPIC_ORDER.includes(t))
    .sort((a, b) => a.localeCompare(b, 'ko'))
  return [...ordered, ...rest]
}

interface FlatItem {
  category: LessonCategory
  label: string
  topic?: string
}

/** Deterministic full ordering of every practiceable item, independent of dataset fetch order. */
function flattenAllItems(references: SignReference[]): FlatItem[] {
  const items: FlatItem[] = []

  const numberLabels = new Set(references.filter((r) => r.category === 'number').map((r) => r.label))
  for (const item of NUMBER_CURRICULUM) {
    if (numberLabels.has(item.label)) items.push({ category: 'number', label: item.label })
  }

  const letterLabels = new Set(
    references.filter((r) => r.category === 'consonant' || r.category === 'vowel').map((r) => r.label),
  )
  for (const item of LETTER_CURRICULUM) {
    if (letterLabels.has(item.label)) {
      items.push({ category: item.category as 'consonant' | 'vowel', label: item.label })
    }
  }

  const wordTopic = new Map<string, string>()
  for (const r of references) {
    if (r.category !== 'word') continue
    if (!wordTopic.has(r.label)) wordTopic.set(r.label, r.topic ?? '기타')
  }
  const topicWords = new Map<string, string[]>()
  for (const [label, topic] of wordTopic) {
    if (!topicWords.has(topic)) topicWords.set(topic, [])
    topicWords.get(topic)!.push(label)
  }
  for (const topic of orderedTopics(new Set(topicWords.keys()))) {
    const labels = (topicWords.get(topic) ?? []).sort((a, b) => a.localeCompare(b, 'ko'))
    for (const label of labels) items.push({ category: 'word', label, topic })
  }

  return items
}

function itemKey(category: LessonCategory, label: string): string {
  return `${category}:${label}`
}

// Deterministic PRNG (mulberry32) — shuffles the lesson order the same way
// every time it's computed, instead of re-randomizing on every render (which
// would make "node N" mean a different set of items each reload and break
// progress tracking).
function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SHUFFLE_SEED = 20260101

function seededShuffle<T>(list: T[], seed: number): T[] {
  const rng = mulberry32(seed)
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function summarize(newItems: FlatItem[]): LessonNode['summary'] {
  const first = newItems[0]
  if (!first) return { kind: 'word' }
  if (first.category === 'number') return { kind: 'number' }
  if (first.category === 'consonant' || first.category === 'vowel') return { kind: 'letter' }
  return { kind: 'word', topic: first.topic }
}

export function buildLevelPath(references: SignReference[], progress: ProgressData): LevelPath {
  const masteredKeys = new Set(progress.mastered.map((m) => m.key))
  // Randomized (not "지숫자 all → 지문자 all → topic by topic" blocks) —
  // shuffled once with a fixed seed so every learner gets the same node
  // order and it stays stable across reloads.
  const allItems = seededShuffle(flattenAllItems(references), SHUFFLE_SEED)

  const chunks: FlatItem[][] = []
  for (let i = 0; i < allItems.length; i += LESSON_SIZE) {
    chunks.push(allItems.slice(i, i + LESSON_SIZE))
  }

  const nodes: LessonNode[] = chunks.map((newItems, i) => {
    const reviewItems: LessonItem[] = []
    for (const back of REVIEW_OFFSETS) {
      const source = chunks[i - back]
      if (source && source.length > 0) {
        const pick = source[0]
        reviewItems.push({ category: pick.category, label: pick.label, topic: pick.topic, isReview: true })
      }
    }

    const newLessonItems: LessonItem[] = newItems.map((it) => ({ ...it, isReview: false }))
    const doneCount = newLessonItems.filter((it) => masteredKeys.has(itemKey(it.category, it.label))).length

    return {
      id: `lesson-${i + 1}`,
      index: i + 1,
      items: [...newLessonItems, ...reviewItems],
      newCount: newLessonItems.length,
      doneCount,
      done: newLessonItems.length > 0 && doneCount >= newLessonItems.length,
      summary: summarize(newItems),
    }
  })

  const level = nodes.filter((n) => n.done).length
  const currentIndex = nodes.findIndex((n) => !n.done)

  return { nodes, level, currentIndex: currentIndex === -1 ? nodes.length : currentIndex }
}
