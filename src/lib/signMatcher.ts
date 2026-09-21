import { cosineSimilarity, euclideanDistance, mirrorVector, similarityToScore } from './handVector'
import type { SignReference } from '../types/sign'

export const DEFAULT_MATCH_THRESHOLD = 88

export interface MatchResult {
  score: number
  distance: number
  isMatch: boolean
}

/**
 * Scores a live vector against a reference AND its mirror image, keeping
 * whichever is closer — so a left-handed signer (or the opposite hand from
 * whoever recorded the reference) matches just as well as the original.
 */
export function matchAgainstReference(
  liveVector: number[],
  reference: SignReference,
  threshold = DEFAULT_MATCH_THRESHOLD,
): MatchResult {
  const direct = cosineSimilarity(liveVector, reference.vector)
  const mirrored = cosineSimilarity(liveVector, mirrorVector(reference.vector))
  const bestSimilarity = Math.max(direct, mirrored)

  const score = similarityToScore(bestSimilarity)
  const distance =
    mirrored > direct
      ? euclideanDistance(liveVector, mirrorVector(reference.vector))
      : euclideanDistance(liveVector, reference.vector)
  return { score, distance, isMatch: score >= threshold }
}

export interface BestMatch extends MatchResult {
  reference: SignReference | null
}

export function findBestMatch(
  liveVector: number[],
  references: SignReference[],
  threshold = DEFAULT_MATCH_THRESHOLD,
): BestMatch {
  let best: BestMatch = { reference: null, score: 0, distance: Infinity, isMatch: false }
  for (const reference of references) {
    const result = matchAgainstReference(liveVector, reference, threshold)
    if (result.score > best.score) {
      best = { ...result, reference }
    }
  }
  return best
}
