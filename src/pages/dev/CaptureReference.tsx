import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useWebcam } from '../../hooks/useWebcam'
import { useHandTracking } from '../../hooks/useHandTracking'
import { useMotionRecorder } from '../../hooks/useMotionRecorder'
import { normalizeLandmarks, averageVectors } from '../../lib/handVector'
import type { SignCategory, SignReference } from '../../types/sign'

const CAPTURE_FRAMES = 30
type CaptureMode = 'static' | 'motion'

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`

const CameraBox = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: #0d1020;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`

const Placeholder = styled.p`
  color: #9aa0c3;
  font-size: 16px;
`

const Field = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
`

const Input = styled.input`
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 16px;
`

const Select = styled.select`
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 16px;
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.border};
  overflow: hidden;
  margin: 12px 0;
`

const ProgressFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => $pct}%;
  height: 100%;
  background: ${({ theme }) => theme.colors.accent};
  transition: width 0.05s linear;
`

const RecordRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 15px;

  &:last-child {
    border-bottom: none;
  }
`

const JsonBox = styled.textarea`
  width: 100%;
  height: 220px;
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
`

const ModeRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`

const ModeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.surface)};
  color: ${({ theme, $active }) => ($active ? 'white' : theme.colors.textMuted)};
`

const categories: { value: SignCategory; label: string }[] = [
  { value: 'consonant', label: '지문자 (자음)' },
  { value: 'vowel', label: '지문자 (모음)' },
  { value: 'number', label: '지숫자' },
  { value: 'word', label: '단어' },
]

export default function CaptureReference() {
  const { videoRef, isActive, error, start } = useWebcam()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { landmarks, isModelLoading } = useHandTracking(videoRef, canvasRef, isActive)

  const [id, setId] = useState('')
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState<SignCategory>('consonant')
  const [mode, setMode] = useState<CaptureMode>('static')
  const [isCapturing, setIsCapturing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [records, setRecords] = useState<SignReference[]>([])
  const bufferRef = useRef<number[][]>([])
  const motion = useMotionRecorder(landmarks)

  // Static mode: hold a pose for CAPTURE_FRAMES and average it into one vector.
  useEffect(() => {
    if (mode !== 'static' || !isCapturing || landmarks.length === 0) return

    bufferRef.current.push(normalizeLandmarks(landmarks[0]))
    setProgress(Math.min(100, Math.round((bufferRef.current.length / CAPTURE_FRAMES) * 100)))

    if (bufferRef.current.length >= CAPTURE_FRAMES) {
      const vector = averageVectors(bufferRef.current)
      bufferRef.current = []
      setIsCapturing(false)
      setProgress(0)
      setRecords((prev) => [...prev.filter((r) => r.id !== id), { id, label, category, vector }])
    }
  }, [mode, landmarks, isCapturing, id, label, category])

  // Motion mode: record a free-form sequence (start/stop), keep the full path for DTW.
  const toggleMotionCapture = () => {
    if (motion.isRecording) {
      motion.stop()
      if (motion.sequence.length >= 5) {
        const vector = averageVectors(motion.sequence)
        setRecords((prev) => [
          ...prev.filter((r) => r.id !== id),
          { id, label, category, vector, sequence: motion.sequence },
        ])
      }
      motion.reset()
    } else {
      motion.start()
    }
  }

  const canCapture = isActive && !isModelLoading && id.trim() !== '' && label.trim() !== ''

  const jsonOutput = JSON.stringify(records, null, 2)

  return (
    <>
      <h1 style={{ fontSize: 22 }}>레퍼런스 캡처 (개발용)</h1>
      <p style={{ color: '#6B7290', fontSize: 13, marginBottom: 20 }}>
        <strong>정지 동작</strong>은 지문자·지숫자처럼 손 모양을 유지하는 신호용입니다 — {CAPTURE_FRAMES}
        프레임을 평균해 벡터 하나를 만듭니다. <strong>움직이는 동작</strong>은 실제로 손이 이동하는 단어용입니다 —
        시작을 누르고 동작을 한 뒤 다시 눌러 멈추면, 전체 궤적을 그대로 저장해 DTW로 비교합니다. 결과 JSON을{' '}
        <code>src/data/signReferences.ts</code>의 <code>signReferences</code> 배열에 붙여넣으세요.
      </p>

      <Grid>
        <div>
          <CameraBox>
            <Video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: isActive ? 'block' : 'none' }}
            />
            {!isActive && <Placeholder>{error ?? '카메라를 시작하세요'}</Placeholder>}
          </CameraBox>
          {!isActive && (
            <Button style={{ marginTop: 12 }} onClick={start}>
              카메라 시작
            </Button>
          )}
        </div>

        <div>
          <Card>
            <ModeRow>
              <ModeButton $active={mode === 'static'} onClick={() => setMode('static')}>
                정지 동작
              </ModeButton>
              <ModeButton $active={mode === 'motion'} onClick={() => setMode('motion')}>
                움직이는 동작
              </ModeButton>
            </ModeRow>

            <Field>
              ID (예: consonant-g)
              <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="consonant-g" />
            </Field>
            <Field>
              표시 이름 (예: ㄱ)
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ㄱ" />
            </Field>
            <Field>
              카테고리
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as SignCategory)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>

            {mode === 'static' ? (
              <>
                {isCapturing && (
                  <ProgressTrack>
                    <ProgressFill $pct={progress} />
                  </ProgressTrack>
                )}
                <Button
                  style={{ width: '100%' }}
                  disabled={!canCapture || isCapturing}
                  onClick={() => setIsCapturing(true)}
                >
                  {isCapturing ? `캡처 중... ${progress}%` : '캡처 시작 (동작 유지)'}
                </Button>
              </>
            ) : (
              <Button
                $variant={motion.isRecording ? 'accent' : 'primary'}
                style={{ width: '100%' }}
                disabled={!canCapture}
                onClick={toggleMotionCapture}
              >
                {motion.isRecording ? `녹화 중지 & 저장 (${motion.sequence.length}프레임)` : '녹화 시작 (동작 수행)'}
              </Button>
            )}
          </Card>

          <div style={{ marginTop: 16 }}>
            <Card>
              <strong>캡처된 레퍼런스 ({records.length})</strong>
              {records.map((r) => (
                <RecordRow key={r.id}>
                  <span>
                    {r.label} ({r.id})
                  </span>
                  <button
                    style={{ color: '#EF4444', background: 'none', border: 'none' }}
                    onClick={() => setRecords((prev) => prev.filter((x) => x.id !== r.id))}
                  >
                    삭제
                  </button>
                </RecordRow>
              ))}
              {records.length > 0 && <JsonBox readOnly value={jsonOutput} />}
            </Card>
          </div>
        </div>
      </Grid>
    </>
  )
}
