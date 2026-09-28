import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { HandCameraPanel } from '../components/learn/HandCameraPanel'
import { SignAnimationPlayer } from '../components/learn/SignAnimationPlayer'
import { StaticHandGuide } from '../components/learn/StaticHandGuide'
import { useAuth } from '../hooks/useAuth'
import { useWebcam } from '../hooks/useWebcam'
import { useHandTracking } from '../hooks/useHandTracking'
import { useSignReferences } from '../hooks/useSignReferences'
import { useSignMatch } from '../hooks/useSignMatch'
import { useWordMotionReference } from '../hooks/useWordMotionReference'
import { useMotionRecorder } from '../hooks/useMotionRecorder'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { dtwScore } from '../lib/dtw'
import { DEFAULT_MATCH_THRESHOLD } from '../lib/signMatcher'
import { buildLevelPath, type LessonItem } from '../lib/levelPath'
import { loadProgress, markMastered, type ProgressData } from '../lib/progressStore'

const Title = styled.h1`
  font-size: 18px;
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const PhaseBadge = styled.span<{ $phase: 'teach' | 'check' }>`
  display: inline-block;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 12px;
  padding: 4px 10px;
  margin-bottom: 10px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $phase }) => ($phase === 'teach' ? theme.colors.surface : theme.colors.gold)};
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 10px;
  border: 2px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  margin-bottom: 20px;
`

const ProgressFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => $pct}%;
  height: 100%;
  background: ${({ theme }) => theme.colors.gold};
  transition: width 0.2s steps(6);
`

const WordPrompt = styled.h2`
  text-align: center;
  font-size: 24px;
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.primaryDark};
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
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;
`

const HintText = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 14px;
`

const CompleteWrap = styled.div`
  text-align: center;
  padding: 30px 12px;
`

const CompleteEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`

const QuizQuestion = styled.p`
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px;
`

const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const ChoiceButton = styled.button<{ $state: 'idle' | 'correct' | 'wrong' | 'reveal' }>`
  padding: 14px 10px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 15px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $state }) =>
    $state === 'correct' || $state === 'reveal'
      ? theme.colors.success
      : $state === 'wrong'
        ? theme.colors.error
        : theme.colors.surface};
  color: ${({ theme, $state }) => ($state === 'idle' ? theme.colors.text : '#fff')};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition:
    transform 0.06s steps(1),
    box-shadow 0.06s steps(1);

  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  &:disabled {
    cursor: not-allowed;
  }
`

