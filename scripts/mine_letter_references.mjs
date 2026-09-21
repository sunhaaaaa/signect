#!/usr/bin/env node
/**
 * ⚠️ VALIDATED RESULT: THIS DOES NOT WORK. Kept for documentation only — do
 * not wire its output into the app. Ran against all 10,000 CROWD clips
 * (2025-09-07): every letter's mean vector came out >99% cosine-similar to
 * every OTHER letter's mean vector (checked pairwise), meaning the "held
 * frame per equal time bin" heuristic below isn't actually landing on
 * distinct per-letter hand shapes — real fluent fingerspelling apparently
 * doesn't have clean, evenly-spaced holds the way this assumes, so the
 * mined samples are closer to random hand poses than to the intended
 * letters, and average out to a generic hand shape regardless of label.
 * A real fix would need proper per-clip motion segmentation (or DTW
 * alignment) rather than blind equal division — not attempted here.
 *
 * Mines individual 지문자 (consonant/vowel fingerspelling) reference vectors
 * out of the AIHub CROWD dataset — WITHOUT anyone having to sign on camera.
 *
 * The CROWD clips are real deaf/KSL signers fingerspelling whole address
 * words letter-by-letter (e.g. "가로수길"), but the morpheme label only
 * covers the whole word — there's no per-letter timing. This script recovers
 * per-letter timing itself:
 *
 *   1. Decompose the word's label into its ordered Hangul jamo (초성/중성/종성)
 *      using the standard Unicode Hangul algorithm — no ML needed, this is
 *      exact. Words containing anything outside the basic 14 consonants /
 *      10 vowels (double consonants, compound vowels, etc.) are skipped.
 *   2. Assume signing pace is roughly even across the clip: divide the clip
 *      into N equal time bins (N = jamo count) and, within each bin, pick
 *      the frame where the hand is moving the LEAST (a "hold" — the moment
 *      a fingerspelled letter is actually being shown, as opposed to the
 *      transition between letters).
 *   3. Pool every (letter -> held-frame vector) sample across all ~10,000
 *      clips, then average per letter. Errors in step 2 are individually
 *      noisy but largely cancel out in aggregate across many words/positions.
 *   4. Report a per-letter "quality" score (average cosine similarity of
 *      each sample to its letter's mean) so weak letters can be spotted and
 *      re-recorded by hand via /dev/capture if needed.
 *
 * This does NOT recover 지숫자 (digits) — digits don't appear in address
 * vocabulary, so there's nothing to mine them from.
 *
 * Usage: node scripts/mine_letter_references.mjs [datasetRoot] [outFile]
 */
import fs from 'node:fs'
import path from 'node:path'

const DATASET_ROOT = process.argv[2] || '/Users/tjsgkdia/Downloads/수어 영상/1.Training'
const OUT_PATH = process.argv[3] || 'public/data/signReferences.letter.json'
const CROWD_FOLDERS = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'))
const CONF_THRESHOLD = 0.3
const WRIST_CONF_MIN = 0.2
const MIN_GOOD_FRAME_RATIO = 0.5
const QUALITY_KEEP_THRESHOLD = 0.4 // drop samples less similar than this to the rough mean, then re-average

const CONSONANTS = new Set(['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'])
const VOWELS = new Set(['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'])

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

function decomposeSyllable(ch) {
  const code = ch.codePointAt(0) - 0xac00
  if (code < 0 || code > 11171) return null
  const cho = Math.floor(code / (21 * 28))
  const jung = Math.floor((code % (21 * 28)) / 28)
  const jong = code % 28
  const tokens = [CHO[cho], JUNG[jung]]
  if (JONG[jong]) tokens.push(JONG[jong])
  return tokens
}

/** Ordered jamo list for a word, or null if it contains anything outside basic 자음/모음. */
function decomposeWordBasic(word) {
  const tokens = []
  for (const ch of word) {
    const syl = decomposeSyllable(ch)
    if (!syl) return null
    for (const t of syl) {
      if (!CONSONANTS.has(t) && !VOWELS.has(t)) return null
      tokens.push(t)
    }
  }
  return tokens
}

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function toPoints(flat, count = 21) {
  const points = []
  for (let i = 0; i < count; i++) {
    points.push({ x: flat?.[i * 3] ?? 0, y: flat?.[i * 3 + 1] ?? 0, c: flat?.[i * 3 + 2] ?? 0 })
  }
  return points
}

function meanConfidence(points) {
  return points.reduce((sum, p) => sum + p.c, 0) / points.length
}

function isGoodFrame(points) {
  return points[0].c >= WRIST_CONF_MIN && meanConfidence(points) >= CONF_THRESHOLD
}

function normalize2D(points) {
  const wrist = points[0]
  const vector = []
  for (const p of points) vector.push(p.x - wrist.x, p.y - wrist.y)
  return vector
}

function handVelocity(prev, cur) {
  let sum = 0
  for (let i = 0; i < prev.length; i++) {
    const dx = cur[i].x - prev[i].x
    const dy = cur[i].y - prev[i].y
    sum += Math.sqrt(dx * dx + dy * dy)
  }
  return sum / prev.length
}

function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function averageVectors(vectors) {
  const length = vectors[0].length
  const sum = new Array(length).fill(0)
  for (const v of vectors) for (let i = 0; i < length; i++) sum[i] += v[i]
  return sum.map((x) => x / vectors.length)
}

