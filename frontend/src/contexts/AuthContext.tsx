import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db, isDemoMode } from '../config/firebase'

export type UserRole = 'student' | 'teacher' | 'admin'

interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Date
}

interface AuthContextType {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  signup: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

function DemoAuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = loadStoredProfile()
    if (stored) {
      hydrate(stored)
    } else {
      hydrate(createStoredProfile())
    }
    setLoading(false)
  }, [])

  function hydrate(profile: StoredProfile | null) {
    if (!profile) {
      setCurrentUser(null)
      setUserProfile(null)
      persistStoredProfile(null)
      return
    }

    setCurrentUser(buildDemoUser(profile))
    setUserProfile(toUserProfile(profile))
    persistStoredProfile(profile)
  }

  async function signup(email: string, _password: string, displayName: string, role: UserRole) {
    hydrate(createStoredProfile({ email, displayName, role }))
  }

  async function login(email: string, _password: string) {
    const name = email.split('@')[0] || 'Guest'
    hydrate(createStoredProfile({ email, displayName: name, role: deriveRole(email) }))
  }

  async function loginWithGoogle() {
    hydrate(
      createStoredProfile({
        email: 'demo.student@ai-evaluator.app',
        displayName: 'Demo Student',
        role: 'student',
      }),
    )
  }

  async function logout() {
    hydrate(null)
  }

  async function resetPassword() {
    return
  }

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const DEMO_PROFILE_KEY = 'ai-evaluator-demo-profile'

interface StoredProfile extends Omit<UserProfile, 'createdAt'> {
  createdAt: string
}

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function deriveRole(email: string, fallback: UserRole = 'student'): UserRole {
  const normalized = email.toLowerCase()
  if (normalized.includes('teacher')) return 'teacher'
  if (normalized.includes('admin')) return 'admin'
  return fallback
}

function createStoredProfile(
  overrides: Partial<StoredProfile> = {},
): StoredProfile {
  const nowIso = new Date().toISOString()
  return {
    uid: overrides.uid || randomId('demo-user'),
    email: overrides.email || 'demo.student@ai-evaluator.app',
    displayName: overrides.displayName || 'Demo Student',
    role: overrides.role || 'student',
    createdAt: overrides.createdAt || nowIso,
  }
}

function toUserProfile(profile: StoredProfile): UserProfile {
  return {
    ...profile,
    createdAt: new Date(profile.createdAt),
  }
}

function buildDemoUser(profile: StoredProfile): User {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    getIdToken: async () => 'demo-token',
  } as User
}

function loadStoredProfile(): StoredProfile | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(DEMO_PROFILE_KEY)
  if (!raw) return null
  try {
    const profile = JSON.parse(raw) as StoredProfile
    return profile
  } catch {
    return null
  }
}

function persistStoredProfile(profile: StoredProfile | null) {
  if (typeof window === 'undefined') return
  if (!profile) {
    window.localStorage.removeItem(DEMO_PROFILE_KEY)
  } else {
    window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile))
  }
}

function FirebaseAuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  if (!auth || !googleProvider || !db) {
    throw new Error('Firebase services are not configured.')
  }

  const authInstance = auth as NonNullable<typeof auth>
  const googleAuthProvider = googleProvider as NonNullable<typeof googleProvider>
  const firestore = db as NonNullable<typeof db>

  async function createUserProfile(user: User, displayName: string, role: UserRole) {
    const userRef = doc(firestore, 'users', user.uid)
    const profile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
      uid: user.uid,
      email: user.email || '',
      displayName,
      role,
      createdAt: serverTimestamp(),
    }
    await setDoc(userRef, profile)
    return profile
  }

  async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(firestore, 'users', uid)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile
    }
    return null
  }

  async function signup(email: string, password: string, displayName: string, role: UserRole) {
    const { user } = await createUserWithEmailAndPassword(authInstance, email, password)
    await createUserProfile(user, displayName, role)
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(authInstance, email, password)
  }

  async function loginWithGoogle() {
    const { user } = await signInWithPopup(authInstance, googleAuthProvider)
    // Check if user profile exists, if not create one with default role
    const existingProfile = await fetchUserProfile(user.uid)
    if (!existingProfile) {
      await createUserProfile(user, user.displayName || 'User', 'student')
    }
  }

  async function logout() {
    await signOut(authInstance)
    setUserProfile(null)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(authInstance, email)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      setCurrentUser(user)
      if (user) {
        const profile = await fetchUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider(props: AuthProviderProps) {
  if (isDemoMode || !auth || !googleProvider || !db) {
    return <DemoAuthProvider {...props} />
  }
  return <FirebaseAuthProvider {...props} />
}
