import { useEffect, useRef, useState } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { normalizeLandmarks } from '../lib/handVector'
import { findBestMatch, DEFAULT_MATCH_THRESHOLD } from '../lib/signMatcher'
import type { SignReference } from '../types/sign'

const SMOOTHING_WINDOW = 5

export interface SignMatchResult {
  score: number
  isMatch: boolean
  hasHand: boolean
}

/**
 * Matches live hand landmarks against every reference variant for the
 * current target word (e.g. original + mirrored) and keeps the best score.
 */
export function useSignMatch(
  landmarks: NormalizedLandmark[][],
  targets: SignReference[],
  threshold = DEFAULT_MATCH_THRESHOLD,
): SignMatchResult {
  const historyRef = useRef<number[]>([])
  const [result, setResult] = useState<SignMatchResult>({
    score: 0,
    isMatch: false,
    hasHand: false,
  })

  useEffect(() => {
    if (targets.length === 0 || landmarks.length === 0) {
      historyRef.current = []
      setResult({ score: 0, isMatch: false, hasHand: landmarks.length > 0 })
      return
    }

    const liveVector = normalizeLandmarks(landmarks[0])
    const { score } = findBestMatch(liveVector, targets, threshold)

    const history = [...historyRef.current, score].slice(-SMOOTHING_WINDOW)
    historyRef.current = history
    const smoothed = Math.round(history.reduce((sum, value) => sum + value, 0) / history.length)

    setResult({ score: smoothed, isMatch: smoothed >= threshold, hasHand: true })
  }, [landmarks, targets, threshold])

  return result
}
