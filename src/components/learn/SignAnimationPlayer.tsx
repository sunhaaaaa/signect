import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { HAND_CONNECTIONS } from '../../lib/handConnections'
import { POSE_CONNECTIONS } from '../../lib/poseConnections'
import { fetchAnimation, type AnimData, type AnimFrame, type Point } from '../../lib/animationData'

type Status = 'loading' | 'ready' | 'empty'
type Transform = (x: number, y: number) => Point

const CANVAS_SIZE = { width: 480, height: 360 }
const PADDING_RATIO = 0.18

/** Fits every point across every frame into the canvas, once, so playback doesn't jitter/rescale. */
function computeTransform(frames: AnimFrame[]): Transform | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const frame of frames) {
    for (const group of [frame.pose, frame.left, frame.right]) {
      for (const [x, y] of group) {
        if (x < 0 || y < 0) continue
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (!Number.isFinite(minX)) return null

  const boxW = maxX - minX || 1
  const boxH = maxY - minY || 1
  const padX = boxW * PADDING_RATIO
  const padY = boxH * PADDING_RATIO
  const w = boxW + padX * 2
  const h = boxH + padY * 2
  const scale = Math.min(CANVAS_SIZE.width / w, CANVAS_SIZE.height / h)
  const offsetX = (CANVAS_SIZE.width - w * scale) / 2 - (minX - padX) * scale
  const offsetY = (CANVAS_SIZE.height - h * scale) / 2 - (minY - padY) * scale

  return (x, y) => [x * scale + offsetX, y * scale + offsetY]
}

function drawGroup(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  connections: [number, number][],
  transform: Transform,
  color: string,
) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3
  for (const [a, b] of connections) {
    const [ax, ay] = points[a]
    const [bx, by] = points[b]
    if (ax < 0 || ay < 0 || bx < 0 || by < 0) continue
    const [x1, y1] = transform(ax, ay)
    const [x2, y2] = transform(bx, by)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  for (const [x, y] of points) {
    if (x < 0 || y < 0) continue
    const [cx, cy] = transform(x, y)
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

const Box = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: #0d1020;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Canvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
`

const Placeholder = styled.p`
  color: #9aa0c3;
  font-size: 13px;
  padding: 0 20px;
  text-align: center;
`

const PlayButton = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.14);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
`

/** Plays back a recorded sign as a looping skeleton animation — the dataset has no raw video. */
export function SignAnimationPlayer({ signId, label }: { signId: string; label: string }) {
  const baseId = signId.replace(/-mirror$/, '')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const transformRef = useRef<Transform | null>(null)
  const frameIndexRef = useRef(0)
  const lastTimeRef = useRef(0)
  const rafRef = useRef(0)

  const [data, setData] = useState<AnimData | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setData(null)
    frameIndexRef.current = 0

    fetchAnimation(baseId).then((result) => {
      if (cancelled) return
      if (!result || result.frames.length === 0) {
        setStatus('empty')
        return
      }
      transformRef.current = computeTransform(result.frames)
      setData(result)
      setStatus('ready')
    })

    return () => {
      cancelled = true
    }
  }, [baseId])

  useEffect(() => {
    if (!data || status !== 'ready' || !isPlaying) return
    const canvas = canvasRef.current
    const transform = transformRef.current
    if (!canvas || !transform) return

    canvas.width = CANVAS_SIZE.width
    canvas.height = CANVAS_SIZE.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frameDuration = 1000 / (data.fps || 30)
    lastTimeRef.current = performance.now()

    const loop = (time: number) => {
      if (time - lastTimeRef.current >= frameDuration) {
        lastTimeRef.current = time
        frameIndexRef.current = (frameIndexRef.current + 1) % data.frames.length

        const frame = data.frames[frameIndexRef.current]
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawGroup(ctx, frame.pose, POSE_CONNECTIONS, transform, '#5B5FEF')
        drawGroup(ctx, frame.left, HAND_CONNECTIONS, transform, '#E8A33D')
        drawGroup(ctx, frame.right, HAND_CONNECTIONS, transform, '#12A88D')
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(rafRef.current)
  }, [data, status, isPlaying])

  return (
    <Box>
      {status === 'loading' && <Placeholder>"{label}" 시범 동작을 불러오는 중...</Placeholder>}
      {status === 'empty' && <Placeholder>이 단어의 시범 동작이 아직 없습니다.</Placeholder>}
      <Canvas ref={canvasRef} style={{ display: status === 'ready' ? 'block' : 'none' }} />
      {status === 'ready' && (
        <PlayButton onClick={() => setIsPlaying((p) => !p)}>{isPlaying ? '일시정지' : '재생'}</PlayButton>
      )}
    </Box>
  )
}
