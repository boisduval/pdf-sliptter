<script setup>
import { computed } from 'vue'
import { File as FileIcon, X } from 'lucide-vue-next'

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
  <div v-if="file" class="flex items-center justify-between p-4 bg-muted/40 rounded-lg border animate-slide-down group">
    <div class="flex items-center gap-3 overflow-hidden">
      <div class="p-2 bg-background rounded-md border shadow-sm">
        <FileIcon class="w-5 h-5 text-primary" />
      </div>
      <div class="flex flex-col overflow-hidden">
        <span class="font-medium truncate text-sm">{{ file.name }}</span>
        <span class="text-xs text-muted-foreground">{{ formattedSize }}</span>
      </div>
    </div>
    <button v-if="canRemove" @click.stop="$emit('remove')"
      class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
      title="Remove file">
      <X class="w-4 h-4" />
    </button>
  </div>
</template>

<style scoped>
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
</style>
