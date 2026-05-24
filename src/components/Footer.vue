<script setup>
import { computed } from 'vue'
import { LinkSlashIcon } from '@heroicons/vue/24/outline'
import { useGlobal } from '../composables/useGlobal.js'

const global = useGlobal()
const year = new Date().getFullYear()
const githubUrl = 'https://github.com/magnum/sngr'

const sessionId = computed(() => global.session.id)
const isLinked = computed(() => global.isLinked())

function unlink() {
  global.unlink()
}
</script>

<template>
  <footer class="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-[clamp(1rem,3vw,1.5rem)]">
    <div class="flex flex-col items-center gap-1">
      <div
        v-if="sessionId"
        class="flex items-center gap-2 font-mono text-sm text-gray-400 sm:text-sm"
      >
        <span v-if="isLinked">linked</span>
        <span>{{ sessionId }}</span>
        <button
          v-if="isLinked"
          type="button"
          class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Unlink session"
          @click="unlink"
        >
          <LinkSlashIcon class="size-4" />
          <span class="font-sans text-xs">unlink</span>
        </button>
      </div>
      <div class="flex items-center gap-3">
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
        <a
          :href="githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-gray-600 transition-colors hover:text-gray-900"
          aria-label="View sngr on GitHub"
        >
          <svg class="size-5" viewBox="0 0 19 19" fill="currentColor" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844"
              clip-rule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
  </footer>
</template>
