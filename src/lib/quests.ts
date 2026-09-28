import { currentWeekRange, todayKey, type ProgressData } from './progressStore'

export interface QuestTask {
  id: string
  label: string
  done: boolean
}

const FIVE_MIN_MS = 5 * 60 * 1000
const THIRTY_MIN_MS = 30 * 60 * 1000

export function computeDailyQuests(progress: ProgressData): QuestTask[] {
  const today = todayKey()
  const studiedToday = progress.studyMsByDate[today] ?? 0
  const masteredToday = progress.mastered.some((m) => m.key.startsWith('word:') && m.date === today)
  const playedToday = progress.gameClearDates.includes(today)

  return [
    { id: 'daily-study', label: '오늘 5분 이상 학습하기', done: studiedToday >= FIVE_MIN_MS },
    { id: 'daily-word', label: '새 단어 1개 이상 배우기', done: masteredToday },
    { id: 'daily-game', label: '게임 1판 이상 클리어하기', done: playedToday },
  ]
}

export function computeWeeklyQuests(progress: ProgressData): QuestTask[] {
  const { start, end } = currentWeekRange()

  let weeklyStudyMs = 0
  for (const [date, ms] of Object.entries(progress.studyMsByDate)) {
    if (date >= start && date <= end) weeklyStudyMs += ms
  }
  const weeklyGameClears = progress.gameClearDates.filter((d) => d >= start && d <= end).length

  return [
    { id: 'weekly-study', label: '이번 주 30분 이상 학습하기', done: weeklyStudyMs >= THIRTY_MIN_MS },
    { id: 'weekly-game', label: '이번 주 게임 3판 이상 클리어하기', done: weeklyGameClears >= 3 },
  ]
}

/** Oldest-mastered words, as a lightweight nudge to revisit them (no completion tracking — informational). */
export function suggestReviewWords(progress: ProgressData, limit = 3): string[] {
  return progress.mastered
    .filter((m) => m.key.startsWith('word:'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map((m) => m.key.slice('word:'.length))
}
