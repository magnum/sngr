<script setup>
import { shallowRef, provide, onMounted, onUnmounted } from 'vue'
import { Router } from './routing.js'
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'
import Recognizer from './components/Recognizer.vue'
import { Global, GLOBAL_KEY } from './lib/global.js'

const router = new Router({
  '/': Recognizer,
})

const global = new Global()
provide(GLOBAL_KEY, global)

const currentComponent = shallowRef(null)
let unsubscribe = null

onMounted(async () => {
  unsubscribe = router.onChange((component) => {
    currentComponent.value = component
  })
  router.start()
  await global.checkSession()
})

onUnmounted(() => {
  unsubscribe?.()
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

  <Header />
  <component :is="currentComponent" />
  <Footer />
</template>
