import { useEffect, useState } from 'react'
import { OAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { ensureUserProfile } from '../lib/userProfile'

// Firebase has no built-in Kakao provider — Kakao is wired in as a custom
// OpenID Connect provider in the Firebase console, under whatever id you
// give it there (Firebase requires the "oidc." prefix). Configurable since
// that id is chosen when the provider is set up, not fixed by Firebase.
const KAKAO_OIDC_PROVIDER_ID = import.meta.env.VITE_KAKAO_OIDC_PROVIDER_ID || 'oidc.kakao'

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
      if (nextUser) void ensureUserProfile(nextUser)
    })
    return unsubscribe
  }, [])

  const signInWithKakao = async () => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다. .env.local을 확인하세요.')
    const provider = new OAuthProvider(KAKAO_OIDC_PROVIDER_ID)
    await signInWithPopup(auth, provider)
  }

  const signOutUser = () => {
    if (!auth) return Promise.resolve()
    return signOut(auth)
  }

  return { user, isLoading, isFirebaseConfigured, signInWithKakao, signOutUser }
}
