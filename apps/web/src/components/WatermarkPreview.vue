<script setup>
import { ref, shallowRef, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import * as pdfjsLib from 'pdfjs-dist'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  X,
  FileText,
  AlertCircle
} from 'lucide-vue-next'
import { drawWatermarkOnCanvas, resolveTargetPages } from '../utils/watermark'

import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const { t } = useI18n()

const props = defineProps({
  file: File,
  config: {
    type: Object,
    required: true
  }
})

const currentPage = ref(1)
const totalPages = ref(1)
const pdfDoc = shallowRef(null)
const rendering = ref(false)

// Canvas references
const pdfCanvas = ref(null)
const watermarkCanvas = ref(null)
const modalPdfCanvas = ref(null)
const modalWatermarkCanvas = ref(null)

const showModal = ref(false)
const zoomScale = ref(1.0)

// Target pages check
const isWatermarkActiveOnCurrentPage = computed(() => {
  if (!props.config || totalPages.value < 1) return true
  const activePages = resolveTargetPages(props.config, totalPages.value)
  return activePages.includes(currentPage.value)
})

const loadPdf = async () => {
  if (!props.file) return
  try {
    const arrayBuffer = await props.file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    pdfDoc.value = await loadingTask.promise
    totalPages.value = pdfDoc.value.numPages
    currentPage.value = 1
    await renderCurrentPage()
  } catch (e) {
    console.error('Error loading PDF in WatermarkPreview:', e)
  }
}

const renderCurrentPage = async () => {
  if (!pdfDoc.value || !pdfCanvas.value || rendering.value) return
  rendering.value = true

  try {
    const page = await pdfDoc.value.getPage(currentPage.value)
    const unscaledViewport = page.getViewport({ scale: 1.0 })

    // Calculate preview container fit scale (e.g. target display width ~ 480px)
    const targetWidth = 480
    const scale = targetWidth / unscaledViewport.width
    const viewport = page.getViewport({ scale })

    const pCanvas = pdfCanvas.value
    pCanvas.width = viewport.width
    pCanvas.height = viewport.height

    const ctx = pCanvas.getContext('2d')
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise

    // Render Watermark Layer
    renderWatermarkOverlay(viewport.width, viewport.height)
  } catch (err) {
    console.error('Error rendering preview page:', err)
  } finally {
    rendering.value = false
  }
}

const renderWatermarkOverlay = (w, h) => {
  if (!watermarkCanvas.value) return
  const wmCanvas = watermarkCanvas.value
  if (!isWatermarkActiveOnCurrentPage.value) {
    const ctx = wmCanvas.getContext('2d')
    ctx.clearRect(0, 0, wmCanvas.width, wmCanvas.height)
    return
  }
  drawWatermarkOnCanvas(wmCanvas, w, h, props.config, 1.0)
}

const renderModalPreview = async () => {
  if (!pdfDoc.value || !modalPdfCanvas.value) return
  try {
    const page = await pdfDoc.value.getPage(currentPage.value)
    const scale = 2.0
    const viewport = page.getViewport({ scale })

    const pCanvas = modalPdfCanvas.value
    pCanvas.width = viewport.width
    pCanvas.height = viewport.height

    const ctx = pCanvas.getContext('2d')
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise

    if (modalWatermarkCanvas.value && isWatermarkActiveOnCurrentPage.value) {
      drawWatermarkOnCanvas(
        modalWatermarkCanvas.value,
        viewport.width,
        viewport.height,
        props.config,
        1.0
      )
    }
  } catch (err) {
    console.error('Error rendering modal preview:', err)
  }
}

const openModal = async () => {
  showModal.value = true
  await nextTick()
  renderModalPreview()
}

const closeModal = () => {
  showModal.value = false
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    renderCurrentPage()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    renderCurrentPage()
  }
}

// Watchers
watch(() => props.file, loadPdf, { immediate: true })
watch(
  () => props.config,
  () => {
    if (pdfCanvas.value) {
      renderWatermarkOverlay(pdfCanvas.value.width, pdfCanvas.value.height)
    }
    if (showModal.value && modalPdfCanvas.value) {
      renderModalPreview()
    }
  },
  { deep: true }
)
</script>

<template>
  <div
    class="flex flex-col items-center w-full h-full justify-between select-none"
  >
    <!-- Top Toolbar: Page navigation & Status -->
    <div class="flex items-center justify-between w-full mb-4 px-2">
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
        >
          <FileText class="w-4 h-4" /> {{ t('preview.title') }}
        </span>
        <span
          v-if="!isWatermarkActiveOnCurrentPage"
          class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1"
        >
          <AlertCircle class="w-3 h-3" /> {{ t('watermark.skippedOnThisPage') }}
        </span>
      </div>

      <!-- Page Switcher -->
      <div
        class="flex items-center gap-2 bg-background border border-border rounded-lg px-2 py-1 shadow-sm"
      >
        <button
          @click="prevPage"
          :disabled="currentPage <= 1"
          class="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-xs font-mono font-medium px-1">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Center: Interactive Preview Canvas Container -->
    <div
      class="relative flex-1 flex items-center justify-center w-full min-h-[380px] p-2"
    >
      <div
        @click="openModal"
        class="relative rounded-lg overflow-hidden shadow-xl border border-border bg-white cursor-pointer group hover:ring-2 hover:ring-primary/40 transition-all max-w-full"
        title="Click to Zoom"
      >
        <!-- PDF Base Layer -->
        <canvas
          ref="pdfCanvas"
          class="block max-w-full max-h-[480px] object-contain"
        ></canvas>

        <!-- Watermark Overlay Layer -->
        <canvas
          ref="watermarkCanvas"
          class="absolute inset-0 w-full h-full pointer-events-none"
        ></canvas>

        <!-- Zoom Hover Button Overlay -->
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center"
        >
          <div
            class="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-1.5 backdrop-blur-sm"
          >
            <ZoomIn class="w-3.5 h-3.5" /> {{ t('preview.zoomIn') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom hint -->
    <div class="mt-3 text-center">
      <p class="text-[11px] text-muted-foreground">
        {{ t('watermark.previewHint') }}
      </p>
    </div>

    <!-- Fullscreen Zoom Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4 md:p-8"
          @click="closeModal"
        >
          <div
            class="relative w-full h-full max-w-6xl flex flex-col items-center justify-center pointer-events-none"
            @click.stop
          >
            <div
              class="absolute top-2 right-2 z-50 pointer-events-auto flex items-center gap-3"
            >
              <button
                @click="closeModal"
                class="rounded-full bg-background/80 hover:bg-background p-2 text-foreground transition-colors border shadow-md backdrop-blur-md"
              >
                <X class="w-6 h-6" />
              </button>
            </div>

            <div
              class="w-full h-full flex items-center justify-center overflow-auto p-4 pointer-events-auto"
            >
              <div
                class="relative shadow-2xl rounded-lg overflow-hidden bg-white max-w-full max-h-full"
              >
                <canvas
                  ref="modalPdfCanvas"
                  class="block max-w-full max-h-[85vh] object-contain"
                ></canvas>
                <canvas
                  ref="modalWatermarkCanvas"
                  class="absolute inset-0 w-full h-full pointer-events-none"
                ></canvas>
              </div>
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
