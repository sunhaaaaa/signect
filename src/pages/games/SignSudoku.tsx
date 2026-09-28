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
import { recordSudokuClear } from '../../lib/progressStore'
import { generateSolvedGrid, makePuzzle, isBoardComplete, type Difficulty, type Grid } from '../../lib/sudoku'

function createGame(difficulty: Difficulty) {
  const solution = generateSolvedGrid()
  const puzzle = makePuzzle(solution, difficulty)
  return { solution, puzzle, board: puzzle.map((row) => [...row]) }
}

const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
`

const Cell = styled.button<{
  $given: boolean
  $selected: boolean
  $wrong: boolean
  $thickRight: boolean
  $thickBottom: boolean
}>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 15px;
  color: ${({ $given, $wrong, theme }) =>
    $wrong ? theme.colors.error : $given ? theme.colors.text : theme.colors.primaryDark};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.gold : theme.colors.surface)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-right-width: ${({ $thickRight }) => ($thickRight ? '3px' : '1px')};
  border-bottom-width: ${({ $thickBottom }) => ($thickBottom ? '3px' : '1px')};
  border-right-color: ${({ theme }) => theme.colors.outline};
  border-bottom-color: ${({ theme }) => theme.colors.outline};
`

const Palette = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
  margin-top: 16px;
`

const PaletteCell = styled.button`
  aspect-ratio: 1;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 15px;
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.5;
  }
`

const DifficultyRow = styled.div`
  display: flex;
  gap: 6px;
`

const DifficultyButton = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 11px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme, $active }) => ($active ? theme.colors.gold : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
`

const WinBanner = styled(Card)`
  margin-top: 16px;
  text-align: center;
  border-color: ${({ theme }) => theme.colors.success};
`

const RecognitionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: '쉬움' },
  { key: 'medium', label: '보통' },
  { key: 'hard', label: '어려움' },
]

export default function SignSudoku() {
  useStudyTimer()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [game, setGame] = useState(() => createGame('easy'))
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const { solution, puzzle, board } = game
  const clearedRef = useRef(false)

  const newGame = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty)
    setGame(createGame(nextDifficulty))
    setSelected(null)
    clearedRef.current = false
  }

  const setCell = (row: number, col: number, value: number) => {
    if (puzzle[row][col] !== 0) return
    setGame((g) => {
      const nextBoard: Grid = g.board.map((r) => [...r])
      nextBoard[row][col] = value
      return { ...g, board: nextBoard }
    })
  }

  const isWin = useMemo(() => isBoardComplete(board, solution), [board, solution])

  useEffect(() => {
    if (isWin && !clearedRef.current) {
      clearedRef.current = true
      recordSudokuClear()
    }
  }, [isWin])

  const { videoRef, isActive, error, start } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { landmarks, isModelLoading, modelError } = useHandTracking(videoRef, canvasRef, isActive)
  const { references } = useSignReferences()
  const numberRefs = useMemo(() => references.filter((r) => r.category === 'number'), [references])
  const { label: recognizedDigit, score: recognizedScore, isConfident } = useSignRecognition(
    landmarks,
    numberRefs,
  )

  const commitRecognizedDigit = () => {
    if (!selected || !recognizedDigit) return
    const digit = Number(recognizedDigit)
    if (!Number.isNaN(digit) && digit >= 1 && digit <= 9) setCell(selected[0], selected[1], digit)
  }

  const statusText = isModelLoading
    ? '모델 로딩 중...'
    : modelError
      ? modelError
      : numberRefs.length === 0
        ? '숫자 레퍼런스 없음'
        : recognizedDigit
          ? `인식됨: ${recognizedDigit} (${recognizedScore}%)`
          : '손을 보여주세요'

  return (
    <GameShell
      title="지숫자 스도쿠"
      actions={
        <DifficultyRow>
          {DIFFICULTIES.map((d) => (
            <DifficultyButton key={d.key} $active={difficulty === d.key} onClick={() => newGame(d.key)}>
              {d.label}
            </DifficultyButton>
          ))}
        </DifficultyRow>
      }
      board={
        <>
          <BoardGrid>
            {board.map((row, r) =>
              row.map((value, c) => {
                const given = puzzle[r][c] !== 0
                const wrong = value !== 0 && value !== solution[r][c]
                return (
                  <Cell
                    key={`${r}-${c}`}
                    $given={given}
                    $selected={selected?.[0] === r && selected?.[1] === c}
                    $wrong={wrong}
                    $thickRight={c === 2 || c === 5}
                    $thickBottom={r === 2 || r === 5}
                    disabled={given}
                    onClick={() => setSelected([r, c])}
                  >
                    {value !== 0 ? value : ''}
                  </Cell>
                )
              }),
            )}
          </BoardGrid>
          <Palette>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <PaletteCell
                key={n}
                disabled={!selected}
                onClick={() => selected && setCell(selected[0], selected[1], n)}
              >
                {n}
              </PaletteCell>
            ))}
            <PaletteCell disabled={!selected} onClick={() => selected && setCell(selected[0], selected[1], 0)}>
              ✕
            </PaletteCell>
          </Palette>
          {isWin && <WinBanner>🎉 완성했습니다! 다른 난이도로 다시 도전해보세요.</WinBanner>}
        </>
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
          <strong>손 모양으로 입력</strong>
          <p style={{ color: '#6B7290', fontSize: 13, margin: '8px 0 12px' }}>
            {numberRefs.length === 0
              ? '숫자 손 모양 레퍼런스가 없습니다. /dev/capture 에서 ID "number-1" ~ "number-9"로 녹화해 추가하세요.'
              : '칸을 먼저 선택한 뒤, 카메라에 숫자 손 모양을 보여주고 입력 버튼을 누르세요.'}
          </p>
          <RecognitionRow>
            <Button
              style={{ flex: 1 }}
              disabled={!selected || !isConfident}
              onClick={commitRecognizedDigit}
            >
              {recognizedDigit ? `"${recognizedDigit}" 입력하기` : '숫자 인식 대기 중'}
            </Button>
          </RecognitionRow>
        </Card>
      </div>
    </GameShell>
  )
}
