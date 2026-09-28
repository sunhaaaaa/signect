export type Point = [number, number]

export interface AnimFrame {
  pose: Point[]
  left: Point[]
  right: Point[]
}

export interface AnimData {
  id: string
  label: string
  fps: number
  frames: AnimFrame[]
}

const animationCache = new Map<string, Promise<AnimData | null>>()

export function fetchAnimation(baseId: string): Promise<AnimData | null> {
  if (!animationCache.has(baseId)) {
    animationCache.set(
      baseId,
      fetch(`/data/animations/${baseId}.json`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    )
  }
  return animationCache.get(baseId)!
}

function isValidPoint([x, y]: Point) {
  return x >= 0 && y >= 0
}

const MIDDLE_MCP = 9

/** Same hand-span concept as handVector.ts's handSpan, over raw pixel points. */
function handSpan(hand: Point[]): number {
  const [wx, wy] = hand[0]
  const [mx, my] = hand[MIDDLE_MCP]
  const span = Math.hypot(mx - wx, my - wy)
  return span > 1e-6 ? span : 1
}

/**
 * Extracts a wrist-relative (x, y) vector sequence for whichever hand has
 * more valid frames — the same "active hand" a live single-hand recording
 * would produce, so the two are directly comparable via DTW. Each frame is
 * also divided by that frame's own hand span (wrist-to-middle-MCP distance)
 * — these points are raw AIHub studio-camera pixel coordinates, an entirely
 * different scale from a learner's own webcam, so without this the DTW
 * comparison in useMotionRecorder was comparing shapes at systematically
 * mismatched (and anisotropically distorted) scales.
 */
export function extractDominantHandSequence(data: AnimData): number[][] {
  let leftValid = 0
  let rightValid = 0
  for (const frame of data.frames) {
    if (isValidPoint(frame.left[0])) leftValid++
    if (isValidPoint(frame.right[0])) rightValid++
  }
  const useLeft = leftValid >= rightValid

  const sequence: number[][] = []
  for (const frame of data.frames) {
    const hand = useLeft ? frame.left : frame.right
    const wrist = hand[0]
    if (!isValidPoint(wrist) || !isValidPoint(hand[MIDDLE_MCP])) continue
    const span = handSpan(hand)
    const vector: number[] = []
    for (const [x, y] of hand) vector.push((x - wrist[0]) / span, (y - wrist[1]) / span)
    sequence.push(vector)
  }
  return sequence
}
