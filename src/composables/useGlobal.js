import { inject } from 'vue'
import { GLOBAL_KEY } from '../lib/global.js'

export function useGlobal() {
  const global = inject(GLOBAL_KEY)

  if (!global) {
    throw new Error('Global was not provided')
  }

  return global
}
