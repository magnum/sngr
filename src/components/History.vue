<script setup>
import { ArrowLeftIcon, LinkIcon, ListBulletIcon, TrashIcon } from '@heroicons/vue/24/outline'
import ButtonNav from './ButtonNav.vue'
import { useRecognitionHistory } from '../composables/useRecognitionHistory.js'

const emit = defineEmits(['close'])

const { items, clearAll } = useRecognitionHistory()

function formatDate(iso) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function handleClear() {
  clearAll()
}

function openSpotify(url, event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  event.preventDefault()
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="fixed inset-0 z-30 flex flex-col bg-white font-sans">
    <header class="relative flex min-h-[clamp(4.5rem,12vw,5.5rem)] shrink-0 items-center justify-center px-4 py-[clamp(1.25rem,4vw,1.75rem)]">
      <ButtonNav
        class="absolute left-4"
        aria-label="Back"
        @click="emit('close')"
      >
        <ArrowLeftIcon class="size-8 stroke-3" />
      </ButtonNav>

      <ListBulletIcon class="size-8 text-gray-700" aria-hidden="true" />

      <ButtonNav
        class="absolute right-4"
        aria-label="Clear history"
        @click="handleClear"
      >
        <TrashIcon class="size-8 stroke-3" />
      </ButtonNav>
    </header>

    <div class="flex-1 overflow-y-auto px-4 pt-[clamp(1.25rem,4vw,2rem)] pb-[clamp(4rem,10vh,5.5rem)]">
      <p
        v-if="items.length === 0"
        class="py-8 text-center text-base text-gray-500 sm:text-lg"
      >
        No recognitions yet.
      </p>

      <ul v-else class="mx-auto flex w-full max-w-[min(90vw,28rem)] flex-col gap-4">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0"
        >
          <div class="min-w-0 flex-1">
            <p class="mb-1 text-sm text-gray-500 sm:text-base">
              {{ formatDate(item.recognizedAt) }}
            </p>
            <p class="text-[clamp(1.125rem,3.9vw,1.4rem)] leading-tight font-bold text-gray-900">
              {{ item.title }}
            </p>
            <p
              v-if="item.artist"
              class="text-[clamp(0.9375rem,3.15vw,1.125rem)] leading-snug text-gray-600"
            >
              {{ item.artist }}
            </p>
          </div>

          <a
            v-if="item.spotifyUrl"
            :href="item.spotifyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-5 shrink-0 text-gray-600 transition-colors hover:text-gray-900"
            aria-label="Open on Spotify"
            @click="openSpotify(item.spotifyUrl, $event)"
          >
            <LinkIcon class="size-6 stroke-2" />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
