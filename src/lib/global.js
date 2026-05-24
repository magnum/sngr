import { reactive } from 'vue'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase.js'

export const GLOBAL_KEY = Symbol('global')
export const SESSION_STORAGE_KEY = 'sngr-sesssion-id'
export const SESSION_LINKED_KEY = 'sngr-session-linked'

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

  _unsubscribe = null
  _syncingFromRemote = false
  ready = false

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
  }
}
