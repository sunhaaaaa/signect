#!/usr/bin/env node
/**
 * Converts the AIHub 한국수어 WORD dataset (OpenPose keypoints + morpheme
 * labels) into Signect's SignReference format, plus a per-word skeleton
 * animation the Learn page can play back as a stand-in for a demo video
 * (the dataset ships keypoints only, no raw video files).
 *
 * Only the front-facing camera ("_F") sequences are used, since the app
 * matches against a single front-facing webcam. For each word:
 *   1. Read the morpheme label + [start, end] time window.
 *   2. Convert that window to a frame-index range using fps = frames / duration.
 *   3. For each frame, pull hand_left/right_keypoints_2d (21 pts) and the
 *      upper-body subset of pose_keypoints_2d (9 pts: nose/neck/shoulders/
 *      elbows/wrists/mid-hip), each as (x, y, confidence).
 *   4. Reference vector: keep the hand with more high-confidence frames (the
 *      "active" hand), normalize each kept frame to a 42-dim (x, y) vector
 *      relative to the wrist, and average into one vector per word. Also
 *      emit a horizontally-mirrored copy (negate x) so both left- and
 *      right-handed signers / camera mirroring still match reasonably well.
 *   5. Animation: every frame in the window (raw pixel coords, low-confidence
 *      points marked [-1,-1]) is written to public/data/animations/<seqId>.json
 *      for looped skeleton playback.
 *
 * Usage:
 *   node scripts/build-word-references.mjs [datasetRoot] [outFile] [animDir]
 *
 * Defaults assume the AIHub "WORD" folder layout:
 *   <datasetRoot>/keypoint/<01|02>/<seqId>/<seqId>_<frame>_keypoints.json
 *   <datasetRoot>/morpheme/<01|02>/<seqId>_morpheme.json
 */
import fs from 'node:fs'
import path from 'node:path'

const DATASET_ROOT =
  process.argv[2] ||
  '/Users/tjsgkdia/Downloads/수어 영상/1.Training/WORD'
const OUT_PATH = process.argv[3] || 'public/data/signReferences.word.json'
const ANIM_DIR = process.argv[4] || 'public/data/animations'
const FOLDERS = ['01', '02']
const CONF_THRESHOLD = 0.3
const WRIST_CONF_MIN = 0.2
const MIN_VALID_FRAMES = 5
const POINT_CONF_MIN = 0.15
const POSE_POINT_COUNT = 9 // nose, neck, R/L shoulder, R/L elbow, R/L wrist, mid-hip (BODY_25 order 0-8)

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

/** Splits a flat OpenPose [x,y,c, x,y,c, ...] array into `count` {x,y,c} points. */
function toPoints(flat, count) {
  const points = []
  for (let i = 0; i < count; i++) {
    const x = flat?.[i * 3]
    const y = flat?.[i * 3 + 1]
    const c = flat?.[i * 3 + 2]
    points.push({ x: x ?? 0, y: y ?? 0, c: c ?? 0 })
  }
  return points
}

function meanConfidence(points) {
  return points.reduce((sum, p) => sum + p.c, 0) / points.length
}

/** Wrist-relative (x, y) flattened to 42 numbers, for matching. */
function normalize2D(points) {
  const wrist = points[0]
  const vector = []
  for (const p of points) {
    vector.push(p.x - wrist.x, p.y - wrist.y)
  }
  return vector
}

function mirrorX(vector) {
  const out = new Array(vector.length)
  for (let i = 0; i < vector.length; i += 2) {
    out[i] = -vector[i]
    out[i + 1] = vector[i + 1]
  }
  return out
}

function averageVectors(vectors) {
  const length = vectors[0].length
  const sum = new Array(length).fill(0)
  for (const vector of vectors) {
    for (let i = 0; i < length; i++) sum[i] += vector[i]
  }
  return sum.map((value) => value / vectors.length)
}

/** Raw [x, y] pairs for animation playback; low-confidence points -> [-1, -1]. */
function toAnimPoints(points) {
  return points.map((p) => (p.c >= POINT_CONF_MIN ? [Math.round(p.x), Math.round(p.y)] : [-1, -1]))
}

function processSequence(seqId, keypointDir, morpheme) {
  const entry = morpheme.data?.[0]
  const label = entry?.attributes?.[0]?.name
  const { start, end } = entry ?? {}
  const duration = morpheme.metaData?.duration
  if (!label || start == null || end == null || !duration) return null

  const seqDir = path.join(keypointDir, seqId)
  if (!fs.existsSync(seqDir)) return null

  const frameFiles = fs.readdirSync(seqDir).sort()
  if (frameFiles.length === 0) return null

  const fps = frameFiles.length / duration
  const startFrame = Math.max(0, Math.floor(start * fps))
  const endFrame = Math.min(frameFiles.length - 1, Math.ceil(end * fps))

  const leftSamples = []
  const rightSamples = []
  const animFrames = []

  for (let i = startFrame; i <= endFrame; i++) {
    const frame = loadJSON(path.join(seqDir, frameFiles[i]))
    const people = frame.people
    if (!people) continue

    const leftPts = toPoints(people.hand_left_keypoints_2d, 21)
    const rightPts = toPoints(people.hand_right_keypoints_2d, 21)
    const posePts = toPoints(people.pose_keypoints_2d, POSE_POINT_COUNT)

    if (leftPts[0].c >= WRIST_CONF_MIN && meanConfidence(leftPts) >= CONF_THRESHOLD) {
      leftSamples.push(normalize2D(leftPts))
    }
    if (rightPts[0].c >= WRIST_CONF_MIN && meanConfidence(rightPts) >= CONF_THRESHOLD) {
      rightSamples.push(normalize2D(rightPts))
    }

    animFrames.push({
      pose: toAnimPoints(posePts),
      left: toAnimPoints(leftPts),
      right: toAnimPoints(rightPts),
    })
  }

  const samples = leftSamples.length >= rightSamples.length ? leftSamples : rightSamples
  if (samples.length < MIN_VALID_FRAMES) return null

  return { label, vector: averageVectors(samples), fps, frames: animFrames }
}

function main() {
  const results = []
  let processed = 0
  let skipped = 0

  fs.mkdirSync(ANIM_DIR, { recursive: true })

  for (const folder of FOLDERS) {
    const morphemeDir = path.join(DATASET_ROOT, 'morpheme', folder)
    const keypointDir = path.join(DATASET_ROOT, 'keypoint', folder)
    if (!fs.existsSync(morphemeDir)) continue

    const files = fs.readdirSync(morphemeDir).filter((f) => f.endsWith('_F_morpheme.json'))

    for (const file of files) {
      const seqId = file.replace('_morpheme.json', '')
      const morpheme = loadJSON(path.join(morphemeDir, file))
      const result = processSequence(seqId, keypointDir, morpheme)

      if (!result) {
        skipped++
        continue
      }

      const id = `word-${seqId}`
      results.push({ id, label: result.label, category: 'word', vector: result.vector })
      results.push({
        id: `${id}-mirror`,
        label: result.label,
        category: 'word',
        vector: mirrorX(result.vector),
      })

      fs.writeFileSync(
        path.join(ANIM_DIR, `${id}.json`),
        JSON.stringify({ id, label: result.label, fps: result.fps, frames: result.frames }),
      )

      processed++
    }
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(results))

  console.log(`processed=${processed} skipped=${skipped} references=${results.length}`)
  console.log(`references written to ${OUT_PATH}`)
  console.log(`animations written to ${ANIM_DIR}/ (${processed} files)`)
}

main()
