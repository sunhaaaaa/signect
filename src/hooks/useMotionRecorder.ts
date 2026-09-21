import { useEffect, useRef, useState } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { normalizeLandmarks } from '../lib/handVector'

const MAX_FRAMES = 90 // ~3s at 30fps, a safety cap rather than a fixed window

/**
 * Records a bounded sequence of live hand vectors while active, for DTW
 * comparison against a reference motion — unlike useSignMatch/useSignRecognition,
 * which only ever look at a single current frame.
 */
export function useMotionRecorder(landmarks: NormalizedLandmark[][]) {
  const [isRecording, setIsRecording] = useState(false)
  const [sequence, setSequence] = useState<number[][]>([])
  const bufferRef = useRef<number[][]>([])

  useEffect(() => {
    if (!isRecording || landmarks.length === 0) return
    const vector = normalizeLandmarks(landmarks[0])
    const next = [...bufferRef.current, vector].slice(-MAX_FRAMES)
    bufferRef.current = next
    setSequence(next)
  }, [landmarks, isRecording])

  const start = () => {
    bufferRef.current = []
    setSequence([])
    setIsRecording(true)
  }

  const stop = () => setIsRecording(false)

  const reset = () => {
    bufferRef.current = []
    setSequence([])
    setIsRecording(false)
  }

  return { isRecording, sequence, start, stop, reset }
}
