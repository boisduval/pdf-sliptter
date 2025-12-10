<script setup>
import { onMounted, watch, ref, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker src dynamically
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

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

  // Calculate scale based on desired width (qualityScale) or just use viewport if qualityScale is scale factor
  // Current logic treats qualityScale as target width for thumbnails.
  // For modal, we might want actual scale factor or large width.

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
  // Render high quality for modal (e.g. width 1000 or scale 2)
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
    class="flex items-center justify-center gap-6 mt-8 p-6 bg-black/20 rounded-2xl border border-white/5 animate-fade-in">
    <!-- Start Page -->
    <div class="flex flex-col items-center">
      <span class="text-xs uppercase tracking-wider text-slate-400 mb-2">Start Page</span>
      <div @click="openPreview(startPage)"
        class="w-[100px] h-[140px] bg-slate-700 rounded-lg overflow-hidden border border-white/10 shadow-lg relative group cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all"
        title="Click to zoom">
        <canvas ref="startCanvas" class="w-full h-full object-contain pointer-events-none"></canvas>
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <svg v-if="pdfDoc" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
            stroke="currentColor"
            class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
        </div>
      </div>
      <span class="text-sm font-semibold mt-2 text-slate-200">Page {{ startPage }}</span>
    </div>

    <!-- Separator -->
    <div class="text-slate-600">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
      </svg>
    </div>

    <!-- End Page -->
    <div class="flex flex-col items-center">
      <span class="text-xs uppercase tracking-wider text-slate-400 mb-2">End Page</span>
      <div @click="openPreview(endPage)"
        class="w-[100px] h-[140px] bg-slate-700 rounded-lg overflow-hidden border border-white/10 shadow-lg relative group cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all"
        title="Click to zoom">
        <canvas ref="endCanvas" class="w-full h-full object-contain pointer-events-none"></canvas>
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <svg v-if="pdfDoc" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
            stroke="currentColor"
            class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
        </div>
      </div>
      <span class="text-sm font-semibold mt-2 text-slate-200">Page {{ endPage }}</span>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
          @click="closeModal">
          <div class="relative max-h-full max-w-full overflow-auto bg-transparent flex items-center justify-center"
            @click.stop>
            <button @click="closeModal"
              class="absolute -top-12 right-0 md:fixed md:top-8 md:right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all z-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <canvas ref="modalCanvas"
              class="rounded shadow-2xl max-w-full max-h-[90vh] object-contain bg-white"></canvas>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
