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
  dp[0][0] = 0

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const c = cost(seqA[i - 1], seqB[j - 1])
      dp[i][j] = c + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  // Normalize by path length (n + m is a standard, cheap approximation of
  // the true optimal path length) to get an average per-step cost.
  const avgCost = dp[n][m] / (n + m)
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