function itemMatchKey(item: LessonItem): string {
  return `${item.category}:${item.label}`
}

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function Lesson() {
  useStudyTimer()
  const navigate = useNavigate()
  const { nodeIndex } = useParams<{ nodeIndex: string }>()
  const targetIndex = Number(nodeIndex)

  const { user, isLoading: isAuthLoading } = useAuth()
  useEffect(() => {
    if (!isAuthLoading && !user) navigate('/login', { replace: true })
  }, [isAuthLoading, user, navigate])

  const { references, isLoading: isReferencesLoading } = useSignReferences()
  const [progress, setProgress] = useState<ProgressData | null>(null)
  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  const levelPath = useMemo(
    () => (progress ? buildLevelPath(references, progress) : null),
    [references, progress],
  )
  const node = levelPath?.nodes.find((n) => n.index === targetIndex) ?? null
  const locked = !!(levelPath && node && node.index - 1 > levelPath.currentIndex)

  useEffect(() => {
    if (levelPath && (!node || locked)) navigate('/path', { replace: true })
  }, [levelPath, node, locked, navigate])

  const [phase, setPhase] = useState<'teach' | 'check' | 'complete'>('teach')
  const [teachStep, setTeachStep] = useState(0)
  const [checkQueue, setCheckQueue] = useState<LessonItem[]>([])
  const [checkStep, setCheckStep] = useState(0)
  const teachMarkedRef = useRef<Set<string>>(new Set())
  const checkMarkedRef = useRef<Set<string>>(new Set())

  // Reset the whole session if the URL points at a different node.
  useEffect(() => {
    setPhase('teach')
    setTeachStep(0)
    setCheckQueue([])
    setCheckStep(0)
    teachMarkedRef.current = new Set()
    checkMarkedRef.current = new Set()
  }, [targetIndex])

  const teachItems = node?.items ?? []
  const currentItem: LessonItem | undefined =
    phase === 'teach' ? teachItems[teachStep] : phase === 'check' ? checkQueue[checkStep] : undefined

  // 확인 단계 선택지 풀 — 카테고리별 라벨 전체(단어는 단어끼리, 숫자는 숫자끼리 헷갈리게).
  const labelPoolByCategory = useMemo(() => {
    const pools: Record<LessonItem['category'], string[]> = { number: [], consonant: [], vowel: [], word: [] }
    const seen: Record<LessonItem['category'], Set<string>> = {
      number: new Set(),
      consonant: new Set(),
      vowel: new Set(),
      word: new Set(),
    }
    for (const r of references) {
      const cat = r.category as LessonItem['category']
      if (!pools[cat] || seen[cat].has(r.label)) continue
      seen[cat].add(r.label)
      pools[cat].push(r.label)
    }
    return pools
  }, [references])

  const [choices, setChoices] = useState<string[]>([])
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [choiceFeedback, setChoiceFeedback] = useState<'correct' | 'incorrect' | null>(null)

  useEffect(() => {
    if (phase !== 'check' || !currentItem) return
    const pool = labelPoolByCategory[currentItem.category].filter((l) => l !== currentItem.label)
    const distractors = shuffled(pool).slice(0, 3)
    setChoices(shuffled([...distractors, currentItem.label]))
    setSelectedChoice(null)
    setChoiceFeedback(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, checkStep, currentItem])

  const { videoRef, isActive, error, start } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { landmarks, isModelLoading, modelError } = useHandTracking(videoRef, canvasRef, isActive)

  const targets = useMemo(
    () => (currentItem ? references.filter((r) => r.category === currentItem.category && r.label === currentItem.label) : []),
    [references, currentItem],
  )
  const isWordItem = currentItem?.category === 'word'
  const hasReference = targets.length > 0
  const animationSignId =
    isWordItem && hasReference ? (targets.find((t) => !t.id.endsWith('-mirror'))?.id ?? targets[0].id) : undefined
  const referenceSequence = useWordMotionReference(animationSignId)

  const { score: staticScore, isMatch: staticIsMatch, hasHand } = useSignMatch(landmarks, isWordItem ? [] : targets)
  const motion = useMotionRecorder(landmarks)
  const [wordAttempt, setWordAttempt] = useState<{ score: number; isMatch: boolean } | null>(null)

  useEffect(() => {
    setWordAttempt(null)
    motion.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.category, currentItem?.label, phase])

  // Teach phase: correctness is opportunistic (never blocks "다음") — mark
  // mastered once per item the moment it's seen, so a fast learner can skip
  // straight to done without needing the check round to re-prove it.
  useEffect(() => {
    if (phase !== 'teach' || !currentItem || currentItem.isReview || isWordItem) return
    if (!staticIsMatch) return
    const key = itemMatchKey(currentItem)
    if (teachMarkedRef.current.has(key)) return
    teachMarkedRef.current.add(key)
    markMastered(currentItem.category, currentItem.label)
  }, [phase, currentItem, isWordItem, staticIsMatch])

  const toggleWordRecording = () => {
    if (motion.isRecording) {
      motion.stop()
      if (motion.sequence.length >= 5 && referenceSequence && referenceSequence.length >= 5) {
        const s = dtwScore(motion.sequence, referenceSequence)
        const matched = s >= DEFAULT_MATCH_THRESHOLD
        setWordAttempt({ score: s, isMatch: matched })
        if (matched && currentItem) {
          const key = itemMatchKey(currentItem)
          const ref = phase === 'teach' ? teachMarkedRef : checkMarkedRef
          if (!ref.current.has(key)) {
            ref.current.add(key)
            markMastered(currentItem.category, currentItem.label)
          }
        }
      }
    } else {
      setWordAttempt(null)
      motion.start()
    }
  }

  const startCheckPhase = () => {
    const fresh = loadProgress()
    const masteredKeys = new Set(fresh.mastered.map((m) => m.key))
    const newItems = teachItems.filter((it) => !it.isReview)
    const queue = newItems.filter((it) => !masteredKeys.has(itemMatchKey(it)))
    if (queue.length === 0) {
      setPhase('complete')
    } else {
      setCheckQueue(queue)
      setCheckStep(0)
      setPhase('check')
    }
  }

  const advanceTeach = () => {
    if (teachStep + 1 >= teachItems.length) {
      if (node?.done) setPhase('complete')
      else startCheckPhase()
    } else {
      setTeachStep((s) => s + 1)
    }
  }

  const advanceCheck = () => {
    if (!currentItem) return
    const key = itemMatchKey(currentItem)
    if (!checkMarkedRef.current.has(key)) {
      checkMarkedRef.current.add(key)
      markMastered(currentItem.category, currentItem.label)
    }
    if (checkStep + 1 >= checkQueue.length) {
      setPhase('complete')
    } else {
      setCheckStep((s) => s + 1)
    }
  }

  const handleChoiceClick = (choice: string) => {
    if (!currentItem || choiceFeedback === 'correct') return
    setSelectedChoice(choice)
    if (choice === currentItem.label) {
      setChoiceFeedback('correct')
      window.setTimeout(advanceCheck, 550)
    } else {
      setChoiceFeedback('incorrect')
    }
  }

  if (isAuthLoading || !user || isReferencesLoading || !levelPath || !node || locked) {
    return (
      <Card>
        <p style={{ color: '#6B7290', fontSize: 13 }}>레슨을 불러오는 중...</p>
      </Card>
    )
  }

  if (phase === 'complete') {
    return (
      <Card>
        <CompleteWrap>
          <CompleteEmoji>🎉</CompleteEmoji>
          <Title>레슨 {node.index} 완료!</Title>
          <p style={{ color: '#6B7290', fontSize: 13, marginBottom: 20 }}>
            새 항목 {node.newCount}개를 학습했어요.
          </p>
          <Button style={{ width: '100%' }} onClick={() => navigate('/path')}>
            학습 경로로 돌아가기
          </Button>
        </CompleteWrap>
      </Card>
    )
  }

  const status: 'idle' | 'correct' | 'incorrect' = !hasReference
    ? 'idle'
    : isWordItem
      ? wordAttempt
        ? wordAttempt.isMatch
          ? 'correct'
          : 'incorrect'
        : 'idle'
      : !hasHand
        ? 'idle'
        : staticIsMatch
          ? 'correct'
          : 'incorrect'

  const statusText = isModelLoading
    ? '모델 로딩 중...'
    : modelError
      ? modelError
      : !hasReference
        ? '레퍼런스 없음'
        : isWordItem
          ? motion.isRecording
            ? `녹화 중... (${motion.sequence.length}프레임)`
            : wordAttempt
              ? `일치도 ${wordAttempt.score}%`
              : '녹화 버튼을 눌러 시작'
          : !hasHand
            ? '손을 카메라에 보여주세요'
            : `일치도 ${staticScore}%`

  const stepIndex = phase === 'teach' ? teachStep : checkStep
  const stepTotal = phase === 'teach' ? teachItems.length : checkQueue.length
  const pct = stepTotal > 0 ? ((stepIndex + 1) / stepTotal) * 100 : 0

  return (
    <>
      <PhaseBadge $phase={phase}>{phase === 'teach' ? '배우기' : '확인'}</PhaseBadge>
      <Title>
        레슨 {node.index} · {stepIndex + 1} / {stepTotal}
      </Title>
      <ProgressTrack>
        <ProgressFill $pct={pct} />
      </ProgressTrack>

      {currentItem && phase === 'teach' && (
        <>
          <WordPrompt>
            "{currentItem.label}"
            {currentItem.isReview && <span style={{ fontSize: 13, color: '#6B7290' }}> (복습)</span>}
          </WordPrompt>

          <CompareGrid>
            <div>
              <PanelLabel>가이드</PanelLabel>
              {animationSignId ? (
                <SignAnimationPlayer signId={animationSignId} label={currentItem.label} />
              ) : hasReference && targets[0] ? (
                <StaticHandGuide vector={targets[0].vector} label={currentItem.label} />
              ) : (
                <Card>
                  <p style={{ color: '#6B7290', fontSize: 13 }}>이 항목의 레퍼런스가 없습니다.</p>
                </Card>
              )}
            </div>
            <div>
              <PanelLabel>내 카메라</PanelLabel>
              <HandCameraPanel
                videoRef={videoRef}
                canvasRef={canvasRef}
                isActive={isActive}
                error={error}
                onStart={start}
                statusText={statusText}
                borderStatus={status}
              />
            </div>
          </CompareGrid>

          <Card>
            <HintText>가이드를 보고 따라 해보세요. 맞든 틀리든 "다음"을 누르면 넘어갑니다.</HintText>

            {isWordItem && (
              <Button
                $variant={motion.isRecording ? 'accent' : 'secondary'}
                style={{ width: '100%', marginBottom: 10 }}
                onClick={toggleWordRecording}
                disabled={!isActive || !hasReference}
              >
                {motion.isRecording ? `녹화 중지 & 채점 (${motion.sequence.length})` : '동작 녹화 시작'}
              </Button>
            )}

            <Button style={{ width: '100%' }} onClick={advanceTeach}>
              다음 →
            </Button>
          </Card>
        </>
      )}

      {currentItem && phase === 'check' && (
        <>
          <PanelLabel style={{ textAlign: 'center' }}>이 동작을 보고 뜻을 맞혀보세요</PanelLabel>
          {animationSignId ? (
            <SignAnimationPlayer signId={animationSignId} label="?" />
          ) : hasReference && targets[0] ? (
            <StaticHandGuide vector={targets[0].vector} label="?" />
          ) : (
            <Card>
              <p style={{ color: '#6B7290', fontSize: 13 }}>이 항목의 레퍼런스가 없습니다.</p>
            </Card>
          )}

          <Card style={{ marginTop: 20 }}>
            <QuizQuestion>이 수어는 무슨 뜻일까요?</QuizQuestion>
            <ChoiceGrid>
              {choices.map((choice) => {
                const isCorrectAnswer = choice === currentItem.label
                const isSelected = choice === selectedChoice
                const state: 'idle' | 'correct' | 'wrong' | 'reveal' =
                  choiceFeedback && isCorrectAnswer
                    ? 'correct'
                    : choiceFeedback === 'incorrect' && isSelected
                      ? 'wrong'
                      : 'idle'
                return (
                  <ChoiceButton
                    key={choice}
                    type="button"
                    $state={state}
                    disabled={choiceFeedback === 'correct'}
                    onClick={() => handleChoiceClick(choice)}
                  >
                    {choice}
                  </ChoiceButton>
                )
              })}
            </ChoiceGrid>
            {choiceFeedback === 'incorrect' && (
              <HintText style={{ margin: 0, textAlign: 'center' }}>아쉬워요! 다시 골라보세요.</HintText>
            )}
            {choiceFeedback === 'correct' && (
              <HintText style={{ margin: 0, textAlign: 'center' }}>정답이에요! 다음으로 넘어갑니다...</HintText>
            )}
          </Card>
        </>
      )}
    </>
  )
}
