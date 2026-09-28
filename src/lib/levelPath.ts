import type { SignReference } from '../types/sign'
import type { ProgressData } from './progressStore'

export interface LevelNode {
  id: string
  label: string
  icon: string
  target: number
  progress: number
  done: boolean
}

export interface LevelPath {
  nodes: LevelNode[]
  level: number
  /** Index of the first not-yet-done node, or nodes.length if everything is done. */
  currentNodeIndex: number
}

const TOPIC_ICONS: Record<string, string> = {
  '가족·관계': '👪',
  음식: '🍚',
  '감정·상태': '😊',
  '사람·직업': '👤',
  '시간·날짜': '🕒',
  '색깔·외형': '🎨',
  '사물·생활': '🧺',
  '동물·자연': '🌿',
  '학교·교육': '🎓',
  '기관·장소': '🏢',
  '복지·장애': '🤝',
  '동작·묘사': '🏃',
  '사회·법률·행정': '⚖️',
  기타: '🗂️',
}

// Roughly "most commonly reached for in daily life" first — not a linguistic
// difficulty ranking (we deliberately avoid claiming one, see 기획서 §09).
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

const TOPIC_NODE_CAP = 15

function orderedTopics(presentTopics: Set<string>): string[] {
  const ordered = TOPIC_ORDER.filter((t) => presentTopics.has(t))
  const rest = Array.from(presentTopics)
    .filter((t) => !TOPIC_ORDER.includes(t))
    .sort((a, b) => a.localeCompare(b, 'ko'))
  return [...ordered, ...rest]
}

export function buildLevelPath(references: SignReference[], progress: ProgressData): LevelPath {
  const masteredKeys = new Set(progress.mastered.map((m) => m.key))

  const numberLabels = new Set(references.filter((r) => r.category === 'number').map((r) => r.label))
  const letterLabels = new Set(
    references.filter((r) => r.category === 'consonant' || r.category === 'vowel').map((r) => r.label),
  )

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

  const nodes: LevelNode[] = []

  if (numberLabels.size > 0) {
    const progressCount = Array.from(numberLabels).filter((l) => masteredKeys.has(`number:${l}`)).length
    nodes.push({
      id: 'topic-지숫자',
      label: '지숫자',
      icon: '🔢',
      target: numberLabels.size,
      progress: progressCount,
      done: progressCount >= numberLabels.size,
    })
  }

  if (letterLabels.size > 0) {
    const progressCount = Array.from(letterLabels).filter(
      (l) => masteredKeys.has(`consonant:${l}`) || masteredKeys.has(`vowel:${l}`),
    ).length
    nodes.push({
      id: 'topic-지문자',
      label: '지문자',
      icon: '🤟',
      target: letterLabels.size,
      progress: progressCount,
      done: progressCount >= letterLabels.size,
    })
  }

  for (const topic of orderedTopics(new Set(topicWords.keys()))) {
    const labels = topicWords.get(topic) ?? []
    const target = Math.min(labels.length, TOPIC_NODE_CAP)
    const progressCount = labels.filter((l) => masteredKeys.has(`word:${l}`)).length
    nodes.push({
      id: `topic-${topic}`,
      label: topic,
      icon: TOPIC_ICONS[topic] ?? '🗂️',
      target,
      progress: Math.min(progressCount, target),
      done: progressCount >= target,
    })
  }

  const level = nodes.filter((n) => n.done).length
  const currentNodeIndex = nodes.findIndex((n) => !n.done)

  return { nodes, level, currentNodeIndex: currentNodeIndex === -1 ? nodes.length : currentNodeIndex }
}
