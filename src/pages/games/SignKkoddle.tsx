import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { GameShell } from './GameShell'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { HandCameraPanel } from '../../components/learn/HandCameraPanel'
import { useWebcam } from '../../hooks/useWebcam'
import { useHandTracking } from '../../hooks/useHandTracking'
import { useSignReferences } from '../../hooks/useSignReferences'
import { useSignRecognition } from '../../hooks/useSignRecognition'
import { useStudyTimer } from '../../hooks/useStudyTimer'
import { recordKkoddleWin } from '../../lib/progressStore'
import { evaluateGuess, pickRandomWord, pickWordForSeed, todayKey, type TileState } from '../../lib/wordle'
import { decomposeWord } from '../../lib/hangul'

const MAX_ATTEMPTS = 6
const JAMO_LENGTH = 6 // e.g. "간편" → ㄱ,ㅏ,ㄴ,ㅍ,ㅕ,ㄴ (6) — words are picked so the total comes to exactly this

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${JAMO_LENGTH}, 44px);
  gap: 6px;
  margin: 0 auto;
  justify-content: center;
`

const Tile = styled.div<{ $state?: TileState; $pending?: boolean }>`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 17px;
  color: ${({ $state, theme }) => ($state ? 'white' : theme.colors.text)};
  background: ${({ $state, $pending, theme }) =>
    $state === 'correct'
      ? theme.colors.accent
      : $state === 'present'
        ? '#E8A33D'
        : $state === 'absent'
          ? '#B7BAD1'
          : $pending
            ? theme.colors.gold
            : theme.colors.surface};
  border: 3px solid ${({ theme }) => theme.colors.outline};
`

const Legend = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`

const LegendSwatch = styled.span<{ $color: string }>`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid ${({ theme }) => theme.colors.outline};
  background: ${({ $color }) => $color};
`

const Message = styled.p<{ $tone: 'error' | 'success' | 'muted' }>`
  text-align: center;
  font-size: 15px;
  margin: 10px 0 0;
  color: ${({ theme, $tone }) =>
    $tone === 'error' ? theme.colors.error : $tone === 'success' ? theme.colors.accent : theme.colors.textMuted};
`

const AttemptCount = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  display: block;
  text-align: center;
  margin-top: 12px;
`

const RecognitionRow = styled.div`
  display: flex;
  gap: 8px;
