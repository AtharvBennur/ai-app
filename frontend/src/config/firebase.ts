import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
)

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || !hasFirebaseConfig

let app: FirebaseApp | null = null

if (!isDemoMode) {
  app = initializeApp(firebaseConfig)
} else {
  console.info('AI Evaluator running in demo mode – Firebase has been disabled.')
}

export const auth = app ? getAuth(app) : null
export const googleProvider = app ? new GoogleAuthProvider() : null
export const db = app ? getFirestore(app) : null

export default app
