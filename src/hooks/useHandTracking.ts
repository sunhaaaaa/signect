import { useEffect, useRef, useState, type RefObject } from 'react'
import type { HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { loadHandLandmarker } from '../lib/handLandmarker'
import { drawHandLandmarks } from '../lib/drawHandLandmarks'

export interface HandTrackingResult {
  landmarks: NormalizedLandmark[][]
  handedness: string[]
}

export function useHandTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  isActive: boolean,
) {
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [modelError, setModelError] = useState<string | null>(null)
  const [result, setResult] = useState<HandTrackingResult>({ landmarks: [], handedness: [] })
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    loadHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return
        landmarkerRef.current = landmarker
        setIsModelLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setModelError('손 인식 모델을 불러오지 못했습니다.')
        setIsModelLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (!isActive || isModelLoading || modelError || !video || !landmarker) {
      return
    }

    const loop = () => {
      if (video.readyState >= 2) {
        const detection = landmarker.detectForVideo(video, performance.now())
        setResult({
          landmarks: detection.landmarks,
          handedness: detection.handednesses.map((h) => h[0]?.categoryName ?? ''),
        })

        const canvas = canvasRef.current
        if (canvas) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }
          drawHandLandmarks(canvas, detection.landmarks)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(rafRef.current)
  }, [isActive, isModelLoading, modelError, videoRef, canvasRef])

  useEffect(() => {
    if (!isActive) {
      setResult({ landmarks: [], handedness: [] })
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [isActive, canvasRef])

  return { ...result, isModelLoading, modelError }
}
