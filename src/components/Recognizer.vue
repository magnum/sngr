<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  SpeakerWaveIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
} from '@heroicons/vue/24/solid'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import SpotifyListenButton from './SpotifyListenButton.vue'

const MAX_RECORDING_MS = 10_000
const MAX_RECORDING_SEC = MAX_RECORDING_MS / 1000

function getSpotifyUrl(spotify) {
  if (!spotify) return null

  if (spotify.external_urls?.spotify) {
    return spotify.external_urls.spotify
  }

  if (spotify.url) {
    return spotify.url
  }

  const uri = spotify.uri
  if (typeof uri === 'string' && uri.startsWith('spotify:track:')) {
    return `https://open.spotify.com/track/${uri.split(':').pop()}`
  }

  return null
}

const isTestMode = new URLSearchParams(window.location.search).has('test')
const TEST_RESPONSE_URL = '/data/test-response1.json'

const state = ref('ready')
const recordingSeconds = ref(0)
const recognizedSong = ref(null)
const waveformCanvas = ref(null)

let mediaRecorder = null
let mediaStream = null
let chunks = []
let recordingTimeout = null
let recordingInterval = null
let audioContext = null
let analyser = null
let animationFrameId = null
let recognitionAbortController = null
let recognitionCancelled = false
let discardRecording = false

function clearRecordingTimeout() {
  if (recordingTimeout) {
    clearTimeout(recordingTimeout)
    recordingTimeout = null
  }
}

function clearRecordingInterval() {
  if (recordingInterval) {
    clearInterval(recordingInterval)
    recordingInterval = null
  }
  recordingSeconds.value = 0
}

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function drawWaveform() {
  if (state.value !== 'listening' || !analyser || !waveformCanvas.value) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  const bufferLength = analyser.fftSize
  const dataArray = new Uint8Array(bufferLength)

  analyser.getByteTimeDomainData(dataArray)

  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    resizeCanvas(canvas)
  }

  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  const sliceWidth = width / bufferLength
  let x = 0

  ctx.beginPath()
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128
    const y = (v * height) / 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    x += sliceWidth
  }

  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()
  ctx.fillStyle = 'rgba(34, 197, 94, 0.08)'
  ctx.fill()

  ctx.beginPath()
  x = 0
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128
    const y = (v * height) / 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    x += sliceWidth
  }
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  animationFrameId = requestAnimationFrame(drawWaveform)
}

function stopWaveform() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  analyser = null

  if (waveformCanvas.value) {
    const ctx = waveformCanvas.value.getContext('2d')
    ctx.clearRect(0, 0, waveformCanvas.value.width, waveformCanvas.value.height)
  }
}

function startWaveform(stream) {
  audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)
  drawWaveform()
}

function startRecordingTimer() {
  const startedAt = Date.now()
  recordingSeconds.value = 1

  recordingInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    recordingSeconds.value = Math.min(elapsed + 1, MAX_RECORDING_SEC)
  }, 200)
}

async function startRecording() {
  chunks = []
  recognizedSong.value = null
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  mediaRecorder = new MediaRecorder(mediaStream)

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  }

  mediaRecorder.onstop = () => {
    cleanupStream()

    if (discardRecording) {
      discardRecording = false
      state.value = 'ready'
      mediaRecorder = null
      chunks = []
      return
    }

    const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' })
    recognizeAudio(blob)
  }

  mediaRecorder.start()
  state.value = 'listening'
  startRecordingTimer()
  startWaveform(mediaStream)

  recordingTimeout = setTimeout(() => {
    stopRecording()
  }, MAX_RECORDING_MS)
}

function cleanupStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}

function stopRecording() {
  clearRecordingTimeout()
  clearRecordingInterval()
  stopWaveform()

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  } else {
    cleanupStream()
  }
}

async function fetchTestResponse(signal) {
  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, 1500)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

  const response = await fetch(TEST_RESPONSE_URL, { signal })
  if (!response.ok) {
    throw new Error(`Failed to load test response (${response.status})`)
  }
  return response.json()
}

function applyAudDResponse(data) {
  if (data.status === 'success' && data.result?.title) {
    recognizedSong.value = {
      title: data.result.title,
      artist: data.result.artist ?? '',
      spotifyUrl: getSpotifyUrl(data.result.spotify),
    }
  }
}

async function fetchAudDResponse(blob, signal) {
  const formData = new FormData()
  formData.append('file', blob, 'recording.webm')
  formData.append('api_token', import.meta.env.VITE_AUDD_API_TOKEN ?? '')
  formData.append('return', 'spotify')

  const response = await fetch('https://api.audd.io/', {
    method: 'POST',
    body: formData,
    signal,
  })

  return response.json()
}

