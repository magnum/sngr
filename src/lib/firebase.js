import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

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
const db = getFirestore(app)

let analytics = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export { app, db, analytics }
