import { getFirebaseFullState, refreshFirebaseDerivedState } from "./firebase-store"

/**
 * Advances the traffic engine and returns the full live snapshot.
 * In Firebase mode this simply refreshes derived lane state from the
 * stored snapshot and returns the current state.
 */
export async function tickEngine() {
  await refreshFirebaseDerivedState()
  return getFirebaseFullState()
}

export async function getFullState() {
  return getFirebaseFullState()
}
