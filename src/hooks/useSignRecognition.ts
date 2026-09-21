import { useEffect, useRef, useState } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { normalizeLandmarks } from '../lib/handVector'
import { findBestMatch, DEFAULT_MATCH_THRESHOLD } from '../lib/signMatcher'
import type { SignReference } from '../types/sign'

const SMOOTHING_WINDOW = 5

export interface SignRecognitionResult {
  label: string | null
  score: number
  isConfident: boolean
}

/**
 * Classifies live hand landmarks against a set of candidates (e.g. all captured
 * digit signs) and returns whichever label matches best — unlike useSignMatch,
 * there's no single fixed target to verify against, just "what am I holding up?".
 * Smoothed with a majority vote over the last few frames to reduce flicker.
 */
export function useSignRecognition(
  landmarks: NormalizedLandmark[][],
  candidates: SignReference[],
  threshold = DEFAULT_MATCH_THRESHOLD,
): SignRecognitionResult {
  const historyRef = useRef<{ label: string; score: number }[]>([])
  const [result, setResult] = useState<SignRecognitionResult>({
    label: null,
    score: 0,
    isConfident: false,
  })

  useEffect(() => {
    if (candidates.length === 0 || landmarks.length === 0) {
      historyRef.current = []
      setResult({ label: null, score: 0, isConfident: false })
      return
    }

    const liveVector = normalizeLandmarks(landmarks[0])
    const best = findBestMatch(liveVector, candidates, threshold)
    if (!best.reference) {
      setResult({ label: null, score: 0, isConfident: false })
      return
    }

    const history = [...historyRef.current, { label: best.reference.label, score: best.score }].slice(
      -SMOOTHING_WINDOW,
    )
    historyRef.current = history

    const voteCounts = new Map<string, number>()
    for (const h of history) voteCounts.set(h.label, (voteCounts.get(h.label) ?? 0) + 1)
    const topLabel = Array.from(voteCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
    const topScores = history.filter((h) => h.label === topLabel).map((h) => h.score)
    const avgScore = Math.round(topScores.reduce((sum, s) => sum + s, 0) / topScores.length)

    setResult({ label: topLabel, score: avgScore, isConfident: avgScore >= threshold })
  }, [landmarks, candidates, threshold])

  return result
}
