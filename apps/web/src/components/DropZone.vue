<script setup>
import { ref } from 'vue'

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
    alert('Please upload a PDF file.')
    return
  }
  emit('update:modelValue', file)
  emit('file-dropped', file)
}

const triggerFileInput = () => {
  fileInput.value.click()
}

// Global drag handling is done in App or here for local zone
</script>

<template>
  <div 
    @dragenter.prevent="isDragOver = true"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop="handleDrop"
    @click="triggerFileInput"
    class="relative rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer overflow-hidden group"
    :class="[
      isDragOver ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
    ]"
  >
    <div class="flex flex-col items-center justify-center space-y-4 text-center">
      <div class="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-purple-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-slate-200">Drag & Drop your PDF here</h3>
        <p class="text-sm text-slate-400 mt-1">or click to browse</p>
      </div>
    </div>
    <input 
      ref="fileInput"
      type="file" 
      accept=".pdf" 
      class="hidden" 
      @change="handleFileSelect"
      @click="$event.target.value = null" 
    />
  </div>
</template>
