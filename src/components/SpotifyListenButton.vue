<script setup>
const props = defineProps({
  href: {
    type: String,
    required: true,
  },
})

function openInNewTab(event) {
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
  window.open(props.href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex min-h-[3.9rem] items-center gap-[0.975rem] rounded-full bg-[#1DB954] px-[1.625rem] py-[0.8125rem] text-white transition-colors hover:bg-[#1ed760] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
    aria-label="Listen on Spotify"
    @click="openInNewTab"
  >
    <span class="text-[1.125rem] font-bold leading-none sm:text-[1.3rem]">Listen on </span>
    <img
      src="/spotify-full-logo-white.png"
      alt="Spotify"
      class="h-[27px] w-[91px] shrink-0 object-contain object-left"
      width="91"
      height="27"
    />
  </a>
</template>
