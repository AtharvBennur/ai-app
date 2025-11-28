import admin from 'firebase-admin'
import path from 'path'
import fs from 'fs'

let firebaseApp: admin.app.App | null = null

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID

  // Check for service account key file
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(process.cwd(), 'serviceAccountKey.json')

  if (fs.existsSync(serviceAccountPath)) {
    // Use service account key file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    })
    console.log('✅ Firebase Admin SDK initialized with service account')
    return firebaseApp
  }

  if (!projectId) {
    console.warn('⚠️ FIREBASE_PROJECT_ID not set. Firebase Admin SDK not initialized.')
    // Return a mock for development without Firebase
    return admin.initializeApp({
      projectId: 'demo-project',
    })
  }

  // Initialize with project ID only (limited functionality)
  firebaseApp = admin.initializeApp({
    projectId,
  })

  console.log('✅ Firebase Admin SDK initialized (project ID only - token verification may fail)')
  return firebaseApp
}

export function getFirestore(): admin.firestore.Firestore {
  return admin.firestore()
}

export function getAuth(): admin.auth.Auth {
  return admin.auth()
}

export default admin
