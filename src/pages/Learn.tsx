import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useWebcam } from '../hooks/useWebcam'
import { useHandTracking } from '../hooks/useHandTracking'
import { useSignMatch } from '../hooks/useSignMatch'
import { useSignReferences } from '../hooks/useSignReferences'
import { useWordMotionReference } from '../hooks/useWordMotionReference'
import { useMotionRecorder } from '../hooks/useMotionRecorder'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { dtwScore } from '../lib/dtw'
import { DEFAULT_MATCH_THRESHOLD } from '../lib/signMatcher'
import { markMastered, toggleWordListEntry, isInWordList } from '../lib/progressStore'
import { SignAnimationPlayer } from '../components/learn/SignAnimationPlayer'
import { StaticHandGuide } from '../components/learn/StaticHandGuide'
import {
  LEARN_TABS,
  LETTER_CURRICULUM,
  NUMBER_CURRICULUM,
  curriculumId,
  type CurriculumItem,
  type LearnTab,
} from '../data/curriculum'

const TabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`

const TabButton = styled.button<{ $active: boolean }>`
  padding: 10px 14px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 11px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $active }) => ($active ? theme.colors.gold : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme, $active }) => ($active ? 'none' : theme.shadow.cardSm)};
  transform: ${({ $active }) => ($active ? 'translate(3px, 3px)' : 'none')};
`

const TabCount = styled.span`
  opacity: 0.7;
  margin-left: 6px;
  font-size: 9px;
`

const TopicGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
`

const TopicCard = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 16px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
`

const TopicIcon = styled.span`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.gold};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`

const TopicName = styled.div`
  font-weight: 700;
  font-size: 13px;
`

const TopicCount = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const BackRow = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 16px;
`

const CurrentTopicLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
  margin-left: 10px;
`

const TOPIC_ICONS: Record<string, string> = {
  전체: '📚',
  '기관·장소': '🏢',
  '가족·관계': '👪',
  '사람·직업': '👤',
  음식: '🍚',
  '동물·자연': '🌿',
  '색깔·외형': '🎨',
  '감정·상태': '😊',
  '시간·날짜': '🕒',
  '학교·교육': '🎓',
  '복지·장애': '🤝',
  '사회·법률·행정': '⚖️',
  '사물·생활': '🧺',
  '동작·묘사': '🏃',
  기타: '🗂️',
}

const WordHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`

const WordTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const WordProgressText = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

const HeaderProgressTrack = styled.div`
  width: 100%;
  height: 10px;
  border: 2px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  margin-bottom: 24px;
`

const HeaderProgressFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => $pct}%;
  height: 100%;
  background: ${({ theme }) => theme.colors.gold};
  transition: width 0.2s steps(6);
`

const CompareGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`

const PanelLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;
`

const CameraBox = styled.div<{ $status: 'idle' | 'correct' | 'incorrect' }>`
  position: relative;
  aspect-ratio: 4 / 3;
  background: #0d1020;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid
    ${({ $status, theme }) =>
      $status === 'correct'
        ? theme.colors.success
        : $status === 'incorrect'
          ? theme.colors.error
          : theme.colors.outline};
  transition: border-color 0.15s steps(1);
`

const ScoreBadge = styled.span<{ $status: 'idle' | 'correct' | 'incorrect' }>`
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 2;
  background: ${({ $status, theme }) =>
    $status === 'correct' ? theme.colors.success : $status === 'incorrect' ? theme.colors.error : 'rgba(0, 0, 0, 0.55)'};
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
`

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`

const LandmarkCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
  pointer-events: none;
`

const LiveBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: ${({ theme }) => theme.colors.error};
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: white;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 9px;
  padding: 4px 8px;
`

const ModelBadge = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.55);
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: #f1f1f5;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
`

const Placeholder = styled.p`
  color: #9aa0c3;
  font-size: 14px;
