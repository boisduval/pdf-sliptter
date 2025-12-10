<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { UploadCloud } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  modelValue: File
})

const emit = defineEmits(['update:modelValue', 'file-dropped'])

const isDragOver = ref(false)
const fileInput = ref(null)

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    emitFile(files[0])
  }
}

const handleFileSelect = (e) => {
  if (e.target.files.length > 0) {
    emitFile(e.target.files[0])
  }
}

const emitFile = (file) => {
  if (file.type !== 'application/pdf') {
    alert(t('dropzone.alert'))
    return
  }
  emit('update:modelValue', file)
  emit('file-dropped', file)
}

const triggerFileInput = () => {
  fileInput.value.click()
}
</script>

<template>
  <div @dragenter.prevent="isDragOver = true" @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false" @drop="handleDrop" @click="triggerFileInput"
    class="relative rounded-xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col items-center justify-center text-center bg-card"
    :class="[
      isDragOver
        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
    ]">
    <div class="mb-4 rounded-full bg-muted p-4 group-hover:scale-110 transition-transform duration-300">
      <UploadCloud class="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
    </div>

    <div class="space-y-1">
      <h3 class="text-lg font-semibold tracking-tight">{{ t('dropzone.dragText') }}</h3>
      <p class="text-sm text-muted-foreground">{{ t('dropzone.clickText') }}</p>
    </div>

    <input ref="fileInput" type="file" accept=".pdf" class="hidden" @change="handleFileSelect"
      @click="$event.target.value = null" />
  </div>
</template>
