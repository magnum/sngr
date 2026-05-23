const PORTRAIT_LOCK = 'portrait'

function lockPortrait() {
  if (!screen.orientation?.lock) return Promise.resolve()

  return screen.orientation.lock(PORTRAIT_LOCK).catch(() => {})
}

export function initOrientationLock() {
  lockPortrait()

  window.addEventListener(
    'pointerdown',
    () => {
      lockPortrait()
    },
    { once: true, passive: true },
  )

  screen.orientation?.addEventListener?.('change', () => {
    if (screen.orientation.type.startsWith('landscape')) {
      lockPortrait()
    }
  })
}
