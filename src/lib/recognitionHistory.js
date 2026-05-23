const STORAGE_KEY = 'sngr:history'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function loadHistory() {
  return loadFromStorage()
}

export function addHistoryEntry(song) {
  if (!song?.title) return loadFromStorage()

  const entry = {
    id: crypto.randomUUID(),
    recognizedAt: new Date().toISOString(),
    title: song.title,
    artist: song.artist ?? '',
    spotifyUrl: song.spotifyUrl ?? null,
  }

  const items = [entry, ...loadFromStorage()]
  persist(items)
  return items
}

export function clearHistory() {
  persist([])
  return []
}
