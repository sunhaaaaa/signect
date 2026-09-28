import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PixelMascot } from '../components/brand/PixelMascot'
import { useAuth } from '../hooks/useAuth'
import { useSignReferences } from '../hooks/useSignReferences'
import { buildLevelPath } from '../lib/levelPath'
import { computeDailyQuests, computeWeeklyQuests, suggestReviewWords } from '../lib/quests'
import {
  MASCOT_SLOTS,
  itemsForSlot,
  isMascotItemUnlocked,
  resolveEquippedItems,
  resolvedToMascotProps,
  type MascotSlot,
} from '../lib/mascotItems'
import {
  loadProgress,
  computeStreak,
  masteredCount,
  newlyMasteredCount,
  totalStudyMs,
  weeklyAverageMinutes,
  quizAccuracy,
  setEquippedMascotItem,
  type ProgressData,
} from '../lib/progressStore'

const Title = styled.h1`
  font-size: 18px;
  margin: 0 0 20px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

const StatCard = styled.div<{ $bg: string; $fg: string }>`
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  border: 3px solid ${({ theme }) => theme.colors.outline};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  padding: 18px;
`

const StatLabel = styled.div`
  font-size: 13px;
  opacity: 0.9;
`

const StatValue = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 20px;
  margin: 8px 0 4px;
`

