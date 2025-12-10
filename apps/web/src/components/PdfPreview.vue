<script setup>
import { onMounted, watch, ref, shallowRef, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { ZoomIn, X, ArrowRight } from 'lucide-vue-next'

import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'

// Set worker src dynamically
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const props = defineProps({
  file: File,
  startPage: { type: Number, default: 1 },
  endPage: { type: Number, default: 1 }
})

const startCanvas = ref(null)
const endCanvas = ref(null)
const modalCanvas = ref(null)
const pdfDoc = shallowRef(null)


const showModal = ref(false)
const modalPageNum = ref(1)

const loadPdf = async () => {
  if (!props.file) return
  const arrayBuffer = await props.file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  pdfDoc.value = await loadingTask.promise
  updatePreviews()
}

const renderPage = async (pageNum, canvas, qualityScale = 300) => {
  if (!pdfDoc.value || !canvas || pageNum < 1 || pageNum > pdfDoc.value.numPages) return

  const page = await pdfDoc.value.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1.0 })

  let scale = 1.0
  if (qualityScale > 5) { // It's likely a target width
    scale = qualityScale / viewport.width
  } else {
    scale = qualityScale // It's a multiplier
  }

  const scaledViewport = page.getViewport({ scale })

  const context = canvas.getContext('2d')
  canvas.height = scaledViewport.height
  canvas.width = scaledViewport.width

  await page.render({
    canvasContext: context,
    viewport: scaledViewport
  }).promise
}

const updatePreviews = async () => {
  if (!pdfDoc.value) return
  await renderPage(props.startPage, startCanvas.value, 300)
  await renderPage(props.endPage, endCanvas.value, 300)
}

const openPreview = async (pageNum) => {
  modalPageNum.value = pageNum
  showModal.value = true
  await nextTick()
  await renderPage(pageNum, modalCanvas.value, 2.0)
}

const closeModal = () => {
  showModal.value = false
}

watch(() => props.file, loadPdf, { immediate: true })
watch(() => [props.startPage, props.endPage], updatePreviews)

defineExpose({
  numPages: () => pdfDoc.value ? pdfDoc.value.numPages : 0
})
</script>

<template>
  <div
    class="flex items-center justify-center gap-8 mt-6 p-8 bg-background rounded-lg border border-border shadow-sm animate-fade-in">
    <!-- Start Page -->
    <div class="flex flex-col items-center gap-3">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Page</span>
      <div @click="openPreview(startPage)"
        class="w-[120px] aspect-[1/1.4] bg-muted rounded-md overflow-hidden border border-input shadow-sm relative group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
        title="Click to zoom">
        <canvas ref="startCanvas" class="w-full h-full object-contain pointer-events-none bg-white"></canvas>
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
          <ZoomIn class="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <span class="text-sm font-medium text-foreground bg-muted px-2 py-0.5 rounded">Page {{ startPage }}</span>
    </div>

    <!-- Separator -->
    <div class="text-muted-foreground/30">
      <ArrowRight class="w-6 h-6" />
    </div>

    <!-- End Page -->
    <div class="flex flex-col items-center gap-3">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Page</span>
      <div @click="openPreview(endPage)"
        class="w-[120px] aspect-[1/1.4] bg-muted rounded-md overflow-hidden border border-input shadow-sm relative group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
        title="Click to zoom">
        <canvas ref="endCanvas" class="w-full h-full object-contain pointer-events-none bg-white"></canvas>
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
          <ZoomIn class="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <span class="text-sm font-medium text-foreground bg-muted px-2 py-0.5 rounded">Page {{ endPage }}</span>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 md:p-8"
          @click="closeModal">
          <div class="relative max-h-full max-w-full overflow-hidden flex flex-col items-center justify-center"
            @click.stop>
            <div class="absolute top-4 right-4 z-50">
              <button @click="closeModal"
                class="rounded-full bg-background/90 p-2 text-foreground hover:bg-muted transition-colors border shadow-sm">
                <X class="w-5 h-5" />
              </button>
            </div>
            <div class="bg-card p-2 rounded-lg border shadow-lg overflow-auto max-h-[85vh] max-w-[90vw]">
              <canvas ref="modalCanvas" class="max-w-full h-auto object-contain bg-white rounded"></canvas>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
