import { useCallback, useEffect, useRef, useState } from 'react'

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
    } catch {
      setError('카메라 접근 권한이 필요합니다.')
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsActive(false)
  }, [])

  useEffect(() => stop, [stop])

  return { videoRef, isActive, error, start, stop }
}
