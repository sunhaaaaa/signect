import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { GameShell } from './GameShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { HandCameraPanel } from '../../components/learn/HandCameraPanel'
import { SignAnimationPlayer } from '../../components/learn/SignAnimationPlayer'
import { StaticHandGuide } from '../../components/learn/StaticHandGuide'
import { useWebcam } from '../../hooks/useWebcam'
import { useHandTracking } from '../../hooks/useHandTracking'
import { useSignReferences } from '../../hooks/useSignReferences'
import { useWordMotionReference } from '../../hooks/useWordMotionReference'
import { useMotionRecorder } from '../../hooks/useMotionRecorder'
import { useStudyTimer } from '../../hooks/useStudyTimer'
import { dtwScore } from '../../lib/dtw'
import { DEFAULT_MATCH_THRESHOLD } from '../../lib/signMatcher'
import { loadProgress, recordQuizResult } from '../../lib/progressStore'

const ROUNDS = 5

function pickSessionWords(preferred: string[], fallback: string[]): string[] {
  const pool = preferred.length > 0 ? preferred : fallback
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(ROUNDS, shuffled.length))
}

const RoundBadge = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 13px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.gold};
  padding: 6px 10px;
`

const SourceNote = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin: 0 0 16px;
`

const WordPrompt = styled.h3`
  text-align: center;
  font-size: 26px;
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const RecognitionRow = styled.div`
  display: flex;
  gap: 8px;
`

const ResultCard = styled.div`
  text-align: center;
  padding: 24px 12px;
`

const ResultScore = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 44px;
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: 8px;
`

const ResultDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 18px 0;
`

const ResultDot = styled.span<{ $solved: boolean }>`
  width: 20px;
  height: 20px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $solved }) => ($solved ? theme.colors.success : theme.colors.border)};