function cancelRecognition() {
  if (state.value !== 'recognizing') return

  recognitionCancelled = true
  recognitionAbortController?.abort()
  state.value = 'ready'
  mediaRecorder = null
  chunks = []
  recognitionAbortController = null
}

function cancelListening() {
  if (state.value !== 'listening') return

  discardRecording = true
  stopRecording()
}

function handleCancel() {
  if (state.value === 'listening') {
    cancelListening()
  } else if (state.value === 'recognizing') {
    cancelRecognition()
  }
}

async function recognizeAudio(blob) {
  state.value = 'recognizing'
  recognitionCancelled = false
  recognitionAbortController = new AbortController()
  const { signal } = recognitionAbortController

  try {
    const data = isTestMode ? await fetchTestResponse(signal) : await fetchAudDResponse(blob, signal)
    if (recognitionCancelled) return

    console.log(isTestMode ? 'AudD mock result:' : 'AudD recognition result:', data)
    applyAudDResponse(data)
  } catch (error) {
    if (error.name === 'AbortError' || recognitionCancelled) return
    console.error('AudD recognition error:', error)
  } finally {
    if (!recognitionCancelled) {
      state.value = 'ready'
    }
    mediaRecorder = null
    chunks = []
    recognitionAbortController = null
  }
}

async function handleClick() {
  if (state.value === 'recognizing') return

  if (state.value === 'ready') {
    try {
      await startRecording()
    } catch (error) {
      console.error('Microphone access error:', error)
      clearRecordingInterval()
      stopWaveform()
      state.value = 'ready'
    }
    return
  }

  if (state.value === 'listening') {
    stopRecording()
  }
}

function handleResize() {
  if (waveformCanvas.value) {
    resizeCanvas(waveformCanvas.value)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  recognitionAbortController?.abort()
  clearRecordingTimeout()
  clearRecordingInterval()
  stopWaveform()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  cleanupStream()
})
</script>

<template>
  <div class="relative min-h-svh">
    <canvas
      ref="waveformCanvas"
      class="pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
    />

    <div class="grid min-h-svh place-items-center px-4 font-sans">
      <div class="relative size-[clamp(7rem,38vw,14rem)] shrink-0">
        <button
          type="button"
          class="btn-embossed absolute inset-0 flex items-center justify-center rounded-full"
          :class="{
            'btn-embossed-ready cursor-pointer': state === 'ready',
            'btn-embossed-listening animate-recording-pulse cursor-pointer': state === 'listening',
            'btn-embossed-recognizing animate-recording-pulse cursor-not-allowed': state === 'recognizing',
          }"
          :disabled="state === 'recognizing'"
          @click="handleClick"
        >
          <SpeakerWaveIcon
            v-if="state === 'ready'"
            class="size-[clamp(2.75rem,15vw,5.5rem)] text-gray-700"
          />
          <MicrophoneIcon
            v-else-if="state === 'listening'"
            class="size-[clamp(2.75rem,15vw,5.5rem)] text-white"
          />
          <MusicalNoteIcon
            v-else
            class="size-[clamp(2.75rem,15vw,5.5rem)] text-white"
          />
        </button>

        <div
          class="absolute top-[calc(100%+clamp(1rem,3vw,1.75rem))] left-1/2 flex w-[min(90vw,28rem)] -translate-x-1/2 flex-col items-center gap-1 text-center"
        >
          <p class="text-base font-medium text-gray-600 sm:text-lg">
            <template v-if="state === 'ready'">Click to RECORD</template>
            <template v-else-if="state === 'listening'">LISTENING</template>
            <template v-else>RECOGNIZING</template>
          </p>

          <p
            v-if="state === 'listening'"
            class="text-base text-gray-500 sm:text-lg"
          >
            {{ recordingSeconds }} secs of {{ MAX_RECORDING_SEC }} max
          </p>

          <button
            v-if="state === 'listening' || state === 'recognizing'"
            type="button"
            class="mt-2 flex size-14 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-md transition-colors hover:bg-gray-300"
            :aria-label="state === 'listening' ? 'Cancel recording' : 'Cancel recognition'"
            @click="handleCancel"
          >
            <XMarkIcon class="size-8 stroke-3" />
          </button>

          <div
            v-if="state === 'ready' && recognizedSong"
            class="mt-2 flex w-full flex-col items-center"
          >
            <div class="flex flex-col items-center gap-0.5">
              <p class="text-[clamp(1.5rem,5.25vw,1.875rem)] leading-tight font-bold text-gray-900">
                {{ recognizedSong.title }}
              </p>
              <p
                v-if="recognizedSong.artist"
                class="text-[clamp(1.125rem,4.2vw,1.5rem)] leading-snug text-gray-600"
              >
                {{ recognizedSong.artist }}
              </p>
            </div>
            <SpotifyListenButton
              v-if="recognizedSong.spotifyUrl"
              :href="recognizedSong.spotifyUrl"
              class="mt-5"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
