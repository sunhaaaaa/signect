import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

let landmarkerPromise: Promise<HandLandmarker> | null = null

export function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE).then((fileset) =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      }),
    )
  }
  return landmarkerPromise
}
