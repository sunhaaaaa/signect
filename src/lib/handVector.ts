import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

const WRIST = 0
const MIDDLE_MCP = 9

/**
 * Flattens 21 hand landmarks into a 42-dim (x, y) vector, relative to the
 * wrist. Cosine similarity is naturally scale-invariant for uniform zoom, so
 * no explicit scale normalization is applied here — only translation.
 *
 * z is intentionally dropped: MediaPipe's monocular z is noisy, and the
 * AIHub reference dataset (OpenPose-derived) has no z at all — keeping
 * vectors 2D-only means live camera vectors and pre-built reference vectors
 * stay directly comparable.
 *
 * Used for consonant/vowel/number matching, where every reference was
 * captured through this exact function via /dev/capture — live and
 * reference vectors are self-consistent by construction, so this is left
 * untouched rather than switched to the hand-scaled variant below (which
 * would require re-capturing all of them).
 */
export function normalizeLandmarks(landmarks: NormalizedLandmark[]): number[] {
  const wrist = landmarks[WRIST]
  const vector: number[] = []
  for (const point of landmarks) {
    vector.push(point.x - wrist.x, point.y - wrist.y)
  }
  return vector
}

/** Euclidean distance from the wrist to the middle-finger MCP knuckle — a
 * roughly constant "bone length" reference usable to cancel out hand size
 * in pixels, which otherwise varies with camera resolution and the signer's
 * distance from the camera. */
function handSpan(points: { x: number; y: number }[]): number {
  const wrist = points[WRIST]
  const mid = points[MIDDLE_MCP]
  const span = Math.hypot(mid.x - wrist.x, mid.y - wrist.y)
  return span > 1e-6 ? span : 1
}

/**
 * Same as {@link normalizeLandmarks}, but additionally divides by hand span
 * — genuine scale invariance, not just cosine similarity's built-in
 * invariance to a single *uniform* scalar. This matters specifically for
 * word matching: AIHub's studio camera and a learner's webcam put the hand
 * at very different apparent sizes (different resolution, different
 * distance from the lens), and that difference isn't just an overall
 * magnitude change — MediaPipe's per-axis (x/width, y/height) normalization
 * makes it anisotropic, which distorts the hand's shape in vector space
 * unless both sides are re-scaled to a common, hand-intrinsic unit first.
 */
export function normalizeLandmarksScaled(landmarks: NormalizedLandmark[]): number[] {
  const wrist = landmarks[WRIST]
  const span = handSpan(landmarks)
  const vector: number[] = []
  for (const point of landmarks) {
    vector.push((point.x - wrist.x) / span, (point.y - wrist.y) / span)
  }
  return vector
}

/**
 * Horizontally flips a wrist-relative (x, y) vector — negates every x
 * component, keeps y. A left hand's shape and its mirror-image right hand
 * produce vectors related exactly this way, so matching a live vector
 * against both a reference and its mirror makes left/right-handed signers
 * (and camera-mirroring differences) match equally well.
 */
export function mirrorVector(vector: number[]): number[] {
  const mirrored = new Array(vector.length)
  for (let i = 0; i < vector.length; i += 2) {
    mirrored[i] = -vector[i]
    mirrored[i + 1] = vector[i + 1]
  }
  return mirrored
}

export function mirrorSequence(sequence: number[][]): number[][] {
  return sequence.map(mirrorVector)
}

export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return []
  const length = vectors[0].length
  const sum = new Array(length).fill(0)
  for (const vector of vectors) {
    for (let i = 0; i < length; i++) sum[i] += vector[i]
  }
  return sum.map((value) => value / vectors.length)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/** Maps cosine similarity (-1..1) to a 0-100 match score. */
export function similarityToScore(similarity: number): number {
  const clamped = Math.min(1, Math.max(-1, similarity))
  return Math.round(((clamped + 1) / 2) * 100)
}
