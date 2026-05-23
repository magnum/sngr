<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-[clamp(1rem,3vw,1.5rem)]">
    <p class="text-sm text-gray-500 sm:text-base">
      Copyright {{ year }}
      <a
        href="https://antonio.m6i.it"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
      >
        m6i
      </a>
    </p>
  </footer>
</template>
