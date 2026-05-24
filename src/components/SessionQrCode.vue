<script setup>
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useGlobal } from '../composables/useGlobal.js'

const global = useGlobal()
const canvasRef = ref(null)

const baseUrl = (import.meta.env.VITE_BASE_URL ?? window.location.origin).replace(/\/$/, '')

function getShareUrl() {
  if (!global.session.id) return ''
  return `${baseUrl}?session_id=${global.session.id}`
}

async function renderQr() {
  if (!canvasRef.value || !global.session.linking) return

  const url = getShareUrl()
  if (!url) return

  await QRCode.toCanvas(canvasRef.value, url, {
    width: 256,
    margin: 2,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  })
}

watch(
  () => [global.session.linking, global.session.id],
  () => {
    renderQr()
  },
)

onMounted(() => {
  renderQr()
})
</script>

<template>
  <div
    v-if="global.session.linking"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
    aria-live="polite"
  >
    <div class="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-xl">
      <p class="text-center text-base font-medium text-gray-800">
        Scan to continue on another device
      </p>
      <canvas ref="canvasRef" class="rounded-lg" aria-label="Session QR code" />
      <p class="break-all text-center text-xs text-gray-500">
        {{ getShareUrl() }}
      </p>
    </div>
  </div>
</template>