const StatHint = styled.div`
  font-size: 13px;
  opacity: 0.7;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const ChartPlaceholder = styled.div`
  height: 120px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: repeating-linear-gradient(
    45deg,
    ${({ theme }) => theme.colors.bg},
    ${({ theme }) => theme.colors.bg} 10px,
    #e3f1ff 10px,
    #e3f1ff 20px
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
  padding: 8px;
`

const MiniStats = styled.div`
  display: flex;
  justify-content: space-around;
  text-align: center;
`

const MiniValue = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 17px;
`

const MiniLabel = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const WordRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 15px;

  &:last-child {
    border-bottom: none;
  }
`

const EmptyNote = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 15px;
  margin: 0;
`

const BadgeGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`

const Badge = styled.span<{ $earned: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  padding: 6px 10px;
  border: 2px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $earned }) => ($earned ? theme.colors.gold : theme.colors.surface)};
  opacity: ${({ $earned }) => ($earned ? 1 : 0.45)};
`

const LevelHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
`

const LevelNum = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 20px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const LevelSub = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const QuestList = styled.ul`
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
`

const QuestItem = styled.li<{ $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};
  font-size: 15px;
  color: ${({ theme, $done }) => ($done ? theme.colors.text : theme.colors.textMuted)};

  &:last-child {
    border-bottom: none;
  }
`

const QuestBox = styled.span<{ $done: boolean }>`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border: 1.5px solid ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
  background: ${({ theme, $done }) => ($done ? theme.colors.success : 'transparent')};
  border-color: ${({ theme, $done }) => ($done ? theme.colors.success : theme.colors.textMuted)};
  color: ${({ theme }) => theme.colors.surface};
`

const ReviewNote = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 14px 0 0;
`

const MascotPreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
`

const SwatchGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const Swatch = styled.button<{ $color: string; $active: boolean; $locked: boolean }>`
  position: relative;
  width: 44px;
  height: 44px;
  border: 3px solid ${({ theme, $active }) => ($active ? theme.colors.outline : theme.colors.border)};
  background: ${({ $color }) => $color};
  box-shadow: ${({ theme, $active }) => ($active ? theme.shadow.cardSm : 'none')};
  opacity: ${({ $locked }) => ($locked ? 0.35 : 1)};
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
`

const SlotLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;
`

const OptionPill = styled.button<{ $active: boolean; $locked: boolean }>`
  height: 44px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 700;
  border: 3px solid ${({ theme, $active }) => ($active ? theme.colors.outline : theme.colors.border)};
  background: ${({ theme, $active }) => ($active ? theme.colors.gold : theme.colors.surface)};
  box-shadow: ${({ theme, $active }) => ($active ? theme.shadow.cardSm : 'none')};
  opacity: ${({ $locked }) => ($locked ? 0.5 : 1)};
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
`

const SwatchLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin-top: 4px;
  width: 44px;
`

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}시간 ${minutes}분`
  return `${minutes}분`
}

function formatRelativeDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const then = new Date(y, (m ?? 1) - 1, d ?? 1)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.round((now.getTime() - then.getTime()) / 86400000)
  if (diffDays <= 0) return '오늘'
  if (diffDays === 1) return '어제'
  return `${diffDays}일 전`
}

export default function MyPage() {
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading, signOutUser } = useAuth()
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const { references } = useSignReferences()

  useEffect(() => {
    if (!isAuthLoading && !user) navigate('/login', { replace: true })
  }, [isAuthLoading, user, navigate])

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  const handleLogout = async () => {
    await signOutUser()
    navigate('/')
  }

  const levelPath = useMemo(
    () => (progress ? buildLevelPath(references, progress) : null),
    [references, progress],
  )
  const dailyQuests = useMemo(() => (progress ? computeDailyQuests(progress) : []), [progress])
  const weeklyQuests = useMemo(() => (progress ? computeWeeklyQuests(progress) : []), [progress])
  const reviewWords = useMemo(() => (progress ? suggestReviewWords(progress) : []), [progress])

  const level = levelPath?.level ?? 0
  const resolvedMascot = resolveEquippedItems(progress?.equippedMascotItems, level)
  const mascotProps = resolvedToMascotProps(resolvedMascot)

  const handleEquip = (slot: MascotSlot, itemId: string, unlocked: boolean) => {
    if (!unlocked) return
    setProgress(setEquippedMascotItem(slot, itemId))
  }

  const streak = progress ? computeStreak(progress) : 0
  const wordsMastered = progress ? masteredCount(progress, 'word') : 0
  const newWords = progress ? newlyMasteredCount(progress, 7) : 0
  const studyMs = progress ? totalStudyMs(progress) : 0
  const weeklyAvg = progress ? weeklyAverageMinutes(progress) : 0
  const accuracy = progress ? quizAccuracy(progress) : 0
  const wordList = progress?.wordList ?? []

  const stats = [
    {
      label: '연속 학습',
      value: `${streak}일`,
      hint: streak > 0 ? '오늘까지 꾸준히 학습하고 있어요' : '오늘부터 시작해보세요',
      bg: '#3B82F6',
      fg: '#fff',
    },
    {
      label: '학습한 단어',
      value: `${wordsMastered}개`,
      hint: newWords > 0 ? `지난 7일간 ${newWords}개 추가` : '단어 탭에서 학습을 시작해보세요',
      bg: '#3CB043',
      fg: '#fff',
    },
    {
      label: '총 학습 시간',
      value: formatDuration(studyMs),
      hint: '학습하기·게임 화면에 머문 누적 시간',
      bg: '#FFC531',
      fg: '#1B1B2F',
    },
  ]

  const miniStats = [
    { value: `${weeklyAvg}분`, label: '주간 평균' },
    { value: `${accuracy}%`, label: '퀴즈 정답률' },
    { value: `${newWords}`, label: '새단어(7일)' },
  ]

  const badges = [
    { label: '🔥 3일 연속 학습', earned: streak >= 3 },
    { label: '📚 단어 10개 마스터', earned: wordsMastered >= 10 },
    { label: '🎮 게임 첫 승리', earned: (progress?.sudokuClears ?? 0) > 0 || (progress?.kkoddleWins ?? 0) > 0 },
    { label: '✨ 퀴즈 5문제 도전', earned: (progress?.quizAttempts ?? 0) >= 5 },
  ]

  if (isAuthLoading || !user) {
    return (
      <Card>
        <p style={{ color: '#6B7290', fontSize: 13 }}>
          {isAuthLoading ? '로그인 상태를 확인하는 중...' : '로그인 페이지로 이동 중...'}
        </p>
      </Card>
    )
  }

  return (
    <>
      <Title>마이페이지</Title>

      <StatsRow>
        {stats.map((s) => (
          <StatCard key={s.label} $bg={s.bg} $fg={s.fg}>
            <StatLabel>{s.label}</StatLabel>
            <StatValue>{s.value}</StatValue>
            <StatHint>{s.hint}</StatHint>
          </StatCard>
        ))}
      </StatsRow>

      <Grid>
        <Card>
          <CardHead>
            <strong>학습 리포트</strong>
          </CardHead>
          <ChartPlaceholder>
            아직 일별 그래프는 없지만, 아래 수치는 이 브라우저에 실제로 기록된 학습 데이터예요.
          </ChartPlaceholder>
          <MiniStats>
            {miniStats.map((m) => (
              <div key={m.label}>
                <MiniValue>{m.value}</MiniValue>
                <MiniLabel>{m.label}</MiniLabel>
              </div>
            ))}
          </MiniStats>
        </Card>

        <Card>
          <CardHead>
            <strong>개인 단어장</strong>
            <span style={{ fontSize: 12, color: '#6B7290' }}>{wordList.length}개</span>
          </CardHead>
          {wordList.length === 0 ? (
            <EmptyNote>학습하기 &gt; 단어 탭에서 "☆ 내 단어장에 추가"를 눌러 채워보세요.</EmptyNote>
          ) : (
            wordList
              .slice(0, 8)
              .map((w) => (
                <WordRow key={w.label}>
                  <span>{w.label}</span>
                  <span style={{ color: '#6B7290' }}>{formatRelativeDate(w.addedAt)}</span>
                </WordRow>
              ))
          )}
        </Card>
      </Grid>

      {levelPath && (
        <div style={{ marginTop: 20 }}>
          <Card>
            <LevelHead>
              <LevelNum>Lv.{levelPath.level}</LevelNum>
              <LevelSub>
                {levelPath.currentIndex < levelPath.nodes.length
                  ? `다음 레슨: ${levelPath.currentIndex + 1}번`
                  : '모든 레슨을 완료했어요!'}
              </LevelSub>
            </LevelHead>
            <p style={{ color: '#6B7290', fontSize: 13, margin: '8px 0 16px' }}>
              총 {levelPath.nodes.length}개 레슨 중 {levelPath.level}개 완료
            </p>
            <Button style={{ width: '100%' }} onClick={() => navigate('/path')}>
              학습 경로 보기 →
            </Button>
          </Card>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Grid>
          <Card>
            <strong>오늘의 퀘스트</strong>
            <QuestList>
              {dailyQuests.map((q) => (
                <QuestItem key={q.id} $done={q.done}>
                  <QuestBox $done={q.done}>{q.done ? '✓' : ''}</QuestBox>
                  {q.label}
                </QuestItem>
              ))}
            </QuestList>
            {reviewWords.length > 0 && (
              <ReviewNote>💡 오늘의 추천 복습: {reviewWords.join(', ')}</ReviewNote>
            )}
          </Card>
          <Card>
            <strong>이번 주 퀘스트</strong>
            <QuestList>
              {weeklyQuests.map((q) => (
                <QuestItem key={q.id} $done={q.done}>
                  <QuestBox $done={q.done}>{q.done ? '✓' : ''}</QuestBox>
                  {q.label}
                </QuestItem>
              ))}
            </QuestList>
          </Card>
        </Grid>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card>
          <strong>마스코트 꾸미기</strong>
          <p style={{ color: '#6B7290', fontSize: 13, margin: '8px 0 16px' }}>
            레벨을 올리면 옷·모자·목걸이가 하나씩 잠금 해제돼요.
          </p>
          <MascotPreviewRow>
            <PixelMascot size={160} variant="full" {...mascotProps} />
          </MascotPreviewRow>
          {MASCOT_SLOTS.map(({ slot, label }) => (
            <div key={slot} style={{ marginBottom: 18 }}>
              <SlotLabel>{label}</SlotLabel>
              <SwatchGrid>
                {itemsForSlot(slot).map((item) => {
                  const unlocked = isMascotItemUnlocked(item, level)
                  const active = resolvedMascot[slot].id === item.id
                  const isColorSlot = slot === 'palette' || slot === 'outfit'
                  return (
                    <div key={item.id}>
                      {isColorSlot ? (
                        <Swatch
                          type="button"
                          $color={item.value}
                          $active={active}
                          $locked={!unlocked}
                          disabled={!unlocked}
                          onClick={() => handleEquip(slot, item.id, unlocked)}
                          title={unlocked ? item.label : `Lv.${item.unlockLevel} 달성 시 해금`}
                        >
                          {!unlocked && '🔒'}
                        </Swatch>
                      ) : (
                        <OptionPill
                          type="button"
                          $active={active}
                          $locked={!unlocked}
                          disabled={!unlocked}
                          onClick={() => handleEquip(slot, item.id, unlocked)}
                          title={unlocked ? item.label : `Lv.${item.unlockLevel} 달성 시 해금`}
                        >
                          {unlocked ? item.label : '🔒'}
                        </OptionPill>
                      )}
                      <SwatchLabel>{unlocked ? item.label : `Lv.${item.unlockLevel}`}</SwatchLabel>
                    </div>
                  )
                })}
              </SwatchGrid>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card>
          <strong>업적</strong>
          <p style={{ color: '#6B7290', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
            학습 기록에 따라 자동으로 달성됩니다.
          </p>
          <BadgeGrid>
            {badges.map((b) => (
              <Badge key={b.label} $earned={b.earned}>
                {b.label}
              </Badge>
            ))}
          </BadgeGrid>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card>
          <p style={{ color: '#6B7290', fontSize: 13, margin: '0 0 12px' }}>
            {user.displayName ?? '수어러'}님으로 로그인되어 있습니다.
          </p>
          <Button $variant="secondary" style={{ width: '100%' }} onClick={handleLogout}>
            로그아웃
          </Button>
        </Card>
      </div>
    </>
  )
}