`

export default function WordQuiz() {
  useStudyTimer()
  const { references, isLoading } = useSignReferences()
  const wordRefs = useMemo(() => references.filter((r) => r.category === 'word'), [references])
  const allLabels = useMemo(() => Array.from(new Set(wordRefs.map((r) => r.label))), [wordRefs])

  const [sessionWords, setSessionWords] = useState<string[]>([])
  const [usedWordList, setUsedWordList] = useState(false)
  const [roundIndex, setRoundIndex] = useState(0)
  const [roundSolved, setRoundSolved] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)

  const startSession = () => {
    const progress = loadProgress()
    const listLabels = progress.wordList.map((w) => w.label).filter((label) => allLabels.includes(label))
    const words = pickSessionWords(listLabels, allLabels)
    setSessionWords(words)
    setUsedWordList(listLabels.length > 0)
    setRoundIndex(0)
    setRoundSolved(words.map(() => false))
    setFinished(false)
  }

  useEffect(() => {
    if (allLabels.length > 0 && sessionWords.length === 0) startSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLabels.length])

  const currentWord = sessionWords[roundIndex]
  const targets = useMemo(
    () => (currentWord ? wordRefs.filter((r) => r.label === currentWord) : []),
    [wordRefs, currentWord],
  )
  const hasReference = targets.length > 0
  const animationSignId = hasReference
    ? (targets.find((t) => !t.id.endsWith('-mirror'))?.id ?? targets[0].id)
    : undefined
  const referenceSequence = useWordMotionReference(animationSignId)

  const { videoRef, isActive, error, start } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { landmarks, isModelLoading, modelError } = useHandTracking(videoRef, canvasRef, isActive)
  const motion = useMotionRecorder(landmarks)
  const [attempt, setAttempt] = useState<{ score: number; isMatch: boolean } | null>(null)

  useEffect(() => {
    setAttempt(null)
    motion.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex])

  const toggleRecording = () => {
    if (motion.isRecording) {
      motion.stop()
      if (motion.sequence.length >= 5 && referenceSequence && referenceSequence.length >= 5) {
        const s = dtwScore(motion.sequence, referenceSequence)
        const matched = s >= DEFAULT_MATCH_THRESHOLD
        setAttempt({ score: s, isMatch: matched })
        recordQuizResult(matched)
        if (matched) {
          setRoundSolved((prev) => prev.map((solved, i) => (i === roundIndex ? true : solved)))
        }
      }
    } else {
      setAttempt(null)
      motion.start()
    }
  }

  const goNext = () => {
    if (roundIndex + 1 >= sessionWords.length) {
      setFinished(true)
    } else {
      setRoundIndex((i) => i + 1)
    }
  }

  const status = attempt ? (attempt.isMatch ? 'correct' : 'incorrect') : 'idle'
  const solvedCount = roundSolved.filter(Boolean).length
  const isLastRound = roundIndex + 1 >= sessionWords.length

  const statusText = isModelLoading
    ? '모델 로딩 중...'
    : modelError
      ? modelError
      : !hasReference
        ? '레퍼런스 없음'
        : motion.isRecording
          ? `녹화 중... (${motion.sequence.length}프레임)`
          : attempt
            ? `일치도 ${attempt.score}%`
            : '녹화 버튼을 눌러 시작'

  if (isLoading) {
    return (
      <GameShell
        title="맞춤형 단어 퀴즈"
        board={<p style={{ textAlign: 'center', color: '#6B7290', fontSize: 13 }}>단어 데이터를 불러오는 중...</p>}
      />
    )
  }

  if (allLabels.length === 0) {
    return (
      <GameShell
        title="맞춤형 단어 퀴즈"
        board={<p style={{ textAlign: 'center', color: '#6B7290', fontSize: 13 }}>사용할 수 있는 단어가 없습니다.</p>}
      />
    )
  }

  if (finished) {
    return (
      <GameShell
        title="맞춤형 단어 퀴즈"
        board={
          <ResultCard>
            <ResultScore>
              {solvedCount} / {sessionWords.length}
            </ResultScore>
            <p style={{ color: '#6B7290', fontSize: 13 }}>
              {usedWordList ? '내 단어장에서 낸 문제였어요.' : '단어장이 비어 있어 전체 단어 중에서 냈어요.'}
            </p>
            <ResultDots>
              {roundSolved.map((solved, i) => (
                <ResultDot key={i} $solved={solved} />
              ))}
            </ResultDots>
            <Button onClick={startSession}>다시 도전하기</Button>
          </ResultCard>
        }
      />
    )
  }

  return (
    <GameShell
      title="맞춤형 단어 퀴즈"
      actions={
        <RoundBadge>
          {roundIndex + 1} / {sessionWords.length}
        </RoundBadge>
      }
      board={
        <div>
          <SourceNote>{usedWordList ? '📖 내 단어장에서 출제' : '🎲 전체 단어 중 무작위 출제'}</SourceNote>
          <WordPrompt>"{currentWord}"</WordPrompt>
          {animationSignId ? (
            <SignAnimationPlayer signId={animationSignId} label={currentWord ?? ''} />
          ) : hasReference && targets[0] ? (
            <StaticHandGuide vector={targets[0].vector} label={currentWord ?? ''} />
          ) : (
            <Card>
              <p style={{ color: '#6B7290', fontSize: 13 }}>이 단어의 레퍼런스가 없습니다.</p>
            </Card>
          )}
        </div>
      }
      camera={
        <HandCameraPanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          isActive={isActive}
          error={error}
          onStart={start}
          statusText={statusText}
          borderStatus={status}
        />
      }
    >
      <div style={{ marginTop: 16 }}>
        <Card>
          <strong>이 단어를 수어로 표현해보세요</strong>
          <p style={{ color: '#6B7290', fontSize: 13, margin: '8px 0 12px' }}>
            가이드 동작을 먼저 확인한 뒤, 카메라를 켜고 &ldquo;동작 녹화 시작&rdquo;을 눌러 따라 해보세요.
          </p>
          <RecognitionRow style={{ marginBottom: 8 }}>
            <Button onClick={start} disabled={isActive} style={{ flex: 1 }}>
              {isActive ? '카메라 켜짐' : '카메라 시작'}
            </Button>
            <Button
              $variant={motion.isRecording ? 'accent' : 'secondary'}
              onClick={toggleRecording}
              disabled={!isActive || !hasReference}
              style={{ flex: 1 }}
            >
              {motion.isRecording ? `녹화 중지 & 채점 (${motion.sequence.length})` : '동작 녹화 시작'}
            </Button>
          </RecognitionRow>
          <Button style={{ width: '100%' }} disabled={!attempt} onClick={goNext}>
            {isLastRound ? '결과 보기 →' : '다음 문제 →'}
          </Button>
        </Card>
      </div>
    </GameShell>
  )
}
