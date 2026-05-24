<script setup>
import { shallowRef, ref, provide, onMounted, onUnmounted } from 'vue'
import { Router } from './routing.js'
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'
import UserInfo from './components/UserInfo.vue'
import Recognizer from './components/Recognizer.vue'
import LoginView from './views/LoginView.vue'
import {
  Global,
  GLOBAL_KEY,
  captureSessionRedirectIfNeeded,
  consumeRedirectTo,
} from './lib/global.js'

const router = new Router({
  '/': Recognizer,
  '/login': LoginView,
})

const global = new Global()
provide(GLOBAL_KEY, global)

const currentComponent = shallowRef(LoginView)
const showShell = ref(false)
const booted = ref(false)

let unsubscribeRouter = null

function applyPostLoginRedirect() {
  const redirectTo = consumeRedirectTo()
  if (!redirectTo) return false

  try {
    const parsed = new URL(redirectTo, window.location.origin)
    if (parsed.origin !== window.location.origin) return false

    router.replace(parsed.pathname + parsed.search + parsed.hash)
    return true
  } catch (err) {
    console.warn('[sngr] post-login redirect invalid:', redirectTo, err)
    return false
  }
}

function applyRoute(component, path) {
  if (!global.isAuthenticated()) {
    captureSessionRedirectIfNeeded()
    showShell.value = false
    currentComponent.value = LoginView
    if (path !== '/login') {
      router.replace('/login')
    }
    return
  }

  showShell.value = true

  if (applyPostLoginRedirect()) return

  if (path === '/login') {
    router.replace('/')
    return
  }

  currentComponent.value = component

  if (!global.ready) {
    void global.checkSession()
  }
}

onMounted(async () => {
  unsubscribeRouter = router.onChange((component, path) => {
    applyRoute(component, path)
  })

  try {
    await global.initAuth(() => {
      applyRoute(
        router.getPath() === '/login' ? LoginView : Recognizer,
        router.getPath(),
      )
    })

    router.start()

    if (!currentComponent.value) {
      applyRoute(
        router.getPath() === '/login' ? LoginView : Recognizer,
        router.getPath(),
      )
    }
  } catch (err) {
    console.error('[sngr] app init failed:', err)
    currentComponent.value = LoginView
  } finally {
    booted.value = true
  }
})

onUnmounted(() => {
  unsubscribeRouter?.()
  global.destroy()
})
</script>

<template>
  <div
    class="orientation-lock-overlay fixed inset-0 z-50 hidden items-center justify-center bg-white px-6 text-center font-sans text-lg font-medium text-gray-700"
    aria-live="polite"
  >
    Rotate your device to portrait to use sngr.
  </div>

  <UserInfo
    v-if="showShell && global.isAuthenticated()"
    class="fixed top-4 right-4 z-20"
  />

  <template v-if="showShell">
    <Header />
    <Footer />
  </template>

  <component v-if="booted" :is="currentComponent" />
</template>
