<script setup>
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { Router } from './routing.js'
import Recognizer from './components/Recognizer.vue'

const router = new Router({
  '/': Recognizer,
})

const currentComponent = shallowRef(null)
let unsubscribe = null

onMounted(() => {
  unsubscribe = router.onChange((component) => {
    currentComponent.value = component
  })
  router.start()
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <component :is="currentComponent" />
</template>
