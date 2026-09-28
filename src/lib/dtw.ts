import { cosineSimilarity, mirrorSequence, similarityToScore } from './handVector'

/**
 * Dynamic Time Warping between two sequences of hand vectors. Unlike a
 * single averaged vector, this compares the actual motion path — needed for
 * signs where the movement itself (not just one held hand shape) carries
 * the meaning. Sequences don't need to be the same length or speed; DTW
 * finds the best alignment between them.
 */
export function dtwAlignedSimilarity(seqA: number[][], seqB: number[][]): number {
  const n = seqA.length
  const m = seqB.length
  if (n === 0 || m === 0) return 0

  const cost = (a: number[], b: number[]) => 1 - cosineSimilarity(a, b)

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity))
  // Tracks the actual number of steps taken to reach dp[i][j], since the
  // optimal warping path's real length varies (anywhere from max(n,m) to
  // n+m-1 depending on how much diagonal-stepping it uses) — dividing by a
  // fixed n+m systematically under-counts steps and inflates the average
  // similarity, more so for attempts whose length differs from the
  // reference's.
  const steps: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  dp[0][0] = 0

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const c = cost(seqA[i - 1], seqB[j - 1])
      const candidates: [number, number][] = [
        [dp[i - 1][j], steps[i - 1][j]],
        [dp[i][j - 1], steps[i][j - 1]],
        [dp[i - 1][j - 1], steps[i - 1][j - 1]],
      ]
      let best = candidates[0]
      for (const candidate of candidates) if (candidate[0] < best[0]) best = candidate
      dp[i][j] = c + best[0]
      steps[i][j] = best[1] + 1
    }
  }

  const avgCost = dp[n][m] / steps[n][m]
  const avgSimilarity = 1 - avgCost
  return avgSimilarity
}

/**
 * Maps a DTW-aligned average similarity to the same 0-100 score used
 * elsewhere. Checks seqB's mirror image too and keeps whichever aligns
 * better, so left/right-handed signers score the same.
 */
export function dtwScore(seqA: number[][], seqB: number[][]): number {
  const direct = dtwAlignedSimilarity(seqA, seqB)
  const mirrored = dtwAlignedSimilarity(seqA, mirrorSequence(seqB))
  return similarityToScore(Math.max(direct, mirrored))
}
