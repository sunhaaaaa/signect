import { useEffect } from 'react'
import { addStudyMs } from '../lib/progressStore'

/** Tracks active time on the page it's mounted in and adds it to MyPage's study-time stat on unmount. */
export function useStudyTimer() {
  useEffect(() => {
    const start = performance.now()
    return () => {
      addStudyMs(performance.now() - start)
    }
  }, [])
}
