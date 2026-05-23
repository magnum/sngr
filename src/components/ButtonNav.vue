<script setup>
defineProps({
  ariaLabel: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="flex size-14 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-md transition-colors enabled:cursor-pointer enabled:hover:bg-gray-300 disabled:pointer-events-none disabled:invisible"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
