import { reactive } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getRedirectResult } from 'firebase/auth'
import { auth, db, ensureUserAccount, getAccountByUid } from './firebase.js'

export const GLOBAL_KEY = Symbol('global')
export const SESSION_STORAGE_KEY = 'sngr-sesssion-id'
export const SESSION_LINKED_KEY = 'sngr-session-linked'
export const REDIRECT_TO_KEY = 'redirect_to'

/** Salva `/?session_id=…` se l'utente apre il QR senza essere loggato. */
export function captureSessionRedirectIfNeeded() {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  if (!params.get('session_id')?.trim()) return

  const redirectTo = `${window.location.pathname}${window.location.search}`
  try {
    localStorage.setItem(REDIRECT_TO_KEY, redirectTo)
  } catch (err) {
    console.warn('[sngr] captureSessionRedirectIfNeeded', err)
  }
}

/** Legge e rimuove l'URL post-login (path + query, es. `/?session_id=abc`). */
export function consumeRedirectTo() {
  if (typeof window === 'undefined') return null

  try {
    const value = localStorage.getItem(REDIRECT_TO_KEY)
    if (value == null || String(value).trim() === '') return null
    localStorage.removeItem(REDIRECT_TO_KEY)
    return String(value).trim()
  } catch (err) {
    console.warn('[sngr] consumeRedirectTo', err)
    return null
  }
}

export function createDefaultAccount() {
  return {
    uid: null,
    firstname: '',
    lastname: '',
    email: '',
    roles: [],
  }
}

export function createDefaultSession(id = null) {
  return {
    id,
    linking: false,
    state: 'ready',
    title: '',
    author: '',
    url: '',
    response: null,
  }
}

export class Global {
  session = reactive(createDefaultSession())
  account = reactive(createDefaultAccount())
  authUser = reactive({ uid: null, photoURL: null })

  _unsubscribe = null
  _unsubscribeAuth = null
  _syncingFromRemote = false
  authReady = false
  ready = false

  async initAuth(onChange) {
    try {
      try {
        await getRedirectResult(auth)
      } catch (err) {
        if (err?.code !== 'auth/no-auth-event') {
          console.error('[sngr] Google redirect sign-in error:', err)
        }
      }

      await auth.authStateReady()

      const syncUser = async (user) => {
        if (user) {
          this.authUser.uid = user.uid
          this.authUser.photoURL = user.photoURL ?? null

          try {
            await ensureUserAccount(user)
            const account = await getAccountByUid(user.uid)
            if (account) {
              Object.assign(this.account, createDefaultAccount(), account, { uid: user.uid })
            }
          } catch (err) {
            console.error('[sngr] account sync failed:', err)
          }

          onChange?.(true)
          return
        }

        this.resetAccount()
        this.authUser.uid = null
        this.authUser.photoURL = null
        this.ready = false
        onChange?.(false)
      }

      this._unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        void syncUser(user)
      })

      await syncUser(auth.currentUser)
    } finally {
      this.authReady = true
    }
  }

  isAuthenticated() {
    return !!(auth.currentUser?.uid || this.authUser.uid)
  }

  resetAccount() {
    Object.assign(this.account, createDefaultAccount())
  }

  async logout() {
    await signOut(auth)
  }

  async checkSession() {
    const urlParams = new URLSearchParams(window.location.search)
    const urlSessionId = urlParams.get('session_id')
    const storedId = localStorage.getItem(SESSION_STORAGE_KEY)

    let sessionId = null
    let joinedFromUrl = false

    if (urlSessionId) {
      joinedFromUrl = true
      sessionId = urlSessionId
      const docRef = doc(db, 'sessions', sessionId)
      const snap = await getDoc(docRef)

      if (!snap.exists()) {
        sessionId = await this.createSession()
        localStorage.removeItem(SESSION_LINKED_KEY)
      } else {
        await updateDoc(docRef, { linking: false })
        this.applySessionData(sessionId, snap.data())
        this.session.linking = false
        localStorage.setItem(SESSION_LINKED_KEY, sessionId)
      }

      urlParams.delete('session_id')
      const query = urlParams.toString()
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
      window.history.replaceState({}, '', nextUrl)
    } else if (storedId) {
      sessionId = storedId
      const docRef = doc(db, 'sessions', sessionId)
      const snap = await getDoc(docRef)

      if (!snap.exists()) {
        sessionId = await this.createSession()
      } else {
        this.applySessionData(sessionId, snap.data())
      }
    } else {
      sessionId = await this.createSession()
    }

    localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
    this.subscribeToSession(sessionId)
    this.ready = true

    if (joinedFromUrl && sessionId === urlSessionId) {
      await this.updateSession({ linking: false })
    }
  }

  applySessionData(id, data) {
    Object.assign(this.session, createDefaultSession(id), data, { id })
  }

  isLinked() {
    const storedId = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!this.session.id || !storedId || this.session.id !== storedId) {
      return false
    }
    return localStorage.getItem(SESSION_LINKED_KEY) === this.session.id
  }

  unlink() {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(SESSION_LINKED_KEY)
    window.location.assign('/')
  }

  async createSession() {
    const docRef = doc(collection(db, 'sessions'))
    const data = {
      ...createDefaultSession(docRef.id),
      createdAt: serverTimestamp(),
    }

    await setDoc(docRef, {
      linking: data.linking,
      state: data.state,
      title: data.title,
      author: data.author,
      url: data.url,
      response: data.response,
      createdAt: data.createdAt,
    })

    this.applySessionData(docRef.id, data)
    localStorage.removeItem(SESSION_LINKED_KEY)
    return docRef.id
  }

  subscribeToSession(id) {
    this._unsubscribe?.()

    const docRef = doc(db, 'sessions', id)
    this._unsubscribe = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) return

      this._syncingFromRemote = true
      this.applySessionData(id, snap.data())
      this._syncingFromRemote = false
    })
  }

  async updateSession(partial) {
    if (!this.session.id || this._syncingFromRemote) return

    const payload = { ...partial }
    delete payload.id

    Object.assign(this.session, payload)

    const docRef = doc(db, 'sessions', this.session.id)
    await updateDoc(docRef, payload)
  }

  async startLinking() {
    await this.updateSession({ linking: true })
  }

  destroy() {
    this._unsubscribe?.()
    this._unsubscribe = null
    this._unsubscribeAuth?.()
    this._unsubscribeAuth = null
  }
}
