import { useEffect, useState } from 'react'
import { fetchAnimation, extractDominantHandSequence } from '../lib/animationData'

/** Loads a word's real signed motion (from the AIHub animation data) as a DTW-comparable sequence. */
export function useWordMotionReference(signId: string | undefined): number[][] | null {
  const [sequence, setSequence] = useState<number[][] | null>(null)

  useEffect(() => {
    if (!signId) {
      setSequence(null)
      return
    }
    let cancelled = false
    const baseId = signId.replace(/-mirror$/, '')
    setSequence(null)

    fetchAnimation(baseId).then((data) => {
      if (cancelled) return
      setSequence(data ? extractDominantHandSequence(data) : null)
    })

    return () => {
      cancelled = true
    }
  }, [signId])

  return sequence
}
