<template>
  <div class="space-y-4 w-full">
    <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div 
        class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
    <p class="text-sm text-slate-400 text-center">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  progress: Number,
  text: String
})
</script>
