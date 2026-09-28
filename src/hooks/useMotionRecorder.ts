import { useEffect, useRef, useState } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { normalizeLandmarksScaled } from '../lib/handVector'

// requestAnimationFrame drives this (via useHandTracking), so the real rate
// tracks the display's refresh rate (often 60Hz), not a fixed 30fps — sized
// for ~4s of recording at 60fps so longer signs don't get truncated
// mid-motion, which would otherwise corrupt the DTW alignment.
const MAX_FRAMES = 240

/**
 * Records a bounded sequence of live hand vectors while active, for DTW
 * comparison against a reference motion — unlike useSignMatch/useSignRecognition,
 * which only ever look at a single current frame. Uses the hand-scaled
 * normalization (see handVector.ts) so recordings are directly comparable
 * to AIHub-derived word references regardless of the user's camera
 * resolution or distance from it.
 */
export function useMotionRecorder(landmarks: NormalizedLandmark[][]) {
  const [isRecording, setIsRecording] = useState(false)
  const [sequence, setSequence] = useState<number[][]>([])
  const bufferRef = useRef<number[][]>([])

  useEffect(() => {
    if (!isRecording || landmarks.length === 0) return
    const vector = normalizeLandmarksScaled(landmarks[0])
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
