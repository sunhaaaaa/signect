// Client-side learning-progress tracker. No backend yet (Firebase Auth /
// Firestore are intentionally out of scope for now) — everything here reads
// and writes a single localStorage record, per-browser. This is what makes
// MyPage/GamesHome show real numbers instead of hardcoded placeholders.
const STORAGE_KEY = 'signect:progress:v1'

export interface MasteredEntry {
  /** `${category}:${label}`, e.g. "word:간편" or "consonant:ㄱ". */
  key: string
  /** YYYY-MM-DD the item was first mastered. */
  date: string
}

export interface WordListEntry {
  label: string
  addedAt: string
}

export interface ProgressData {
  mastered: MasteredEntry[]
  activeDates: string[]
  studyMsByDate: Record<string, number>
  wordList: WordListEntry[]
  quizAttempts: number
  quizCorrect: number
  sudokuClears: number
  kkoddleWins: number
  /** Dates (YYYY-MM-DD) on which at least one game was cleared/won — powers the "오늘/이번 주 게임 플레이" quests. */
  gameClearDates: string[]
  /** Equipped mascot item id per slot ("palette"/"outfit"/"hat"/"necklace"), see lib/mascotItems.ts. */
  equippedMascotItems?: Record<string, string>
}

function emptyProgress(): ProgressData {
  return {
    mastered: [],
    activeDates: [],
    studyMsByDate: {},
    wordList: [],
    quizAttempts: 0,
    quizCorrect: 0,
    sudokuClears: 0,
    kkoddleWins: 0,
    gameClearDates: [],
  }
}

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw)
    return { ...emptyProgress(), ...parsed }
  } catch {
    return emptyProgress()
  }
}

function save(data: ProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // private browsing / quota exceeded — progress just won't persist this session
  }
}

function touchActivity(data: ProgressData) {
  const t = todayKey()
  if (!data.activeDates.includes(t)) data.activeDates.push(t)
}

function touchGameClear(data: ProgressData) {
  const t = todayKey()
  if (!data.gameClearDates.includes(t)) data.gameClearDates.push(t)
}

/** Call when the learner successfully matches an item for the first time. Idempotent per key. */
export function markMastered(category: string, label: string): ProgressData {
  const data = loadProgress()
  const key = `${category}:${label}`
  if (!data.mastered.some((m) => m.key === key)) {
    data.mastered.push({ key, date: todayKey() })
  }
  touchActivity(data)
  save(data)
  return data
}

export function logActivity(): ProgressData {
  const data = loadProgress()
  touchActivity(data)
  save(data)
  return data
}

/** Accumulates time-on-task, bucketed by day, for the weekly-average stat. */
export function addStudyMs(ms: number): void {
  if (!Number.isFinite(ms) || ms <= 0) return
  const data = loadProgress()
  const t = todayKey()
  data.studyMsByDate[t] = (data.studyMsByDate[t] ?? 0) + ms
  touchActivity(data)
  save(data)
}

export function toggleWordListEntry(label: string): { data: ProgressData; added: boolean } {
  const data = loadProgress()
  const idx = data.wordList.findIndex((w) => w.label === label)
  let added: boolean
  if (idx === -1) {
    data.wordList.unshift({ label, addedAt: todayKey() })
    added = true
  } else {
    data.wordList.splice(idx, 1)
    added = false
  }
  save(data)
  return { data, added }
}

export function isInWordList(label: string, data: ProgressData = loadProgress()): boolean {
  return data.wordList.some((w) => w.label === label)
}

export function recordQuizResult(correct: boolean): ProgressData {
  const data = loadProgress()
  data.quizAttempts += 1
  if (correct) data.quizCorrect += 1
  touchActivity(data)
  save(data)
  return data
}

export function recordSudokuClear(): ProgressData {
  const data = loadProgress()
  data.sudokuClears += 1
  touchActivity(data)
  touchGameClear(data)
  save(data)
  return data
}

export function recordKkoddleWin(): ProgressData {
  const data = loadProgress()
  data.kkoddleWins += 1
  touchActivity(data)
  touchGameClear(data)
  save(data)
  return data
}

/** Equips an item into its slot. Caller is responsible for checking it's unlocked (see lib/mascotItems.ts). */
export function setEquippedMascotItem(slot: string, itemId: string): ProgressData {
  const data = loadProgress()
  data.equippedMascotItems = { ...data.equippedMascotItems, [slot]: itemId }
  save(data)
  return data
}

/** Consecutive days ending today (or yesterday, if today has no activity yet). */
export function computeStreak(data: ProgressData): number {
  if (data.activeDates.length === 0) return 0
  const set = new Set(data.activeDates)
  const cursor = new Date()
  if (!set.has(todayKey())) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (set.has(dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function masteredCount(data: ProgressData, categoryPrefix?: string): number {
  if (!categoryPrefix) return data.mastered.length
  return data.mastered.filter((m) => m.key.startsWith(`${categoryPrefix}:`)).length
}

export function newlyMasteredCount(data: ProgressData, sinceDaysAgo: number): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - sinceDaysAgo)
  const cutoffKey = dateKey(cutoff)
  return data.mastered.filter((m) => m.date >= cutoffKey).length
}

export function totalStudyMs(data: ProgressData): number {
  return Object.values(data.studyMsByDate).reduce((sum, ms) => sum + ms, 0)
}

/** Average minutes/day over days that actually had any study time in the last 7 days. */
export function weeklyAverageMinutes(data: ProgressData): number {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 6)
  const cutoffKey = dateKey(cutoff)

  let sumMs = 0
  let days = 0
  for (const [date, ms] of Object.entries(data.studyMsByDate)) {
    if (date >= cutoffKey) {
      sumMs += ms
      days += 1
    }
  }
  return days > 0 ? Math.round(sumMs / days / 60000) : 0
}

export function quizAccuracy(data: ProgressData): number {
  if (data.quizAttempts === 0) return 0
  return Math.round((data.quizCorrect / data.quizAttempts) * 100)
}

/** Monday-start week window (YYYY-MM-DD, inclusive) containing today. */
export function currentWeekRange(): { start: string; end: string } {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // 0=Mon .. 6=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - dow)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: dateKey(monday), end: dateKey(sunday) }
}
