<script setup>
import { ref, shallowRef, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { Check, ZoomIn, X } from 'lucide-vue-next'

import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'

// Worker src is already set globally in App or PdfPreview, but good to ensure.
// We assume it's set or we set it again to be safe.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const props = defineProps({
    file: File,
    modelValue: { type: Array, default: () => [] } // Array of selected page numbers
})

const emit = defineEmits(['update:modelValue'])

const pdfDoc = shallowRef(null)
const numPages = ref(0)
const pages = ref([]) // { pageNum, isRendered }
const containerRef = ref(null)

// Modal State
const showModal = ref(false)
const modalPageNum = ref(1)
const modalCanvas = ref(null)

// Selection state
const togglePage = (pageNum) => {
    const current = new Set(props.modelValue)
    if (current.has(pageNum)) {
        current.delete(pageNum)
    } else {
        current.add(pageNum)
    }
    emit('update:modelValue', Array.from(current).sort((a, b) => a - b))
}

const isSelected = (pageNum) => {
    return props.modelValue.includes(pageNum)
}

const openPreview = async (pageNum) => {
    modalPageNum.value = pageNum
    showModal.value = true
    await nextTick()
    renderLargePage(pageNum)
}

const closeModal = () => {
    showModal.value = false
}

const renderLargePage = async (pageNum) => {
    if (!pdfDoc.value || !modalCanvas.value) return
    try {
        const page = await pdfDoc.value.getPage(pageNum)
        // High quality scale
        const scale = 3.0
        const viewport = page.getViewport({ scale })

        modalCanvas.value.height = viewport.height
        modalCanvas.value.width = viewport.width

        const context = modalCanvas.value.getContext('2d')
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise
    } catch (e) {
        console.error('Error rendering large preview', e)
    }
}

const loadPdf = async () => {
    if (!props.file) return
    try {
        const arrayBuffer = await props.file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        pdfDoc.value = pdf
        numPages.value = pdf.numPages

        // Reset pages state
        pages.value = Array.from({ length: pdf.numPages }, (_, i) => ({
            pageNum: i + 1,
            isRendered: false,
            aspectRatio: 0.7 // Default placeholder aspect ratio
        }))

        nextTick(() => {
            setupIntersectionObserver()
        })
    } catch (err) {
        console.error('Error loading PDF for grid:', err)
    }
}

// Intersection Observer for Lazy Loading
let observer = null

const setupIntersectionObserver = () => {
    if (observer) observer.disconnect()

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.dataset.page, 10)
                renderThumbnail(pageNum)
                observer.unobserve(entry.target)
            }
        })
    }, {
        root: null, // viewport
        rootMargin: '200px', // Preload a bit
        threshold: 0.01
    })

    // Observe all page placeholders
    const pageElements = containerRef.value.querySelectorAll('.page-placeholder')
    pageElements.forEach(el => observer.observe(el))
}

const renderThumbnail = async (pageNum) => {
    // Check if already rendered or no doc
    if (!pdfDoc.value || !pages.value[pageNum - 1]) return

    // Mark as processing to avoid double render calls if any
    if (pages.value[pageNum - 1].isRendered) return

    try {
        const page = await pdfDoc.value.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.0 })

        // We render small thumbnails
        const desiredWidth = 150
        const scale = desiredWidth / viewport.width
        const scaledViewport = page.getViewport({ scale })

        const canvas = document.querySelector(`canvas[data-page="${pageNum}"]`)
        if (!canvas) return

        canvas.height = scaledViewport.height
        canvas.width = scaledViewport.width

        const context = canvas.getContext('2d')
        await page.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise

        pages.value[pageNum - 1].isRendered = true
    } catch (e) {
        console.error(`Error rendering page ${pageNum}`, e)
    }
}

watch(() => props.file, loadPdf, { immediate: true })

onBeforeUnmount(() => {
    if (observer) observer.disconnect()
})
</script>

<template>
    <div class="mt-6 animate-fade-in" ref="containerRef">
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Pages to Extract
            </h3>
            <span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{{ modelValue.length }}
                selected</span>
        </div>

        <div
            class="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
            <div v-for="page in pages" :key="page.pageNum"
                class="relative flex flex-col items-center group cursor-pointer" @click="togglePage(page.pageNum)">
                <!-- Card -->
                <div class="page-placeholder relative w-full aspect-[1/1.4] rounded-lg overflow-hidden border-2 transition-all duration-200 shadow-sm bg-muted/20"
                    :class="[
                        isSelected(page.pageNum)
                            ? 'border-primary ring-2 ring-primary/20 scale-95'
                            : 'border-transparent hover:border-primary/20 hover:-translate-y-1'
                    ]" :data-page="page.pageNum">
                    <canvas :data-page="page.pageNum" class="w-full h-full object-contain bg-white"></canvas>

                    <!-- Loading State (if needed, visible before canvas renders) -->
                    <div v-if="!page.isRendered"
                        class="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin">
                        </div>
                    </div>

                    <!-- Actions Overlay (Zoom icon) -->
                    <button @click.stop="openPreview(page.pageNum)"
                        class="absolute top-2 right-2 w-7 h-7 bg-background/80 hover:bg-background rounded-full flex items-center justify-center text-foreground transition-all opacity-0 group-hover:opacity-100 z-10 shadow-sm"
                        title="View Large">
                        <ZoomIn class="w-4 h-4" />
                    </button>

                    <!-- Selection Overlay -->
                    <div class="absolute inset-0 transition-colors duration-200 flex items-center justify-center pointer-events-none"
                        :class="isSelected(page.pageNum) ? 'bg-primary/10' : 'bg-transparent group-hover:bg-black/5'">
                        <div v-if="isSelected(page.pageNum)"
                            class="bg-primary text-primary-foreground rounded-full p-1 shadow-lg transform scale-100 transition-transform">
                            <Check class="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <!-- Page Number -->
                <span class="mt-2 text-xs font-medium transition-colors"
                    :class="isSelected(page.pageNum) ? 'text-primary' : 'text-muted-foreground'">
                    Page {{ page.pageNum }}
                </span>
            </div>
        </div>

        <!-- Modal -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showModal"
                    class="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 md:p-8"
                    @click="closeModal">
                    <div class="relative w-full h-full max-w-7xl flex flex-col items-center justify-center pointer-events-none"
                        @click.stop>

                        <div class="absolute top-0 right-0 z-50 pointer-events-auto">
                            <button @click="closeModal"
                                class="rounded-full bg-background/50 hover:bg-background p-2 text-foreground transition-colors border shadow-sm backdrop-blur-md">
                                <X class="w-6 h-6" />
                            </button>
                        </div>

                        <div
                            class="w-full h-full flex items-center justify-center overflow-auto p-4 pointer-events-auto">
                            <canvas ref="modalCanvas"
                                class="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-white"></canvas>
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
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
}
</style>
