// Upper-body subset of OpenPose BODY_25 (indices 0-8, already in this order):
// 0 Nose, 1 Neck, 2 RShoulder, 3 RElbow, 4 RWrist, 5 LShoulder, 6 LElbow, 7 LWrist, 8 MidHip
export const POSE_CONNECTIONS: [number, number][] = [
  [1, 0], // neck - nose
  [1, 2], // neck - right shoulder
  [2, 3], // right shoulder - elbow
  [3, 4], // right elbow - wrist
  [1, 5], // neck - left shoulder
  [5, 6], // left shoulder - elbow
  [6, 7], // left elbow - wrist
  [1, 8], // neck - mid hip (spine)
]
