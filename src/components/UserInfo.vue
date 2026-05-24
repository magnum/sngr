<script setup>
import { computed } from 'vue'
import { useGlobal } from '../composables/useGlobal.js'

const global = useGlobal()

const photoURL = computed(() => global.authUser.photoURL)

async function logout() {
  await global.logout()
}
</script>

<template>
  <div class="flex items-center gap-3">
    <img
      v-if="photoURL"
      :src="photoURL"
      alt=""
      referrerpolicy="no-referrer"
      class="size-10 rounded-full bg-gray-200 object-cover"
    />
    <div
      v-else
      class="flex size-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600"
      aria-hidden="true"
    >
      {{ global.account.firstname?.[0] ?? '?' }}
    </div>
    <button
      type="button"
      class="cursor-pointer text-sm font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
      @click="logout"
    >
      Logout
    </button>
  </div>
</template>
