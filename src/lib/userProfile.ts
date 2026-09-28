import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import { loadProgress } from './progressStore'

/**
 * Runs once per sign-in (called from useAuth's onAuthStateChanged). Creates
 * the user's Firestore profile on first login, and — only if this account
 * has no progress doc yet — uploads this browser's localStorage progress so
 * a first-time sign-in doesn't silently discard whatever was already tracked
 * as a guest.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  if (!db) return
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName ?? '수어러',
      photoURL: user.photoURL ?? null,
      level: 1,
      totalPoints: 0,
      streak: { current: 0, longest: 0, lastActiveDate: null },
      unlockedMascotItems: [],
      equippedMascotItems: {},
      createdAt: serverTimestamp(),
    })
  }

  const progressRef = doc(db, 'users', user.uid, 'progress', 'summary')
  const progressSnap = await getDoc(progressRef)
  if (!progressSnap.exists()) {
    await setDoc(progressRef, loadProgress())
  }
}
