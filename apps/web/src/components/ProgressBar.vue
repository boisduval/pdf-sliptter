<template>
  <div class="space-y-2 w-full">
    <div class="h-2 bg-muted rounded-full overflow-hidden">
      <div class="h-full bg-primary transition-all duration-300 ease-out" :style="{ width: `${progress}%` }"></div>
    </div>
    <p class="text-xs text-muted-foreground text-center font-medium">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  progress: Number,
  text: String
})
</script>
