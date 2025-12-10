<script setup>
import { computed } from 'vue'

const props = defineProps({
  file: File,
  canRemove: { type: Boolean, default: true }
})

const emit = defineEmits(['remove'])

const formattedSize = computed(() => {
  if (!props.file) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(props.file.size) / Math.log(k))
  return `${parseFloat((props.file.size / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
})
</script>

<template>
  <div v-if="file" class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mb-6 animate-slide-down hover:bg-white/10 transition-colors cursor-pointer group">
    <div class="flex flex-col overflow-hidden">
      <span class="font-medium text-slate-200 truncate pr-4">{{ file.name }}</span>
      <span class="text-xs text-slate-400">{{ formattedSize }}</span>
    </div>
    <button 
      v-if="canRemove"
      @click.stop="$emit('remove')" 
      class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
      title="Remove file"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
</style>
