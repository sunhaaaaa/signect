import { useEffect, useMemo, useState } from 'react'
import { signReferences as localSignReferences } from '../data/signReferences'
import type { SignReference } from '../types/sign'

let cachedWordReferences: SignReference[] | null = null
let inFlightFetch: Promise<SignReference[]> | null = null

function fetchWordReferences(): Promise<SignReference[]> {
  if (cachedWordReferences) return Promise.resolve(cachedWordReferences)
  if (!inFlightFetch) {
    inFlightFetch = fetch('/data/signReferences.word.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SignReference[]) => {
        cachedWordReferences = data
        return data
      })
      .catch(() => [])
  }
  return inFlightFetch
}

/**
 * Loads the pre-built AIHub word-sign reference vectors (public/data) and
 * merges them with any locally captured references from /dev/capture.
 */
export function useSignReferences() {
  const [wordReferences, setWordReferences] = useState<SignReference[]>(
    cachedWordReferences ?? [],
  )
  const [isLoading, setIsLoading] = useState(cachedWordReferences === null)

  useEffect(() => {
    if (cachedWordReferences) return
    let cancelled = false
    fetchWordReferences().then((data) => {
      if (!cancelled) {
        setWordReferences(data)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const references = useMemo(
    () => [...localSignReferences, ...wordReferences],
    [wordReferences],
  )

  const labels = useMemo(
    () => Array.from(new Set(references.map((r) => r.label))).sort((a, b) => a.localeCompare(b, 'ko')),
    [references],
  )

  return { references, labels, isLoading }
}