`

function tokensEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((t, i) => t === b[i])
}

export default function SignKkoddle() {
  useStudyTimer()
  const { references, isLoading } = useSignReferences()

  const wordPool = useMemo(() => {
    const labels = Array.from(new Set(references.filter((r) => r.category === 'word').map((r) => r.label)))
    return labels.filter((w) => decomposeWord(w)?.length === JAMO_LENGTH)
  }, [references])

  const letterRefs = useMemo(
    () => references.filter((r) => r.category === 'consonant' || r.category === 'vowel'),
    [references],
  )

  const [target, setTarget] = useState('')
  const [guesses, setGuesses] = useState<string[][]>([])
  const [currentGuess, setCurrentGuess] = useState<string[]>([])
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' | 'muted' } | null>(null)

  useEffect(() => {
    if (wordPool.length > 0 && !target) {
      setTarget(pickWordForSeed(wordPool, todayKey()))
    }
  }, [wordPool, target])

  const targetTokens = useMemo(() => decomposeWord(target) ?? [], [target])

  const isWin = guesses.some((g) => tokensEqual(g, targetTokens))
  const isLose = !isWin && guesses.length >= MAX_ATTEMPTS
  const isOver = isWin || isLose

  const wonRef = useRef(false)
  useEffect(() => {
    if (isWin && !wonRef.current) {
      wonRef.current = true
      recordKkoddleWin()
    }
  }, [isWin])

  const { videoRef, isActive, error, start } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { landmarks, isModelLoading, modelError } = useHandTracking(videoRef, canvasRef, isActive)
  const { label: recognizedJamo, score: recognizedScore, isConfident } = useSignRecognition(
    landmarks,
    letterRefs,
  )

  const canFillMore = !isOver && currentGuess.length < JAMO_LENGTH

  const commitRecognizedJamo = () => {
    if (!canFillMore || !recognizedJamo) return
    setCurrentGuess((prev) => [...prev, recognizedJamo])
    setMessage(null)
  }

  const undoLast = () => {
    setCurrentGuess((prev) => prev.slice(0, -1))
    setMessage(null)
  }

  const submitGuess = () => {
    if (isOver) return
    if (currentGuess.length !== JAMO_LENGTH) {
      setMessage({ text: `지문자 ${JAMO_LENGTH}개를 다 채운 뒤 확인을 누르세요`, tone: 'error' })
      return
    }
    setGuesses((prev) => [...prev, currentGuess])
    setCurrentGuess([])
    setMessage(null)
  }

  const newGame = () => {
    setTarget(pickRandomWord(wordPool, target))
    setGuesses([])
    setCurrentGuess([])
    setMessage(null)
    wonRef.current = false
  }

  const rows = Array.from({ length: MAX_ATTEMPTS }, (_, i) => guesses[i] ?? (i === guesses.length ? currentGuess : null))

  const statusText = isModelLoading
    ? '모델 로딩 중...'
    : modelError
      ? modelError
      : letterRefs.length === 0
        ? '지문자 레퍼런스 없음'
        : recognizedJamo
          ? `인식됨: ${recognizedJamo} (${recognizedScore}%)`
          : '손을 보여주세요'

  return (
    <GameShell
      title="수어 꼬들"
      actions={
        <Button $variant="secondary" onClick={newGame} disabled={wordPool.length === 0}>
          새 단어로 다시하기
        </Button>
      }
      board={
        <div>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#6B7290', fontSize: 13 }}>단어 데이터를 불러오는 중...</p>
          ) : wordPool.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6B7290', fontSize: 13 }}>
              사용할 수 있는 단어가 없습니다.
            </p>
          ) : (
            <>
              <Legend>
                <LegendItem>
                  <LegendSwatch $color="#12A88D" />
                  초록 = 정답 (정확한 위치)
                </LegendItem>
                <LegendItem>
                  <LegendSwatch $color="#E8A33D" />
                  노랑 = 다른 자리에 있음
                </LegendItem>
                <LegendItem>
                  <LegendSwatch $color="#B7BAD1" />
                  회색 = 없는 지문자
                </LegendItem>
              </Legend>

              {rows.map((rowTokens, r) => {
                const isSubmitted = r < guesses.length
                const tiles = isSubmitted && rowTokens ? evaluateGuess(rowTokens, targetTokens) : null
                return (
                  <Grid key={r} style={{ marginBottom: 8 }}>
                    {Array.from({ length: JAMO_LENGTH }).map((_, c) => (
                      <Tile
                        key={c}
                        $state={tiles?.[c]}
                        $pending={!isSubmitted && !!rowTokens && c < rowTokens.length}
                      >
                        {rowTokens ? (rowTokens[c] ?? '') : ''}
                      </Tile>
                    ))}
                  </Grid>
                )
              })}

              {message && <Message $tone={message.tone}>{message.text}</Message>}
              {isWin && <Message $tone="success">🎉 정답입니다! "{target}"</Message>}
              {isLose && <Message $tone="error">아쉬워요, 정답은 "{target}" 였습니다.</Message>}
              <AttemptCount>
                {guesses.length} / {MAX_ATTEMPTS}번 시도 · 매일 자정에 새 단어로 초기화됩니다
              </AttemptCount>
            </>
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
        />
      }
    >
      <div style={{ marginTop: 16 }}>
        <Card>
          <strong>지문자로 한 칸씩 입력</strong>
          <p style={{ color: '#6B7290', fontSize: 13, margin: '8px 0 12px' }}>
            {letterRefs.length === 0
              ? '지문자 손 모양 레퍼런스가 없습니다. /dev/capture 에서 ID "consonant-ㄱ" ~ "vowel-ㅣ"로 녹화해 추가하세요.'
              : `카메라에 지문자를 보여주고 입력하세요. 현재 ${currentGuess.length}/${JAMO_LENGTH}칸 채움.`}
          </p>
          <RecognitionRow>
            <Button style={{ flex: 2 }} disabled={!canFillMore || !isConfident} onClick={commitRecognizedJamo}>
              {recognizedJamo ? `"${recognizedJamo}" 입력하기` : '지문자 인식 대기 중'}
            </Button>
            <Button $variant="secondary" style={{ flex: 1 }} disabled={currentGuess.length === 0} onClick={undoLast}>
              지우기
            </Button>
          </RecognitionRow>
          <Button
            style={{ width: '100%', marginTop: 8 }}
            $variant="accent"
            disabled={isOver || currentGuess.length !== JAMO_LENGTH}
            onClick={submitGuess}
          >
            이 줄 확인
          </Button>
        </Card>
      </div>
    </GameShell>
  )
}
