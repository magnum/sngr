import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const firebaseConfig = {
  apiKey: 'AIzaSyApxbwe9QXdcUkVacvKMTS8Hi6KbaQ8_UU',
  authDomain: 'sngr-7e5d2.firebaseapp.com',
  projectId: 'sngr-7e5d2',
  storageBucket: 'sngr-7e5d2.firebasestorage.app',
  messagingSenderId: '752551135878',
  appId: '1:752551135878:web:b156de82713d2418d2df07',
  measurementId: 'G-SBR7TBHLE1',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

let analytics = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

const ACCOUNTS = 'accounts'

function splitDisplayName(displayName) {
  const raw = (displayName ?? '').trim()
  if (!raw) return { firstname: '', lastname: '' }
  const spaceIndex = raw.indexOf(' ')
  if (spaceIndex === -1) return { firstname: raw, lastname: '' }
  return {
    firstname: raw.slice(0, spaceIndex),
    lastname: raw.slice(spaceIndex + 1).trim(),
  }
}

/** Come floop: crea accounts/{uid} se mancante, dopo getIdToken(). */
export async function ensureUserAccount(user) {
  if (!user?.uid) return false

  const ref = doc(db, ACCOUNTS, user.uid)
  const name = user.displayName ?? ''
  const email = user.email ?? ''
  const { firstname, lastname } = splitDisplayName(name)

  try {
    await user.getIdToken()

    const snap = await getDoc(ref)
    if (snap.exists()) return true

    await setDoc(ref, {
      uid: user.uid,
      roles: [],
      name,
      email,
      firstname,
      lastname,
    })
    return true
  } catch (err) {
    console.error('[sngr] ensureUserAccount failed:', err?.code ?? err?.message ?? err)
    return false
  }
}

export async function getAccountByUid(uid) {
  if (!uid) return null
  const snap = await getDoc(doc(db, ACCOUNTS, uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export { app, auth, db, analytics }
