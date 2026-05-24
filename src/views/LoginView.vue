<script setup>
import ConnectWithGoogle from '../components/ConnectWithGoogle.vue'
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center px-6 font-sans">
    <div class="flex w-full max-w-sm flex-col items-center gap-8">
      <h1 class="font-fredoka text-5xl font-bold text-gray-900">sngr</h1>

      <ConnectWithGoogle />

      <p class="text-center text-base leading-relaxed text-gray-600">
        <span class="font-bold text-gray-900">sngr</span>
        is an app to recognize music on the go, please login to use it
      </p>
    </div>
  </div>
</template>
