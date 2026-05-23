import { ref } from 'vue'
import { addHistoryEntry, clearHistory, loadHistory } from '../lib/recognitionHistory.js'

const items = ref(loadHistory())

export function useRecognitionHistory() {
  function refresh() {
    items.value = loadHistory()
  }

  function addEntry(song) {
    items.value = addHistoryEntry(song)
  }

  function clearAll() {
    items.value = clearHistory()
  }

  return {
    items,
    refresh,
    addEntry,
    clearAll,
  }
}