`

const HintList = styled.ul`
  margin: 0 0 16px;
  padding-left: 18px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.7;
`

const NavRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`

export default function Learn() {
  useStudyTimer()
  const { videoRef, isActive, error, start } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { landmarks, handedness, isModelLoading, modelError } = useHandTracking(
    videoRef,
    canvasRef,
    isActive,
  )
  const { references, isLoading: isReferencesLoading } = useSignReferences()

  const wordTopics = useMemo(() => {
    const byTopic = new Map<string, Set<string>>()
    for (const r of references) {
      if (r.category !== 'word') continue
      const topic = r.topic ?? '기타'
      if (!byTopic.has(topic)) byTopic.set(topic, new Set())
      byTopic.get(topic)!.add(r.label)
    }
    return Array.from(byTopic.entries())
      .map(([topic, labels]) => ({ topic, count: labels.size }))
      .sort((a, b) => b.count - a.count)
  }, [references])

  const [tab, setTab] = useState<LearnTab>('word')
  const [wordTopic, setWordTopic] = useState<string | null>(null)
  const [index, setIndex] = useState(0)

  const wordCurriculum = useMemo<CurriculumItem[]>(() => {
    if (wordTopic === null) return []
    const labels = Array.from(
      new Set(
        references
          .filter((r) => r.category === 'word' && (wordTopic === 'all' || (r.topic ?? '기타') === wordTopic))
          .map((r) => r.label),
      ),
    )
    labels.sort((a, b) => a.localeCompare(b, 'ko'))
    return labels.map((label) => ({ id: `word-${label}`, label, category: 'word' as const }))
  }, [references, wordTopic])

  const curriculum: CurriculumItem[] =
    tab === 'number' ? NUMBER_CURRICULUM : tab === 'letter' ? LETTER_CURRICULUM : wordCurriculum
  const currentItem = curriculum[index]
  const showingWordPicker = tab === 'word' && wordTopic === null

  const switchTab = (nextTab: LearnTab) => {
    setTab(nextTab)
    setIndex(0)
    if (nextTab === 'word') setWordTopic(null)
  }

  const chooseTopic = (topic: string) => {
    setWordTopic(topic)
    setIndex(0)
  }

  const targets = useMemo(
    () =>
      currentItem
        ? references.filter((r) => r.category === currentItem.category && r.label === currentItem.label)
        : [],
    [references, currentItem],
  )
  const { score, isMatch, hasHand } = useSignMatch(landmarks, targets)

  const hasReference = targets.length > 0
  const isWordTab = tab === 'word'
  const animationSignId =
    isWordTab && hasReference ? (targets.find((t) => !t.id.endsWith('-mirror'))?.id ?? targets[0].id) : undefined

  // Words carry real motion, so a single averaged pose can't verify them —
  // record a short attempt and compare its whole path via DTW instead.
  const referenceSequence = useWordMotionReference(animationSignId)
  const motion = useMotionRecorder(landmarks)
  const [attempt, setAttempt] = useState<{ score: number; isMatch: boolean } | null>(null)

  useEffect(() => {
    setAttempt(null)
    motion.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id])

  const toggleRecording = () => {
    if (motion.isRecording) {
      motion.stop()
      if (motion.sequence.length >= 5 && referenceSequence && referenceSequence.length >= 5) {
        const s = dtwScore(motion.sequence, referenceSequence)
        const matched = s >= DEFAULT_MATCH_THRESHOLD
        setAttempt({ score: s, isMatch: matched })
        if (matched && currentItem) markMastered(currentItem.category, currentItem.label)
      }
    } else {
      setAttempt(null)
      motion.start()
    }
  }

  const staticStatus = !hasHand || !hasReference ? 'idle' : isMatch ? 'correct' : 'incorrect'
  const wordStatus = attempt ? (attempt.isMatch ? 'correct' : 'incorrect') : 'idle'
  const status = isWordTab ? wordStatus : staticStatus

  // Static (지숫자/지문자) matching runs every frame — mark mastered once per
  // item the first time it goes correct, instead of spamming localStorage.
  const masteredRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (isWordTab || !currentItem || !isMatch) return
    const key = `${currentItem.category}:${currentItem.label}`
    if (masteredRef.current.has(key)) return
    masteredRef.current.add(key)
    markMastered(currentItem.category, currentItem.label)
  }, [isWordTab, currentItem, isMatch])

  const [inWordList, setInWordList] = useState(false)
  useEffect(() => {
    setInWordList(isWordTab && !!currentItem ? isInWordList(currentItem.label) : false)
  }, [isWordTab, currentItem])

  const handleToggleWordList = () => {
    if (!currentItem) return
    const { added } = toggleWordListEntry(currentItem.label)
    setInWordList(added)
  }

  const totalWordCount = useMemo(
    () => new Set(references.filter((r) => r.category === 'word').map((r) => r.label)).size,
    [references],
  )

  const counts = useMemo(() => {
    const capturedCount = (items: CurriculumItem[]) =>
      items.filter((item) => references.some((r) => r.category === item.category && r.label === item.label)).length
    return {
      number: capturedCount(NUMBER_CURRICULUM),
      letter: capturedCount(LETTER_CURRICULUM),
      word: totalWordCount,
    }
  }, [references, totalWordCount])

  const totals = { number: NUMBER_CURRICULUM.length, letter: LETTER_CURRICULUM.length, word: totalWordCount }

  const goPrev = () => setIndex((i) => (i - 1 + curriculum.length) % Math.max(curriculum.length, 1))
  const goNext = () => setIndex((i) => (i + 1) % Math.max(curriculum.length, 1))

  return (
    <>
      <TabBar>
        {LEARN_TABS.map((t) => (
          <TabButton key={t.key} $active={tab === t.key} onClick={() => switchTab(t.key)}>
            {t.label}
            <TabCount>
              {counts[t.key]}/{totals[t.key]}
            </TabCount>
          </TabButton>
        ))}
      </TabBar>

      {showingWordPicker ? (
        <TopicGrid>
          <TopicCard onClick={() => chooseTopic('all')}>
            <TopicIcon>{TOPIC_ICONS['전체']}</TopicIcon>
            <div>
              <TopicName>전체 단어</TopicName>
              <TopicCount>{totalWordCount}개</TopicCount>
            </div>
          </TopicCard>
          {wordTopics.map((t) => (
            <TopicCard key={t.topic} onClick={() => chooseTopic(t.topic)}>
              <TopicIcon>{TOPIC_ICONS[t.topic] ?? '🗂️'}</TopicIcon>
              <div>
                <TopicName>{t.topic}</TopicName>
                <TopicCount>{t.count}개</TopicCount>
              </div>
            </TopicCard>
          ))}
        </TopicGrid>
      ) : (
        <>
          {tab === 'word' && (
            <BackRow onClick={() => setWordTopic(null)}>
              ← 카테고리 변경
              <CurrentTopicLabel>{wordTopic === 'all' ? '전체 단어' : wordTopic}</CurrentTopicLabel>
            </BackRow>
          )}

          <WordHeader>
            <WordTitle>"{currentItem?.label ?? '...'}"</WordTitle>
            <WordProgressText>
              {curriculum.length > 0 ? `${index + 1} / ${curriculum.length}` : '0 / 0'}
            </WordProgressText>
          </WordHeader>
          <HeaderProgressTrack>
            <HeaderProgressFill $pct={curriculum.length > 0 ? ((index + 1) / curriculum.length) * 100 : 0} />
          </HeaderProgressTrack>

          <CompareGrid>
            <div>
              <PanelLabel>가이드 영상</PanelLabel>
              {animationSignId ? (
                <SignAnimationPlayer signId={animationSignId} label={currentItem?.label ?? ''} />
              ) : hasReference && targets[0] ? (
                <StaticHandGuide vector={targets[0].vector} label={currentItem?.label ?? ''} />
              ) : (
                <Card>
                  <p style={{ color: '#6B7290', fontSize: 13 }}>
                    {isReferencesLoading
                      ? '수어 레퍼런스 데이터를 불러오는 중입니다...'
                      : currentItem
                        ? `"${currentItem.label}" 레퍼런스가 아직 없습니다. /dev/capture 에서 ID "${curriculumId(currentItem.category, currentItem.label)}"로 녹화해 추가하세요.`
                        : ''}
                  </p>
                </Card>
              )}
            </div>

            <div>
              <PanelLabel>내 카메라</PanelLabel>
              <CameraBox $status={isActive ? status : 'idle'}>
                {isActive && <LiveBadge>● LIVE</LiveBadge>}
                {isActive && (
                  <ModelBadge>
                    {isModelLoading
                      ? '모델 로딩 중...'
                      : modelError
                        ? modelError
                        : landmarks.length > 0
                          ? `손 ${landmarks.length}개 인식됨 (${handedness.join(', ')})`
                          : '손을 카메라에 보여주세요'}
                  </ModelBadge>
                )}
                {isActive && !isModelLoading && (
                  <ScoreBadge $status={status}>
                    {isWordTab
                      ? !hasReference
                        ? '레퍼런스 없음'
                        : motion.isRecording
                          ? `녹화 중... (${motion.sequence.length}프레임)`
                          : attempt
                            ? `일치도 ${attempt.score}%`
                            : '녹화 버튼을 눌러 시작'
                      : !hasReference
                        ? '레퍼런스 없음'
                        : !hasHand
                          ? '대기 중'
                          : `일치도 ${score}%`}
                  </ScoreBadge>
                )}
                <Video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: isActive ? 'block' : 'none' }}
                />
                <LandmarkCanvas ref={canvasRef} />
                {!isActive && <Placeholder>{error ?? '카메라를 시작해 학습을 시작하세요'}</Placeholder>}
              </CameraBox>
            </div>
          </CompareGrid>

          <Card>
            <HintList>
              <li>손이 카메라 중앙에 오도록 위치를 맞추세요</li>
              {isWordTab ? (
                <>
                  <li>가이드 영상으로 동작을 먼저 확인하세요</li>
                  <li>"동작 녹화 시작"을 누르고 그 동작을 그대로 따라 한 뒤 다시 눌러 채점하세요</li>
                </>
              ) : (
                <li>가이드를 천천히 따라 하며 일치도를 확인하세요</li>
              )}
            </HintList>
            <NavRow>
              <Button onClick={start} disabled={isActive} style={{ flex: 1 }}>
                {isActive ? '학습 중...' : '시작하기'}
              </Button>
              {isWordTab && isActive && (
                <Button
                  $variant={motion.isRecording ? 'accent' : 'secondary'}
                  onClick={toggleRecording}
                  disabled={!hasReference}
                  style={{ flex: 1 }}
                >
                  {motion.isRecording ? `녹화 중지 & 채점 (${motion.sequence.length})` : '동작 녹화 시작'}
                </Button>
              )}
            </NavRow>
            {isWordTab && currentItem && (
              <NavRow>
                <Button $variant={inWordList ? 'accent' : 'secondary'} style={{ flex: 1 }} onClick={handleToggleWordList}>
                  {inWordList ? '★ 내 단어장에 있음' : '☆ 내 단어장에 추가'}
                </Button>
              </NavRow>
            )}
            <NavRow style={{ marginBottom: 0 }}>
              <Button $variant="secondary" style={{ flex: 1 }} onClick={goPrev}>
                ← 이전
              </Button>
              <Button style={{ flex: 2 }} onClick={goNext}>
                넘어가기 →
              </Button>
            </NavRow>
          </Card>
        </>
      )}
    </>
  )
}