/** Mines one clip: N equal bins (N = jamoTokens.length), lowest-velocity frame per bin. */
function mineClip(seqDir, frameFiles, startFrame, endFrame, jamoTokens) {
  const n = endFrame - startFrame + 1
  if (n < jamoTokens.length * 2) return null

  const frames = []
  for (let i = startFrame; i <= endFrame; i++) {
    frames.push(loadJSON(path.join(seqDir, frameFiles[i])))
  }

  let leftGood = 0
  let rightGood = 0
  const leftSeq = []
  const rightSeq = []
  for (const f of frames) {
    const people = f.people
    const l = toPoints(people?.hand_left_keypoints_2d)
    const r = toPoints(people?.hand_right_keypoints_2d)
    leftSeq.push(l)
    rightSeq.push(r)
    if (isGoodFrame(l)) leftGood++
    if (isGoodFrame(r)) rightGood++
  }

  const useLeft = leftGood >= rightGood
  const seq = useLeft ? leftSeq : rightSeq
  const goodCount = useLeft ? leftGood : rightGood
  if (goodCount < n * MIN_GOOD_FRAME_RATIO) return null

  const jamoCount = jamoTokens.length
  const binSize = n / jamoCount
  const results = []

  for (let j = 0; j < jamoCount; j++) {
    const binStart = Math.floor(j * binSize)
    const binEnd = Math.min(n - 1, Math.floor((j + 1) * binSize) - 1)
    if (binEnd <= binStart) continue

    let bestIdx = -1
    let bestVel = Infinity
    for (let i = binStart + 1; i <= binEnd; i++) {
      const cur = seq[i]
      const prev = seq[i - 1]
      if (!isGoodFrame(cur) || !isGoodFrame(prev)) continue
      const vel = handVelocity(prev, cur)
      if (vel < bestVel) {
        bestVel = vel
        bestIdx = i
      }
    }
    if (bestIdx === -1) continue
    results.push({ token: jamoTokens[j], vector: normalize2D(seq[bestIdx]) })
  }
  return results
}

function main() {
  const samplesByToken = new Map()
  let clipsSeen = 0
  let clipsUsable = 0
  let clipsSkippedDecompose = 0
  let clipsSkippedHand = 0

  for (const folder of CROWD_FOLDERS) {
    const morphemeDir = path.join(DATASET_ROOT, 'morpheme', folder)
    const keypointDir = path.join(DATASET_ROOT, '01_crowd_keypoint', folder)
    if (!fs.existsSync(morphemeDir) || !fs.existsSync(keypointDir)) continue

    const files = fs.readdirSync(morphemeDir).filter((f) => f.endsWith('_morpheme.json'))

    for (const file of files) {
      clipsSeen++
      const seqId = file.replace('_morpheme.json', '')
      const morpheme = loadJSON(path.join(morphemeDir, file))
      const entry = morpheme.data?.[0]
      const label = entry?.attributes?.[0]?.name
      const { start, end } = entry ?? {}
      const duration = morpheme.metaData?.duration
      if (!label || start == null || end == null || !duration) continue

      const jamoTokens = decomposeWordBasic(label)
      if (!jamoTokens) {
        clipsSkippedDecompose++
        continue
      }

      const seqDir = path.join(keypointDir, seqId)
      if (!fs.existsSync(seqDir)) continue
      const frameFiles = fs.readdirSync(seqDir).sort()
      if (frameFiles.length === 0) continue

      const fps = frameFiles.length / duration
      const startFrame = Math.max(0, Math.floor(start * fps))
      const endFrame = Math.min(frameFiles.length - 1, Math.ceil(end * fps))

      const results = mineClip(seqDir, frameFiles, startFrame, endFrame, jamoTokens)
      if (!results) {
        clipsSkippedHand++
        continue
      }
      clipsUsable++

      for (const { token, vector } of results) {
        if (!samplesByToken.has(token)) samplesByToken.set(token, [])
        samplesByToken.get(token).push(vector)
      }
    }
    console.log(`  ...folder ${folder} done (clips seen so far: ${clipsSeen})`)
  }

  const results = []
  console.log('\nletter,rawSamples,keptSamples,quality')
  for (const [token, vectors] of samplesByToken.entries()) {
    if (vectors.length < 5) continue
    const roughMean = averageVectors(vectors)
    const kept = vectors.filter((v) => cosineSimilarity(v, roughMean) >= QUALITY_KEEP_THRESHOLD)
    const finalVectors = kept.length >= 5 ? kept : vectors
    const finalMean = averageVectors(finalVectors)
    const quality =
      finalVectors.reduce((sum, v) => sum + cosineSimilarity(v, finalMean), 0) / finalVectors.length

    const category = CONSONANTS.has(token) ? 'consonant' : 'vowel'
    results.push({
      id: `${category}-${token}`,
      label: token,
      category,
      vector: finalMean,
      sampleCount: finalVectors.length,
      quality: Math.round(quality * 100),
    })
    console.log(`${token},${vectors.length},${finalVectors.length},${Math.round(quality * 100)}%`)
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(results))

  console.log(`\nclips seen: ${clipsSeen}`)
  console.log(`skipped (non-basic jamo): ${clipsSkippedDecompose}`)
  console.log(`skipped (hand not tracked well): ${clipsSkippedHand}`)
  console.log(`usable clips: ${clipsUsable}`)
  console.log(`letters mined: ${results.length} / 24`)
  console.log(`written to ${OUT_PATH}`)
}

main()
