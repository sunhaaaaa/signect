import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { HAND_CONNECTIONS } from '../../lib/handConnections'

const CANVAS_SIZE = { width: 320, height: 320 }
const PADDING_RATIO = 0.22

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
  width: auto;
  height: 100%;
  max-width: 100%;
  transform: scaleX(-1);
`

const Caption = styled.span`
  position: absolute;
  bottom: 10px;
  left: 12px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.12);
  color: #d7d9f5;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
`

/**
 * Renders a captured static hand-shape reference (from /dev_capture, wrist-
 * relative 42-dim vector) as a single skeleton pose — the "video" for a
 * static sign, since there's no motion to play back.
 */
export function StaticHandGuide({ vector, label }: { vector: number[]; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || vector.length < 42) return

    canvas.width = CANVAS_SIZE.width
    canvas.height = CANVAS_SIZE.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const points: [number, number][] = []
    for (let i = 0; i < 21; i++) points.push([vector[i * 2], vector[i * 2 + 1]])

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of points) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
    const boxW = maxX - minX || 1
    const boxH = maxY - minY || 1
    const padX = boxW * PADDING_RATIO
    const padY = boxH * PADDING_RATIO
    const w = boxW + padX * 2
    const h = boxH + padY * 2
    const scale = Math.min(CANVAS_SIZE.width / w, CANVAS_SIZE.height / h)
    const offsetX = (CANVAS_SIZE.width - w * scale) / 2 - (minX - padX) * scale
    const offsetY = (CANVAS_SIZE.height - h * scale) / 2 - (minY - padY) * scale
    const transform = (x: number, y: number): [number, number] => [x * scale + offsetX, y * scale + offsetY]

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#5B5FEF'
    ctx.fillStyle = '#12A88D'
    ctx.lineWidth = 4

    for (const [a, b] of HAND_CONNECTIONS) {
      const [x1, y1] = transform(points[a][0], points[a][1])
      const [x2, y2] = transform(points[b][0], points[b][1])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    for (const [x, y] of points) {
      const [cx, cy] = transform(x, y)
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [vector])

  return (
    <Box>
      <Canvas ref={canvasRef} />
      <Caption>"{label}" 기준 손 모양</Caption>
    </Box>
  )
}
