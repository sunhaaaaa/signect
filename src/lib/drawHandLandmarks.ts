import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { HAND_CONNECTIONS } from './handConnections'

export function drawHandLandmarks(canvas: HTMLCanvasElement, hands: NormalizedLandmark[][]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const points of hands) {
    ctx.strokeStyle = '#5B5FEF'
    ctx.lineWidth = 3
    for (const [a, b] of HAND_CONNECTIONS) {
      const p1 = points[a]
      const p2 = points[b]
      ctx.beginPath()
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height)
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height)
      ctx.stroke()
    }

    ctx.fillStyle = '#12A88D'
    for (const p of points) {
      ctx.beginPath()
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
