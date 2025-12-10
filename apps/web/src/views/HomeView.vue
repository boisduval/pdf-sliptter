<script setup>
import { ref, watch } from 'vue'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import DropZone from '../components/DropZone.vue'
import FileInfo from '../components/FileInfo.vue'
import ProgressBar from '../components/ProgressBar.vue'
import PdfPreview from '../components/PdfPreview.vue'
import PageGrid from '../components/PageGrid.vue'

const file = ref(null)
const splitMode = ref('all') // 'all' | 'range' | 'select'
const rangeInput = ref('')
const selectedPages = ref([])
const processing = ref(false)
const progress = ref(0)
const progressText = ref('')
const resultZip = ref(null)
const showResult = ref(false)
const totalPages = ref(0)

// Preview pages
const startPage = ref(1)
const endPage = ref(1)

const handleFileDropped = (f) => {
    file.value = f
    resetState()
}

const removeFile = () => {
    file.value = null
    resetState()
}

const resetState = () => {
    showResult.value = false
    resultZip.value = null
    processing.value = false
    progress.value = 0
    rangeInput.value = ''
    selectedPages.value = []
    splitMode.value = 'all'
}

watch(file, async (newFile) => {
    if (newFile) {
        const arrayBuffer = await newFile.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        totalPages.value = pdfDoc.getPageCount()
        endPage.value = totalPages.value
        startPage.value = 1
    } else {
        totalPages.value = 0
    }
})

watch([rangeInput, splitMode], () => {
    if (splitMode.value === 'all') {
        startPage.value = 1
        endPage.value = totalPages.value || 1
    } else if (splitMode.value === 'range') {
        parseRangeForPreview()
    }
})

const parseRangeForPreview = () => {
    if (!rangeInput.value) {
        startPage.value = 1
        endPage.value = totalPages.value || 1
        return
    }
    try {
        const pages = parsePageRange(rangeInput.value, totalPages.value)
        if (pages.length > 0) {
            startPage.value = pages[0]
            endPage.value = pages[pages.length - 1]
        }
    } catch (e) {
    }
}

const parsePageRange = (rangeStr, maxPages) => {
    const pages = new Set()
    const parts = rangeStr.split(',')
    for (const part of parts) {
        const p = part.trim()
        if (!p) continue
        if (p.includes('-')) {
            const nums = p.split('-').map(n => parseInt(n.trim(), 10))
            if (nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) continue
            const [s, e] = nums
            const start = Math.max(1, s)
            const end = Math.min(maxPages, e)
            if (start > end) continue
            for (let i = start; i <= end; i++) pages.add(i)
        } else {
            const num = parseInt(p, 10)
            if (!isNaN(num) && num >= 1 && num <= maxPages) pages.add(num)
        }
    }
    return Array.from(pages).sort((a, b) => a - b)
}

const processPDF = async () => {
    if (!file.value) return
    processing.value = true
    showResult.value = false
    try {
        const arrayBuffer = await file.value.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const totalCount = pdfDoc.getPageCount()
        const zip = new JSZip()
        let targetPages = []
        if (splitMode.value === 'range' && rangeInput.value) {
            targetPages = parsePageRange(rangeInput.value, totalCount)
            if (targetPages.length === 0) throw new Error('No valid pages selected')
        } else if (splitMode.value === 'select') {
            targetPages = [...selectedPages.value].sort((a, b) => a - b)
            if (targetPages.length === 0) throw new Error('No pages selected')
        } else {
            targetPages = Array.from({ length: totalCount }, (_, i) => i + 1)
        }
        const baseName = file.value.name.replace('.pdf', '')
        const totalProcessing = targetPages.length
        for (let i = 0; i < totalProcessing; i++) {
            const pageNum = targetPages[i]
            const pageIndex = pageNum - 1
            progress.value = Math.round(((i + 1) / totalProcessing) * 100)
            progressText.value = `Processing page ${pageNum} (${i + 1}/${totalProcessing})...`
            const newPdf = await PDFDocument.create()
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex])
            newPdf.addPage(copiedPage)
            const pdfBytes = await newPdf.save()
            const paddedNum = pageNum.toString().padStart(Math.max(3, totalCount.toString().length), '0')
            zip.file(`${baseName}_page_${paddedNum}.pdf`, pdfBytes)
            await new Promise(resolve => setTimeout(resolve, 0))
        }
        progressText.value = 'Finalizing ZIP file...'
        resultZip.value = await zip.generateAsync({ type: 'blob' })
        showResult.value = true
    } catch (err) {
        console.error(err)
        alert(err.message || 'An error occurred')
    } finally {
        processing.value = false
    }
}

const downloadZip = () => {
    if (resultZip.value && file.value) {
        const fileName = `${file.value.name.replace('.pdf', '')}_split.zip`
        saveAs(resultZip.value, fileName)
    }
}

const startOver = () => {
    showResult.value = false
    resultZip.value = null
}
</script>

<template>
    <div class="w-full px-4 py-8 transition-all duration-300" :class="[file ? 'max-w-6xl' : 'max-w-2xl']">
        <header class="text-center mb-10 animate-fade-in-down">
            <h1 class="text-5xl font-bold mb-3 tracking-tight title-gradient">PDF Splitter</h1>
            <p class="text-slate-400 text-lg">Instantly separate your PDF into individual pages</p>
        </header>

        <main class="glass p-8 md:p-10 relative">
            <!-- Upload State -->
            <div v-if="!file" class="animate-fade-in">
                <DropZone v-model="file" @file-dropped="handleFileDropped" />
            </div>

            <!-- Config State -->
            <div v-else class="animate-fade-in">
                <!-- Controls (Hidden during processing/result) -->
                <div v-if="!processing && !showResult" class="grid grid-cols-1 lg:grid-cols-2 gap-10">

                    <!-- LEFT COLUMN: Controls -->
                    <div class="space-y-6 flex flex-col justify-center">
                        <FileInfo :file="file" @remove="removeFile" />

                        <div class="space-y-4">
                            <h3 class="text-slate-300 font-semibold uppercase tracking-wider text-sm">Split Mode</h3>
                            <div class="flex flex-col gap-3">
                                <label
                                    class="flex items-center gap-3 cursor-pointer group p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                    <input type="radio" v-model="splitMode" value="all"
                                        class="w-5 h-5 accent-purple-500 cursor-pointer" />
                                    <div class="flex flex-col">
                                        <span class="text-slate-200 font-medium">All Pages</span>
                                        <span class="text-xs text-slate-400">Extract every page into a separate
                                            file</span>
                                    </div>
                                </label>

                                <label
                                    class="flex items-center gap-3 cursor-pointer group p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                    <input type="radio" v-model="splitMode" value="range"
                                        class="w-5 h-5 accent-purple-500 cursor-pointer" />
                                    <div class="flex flex-col">
                                        <span class="text-slate-200 font-medium">Custom Range</span>
                                        <span class="text-xs text-slate-400">Extract specific page ranges (e.g. 1-5,
                                            8)</span>
                                    </div>
                                </label>

                                <div v-if="splitMode === 'range'" class="animate-slide-down ml-8">
                                    <input v-model="rangeInput" type="text" placeholder="e.g. 1-5, 8, 11-13"
                                        class="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm" />
                                </div>

                                <label
                                    class="flex items-center gap-3 cursor-pointer group p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                    <input type="radio" v-model="splitMode" value="select"
                                        class="w-5 h-5 accent-purple-500 cursor-pointer" />
                                    <div class="flex flex-col">
                                        <span class="text-slate-200 font-medium">Select Manually</span>
                                        <span class="text-xs text-slate-400">Pick pages visually from the grid</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button @click="processPDF"
                            class="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 relative overflow-hidden group">
                            <span class="relative z-10">Split PDF</span>
                            <div
                                class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            </div>
                        </button>
                    </div>

                    <!-- RIGHT COLUMN: Preview -->
                    <div
                        class="flex flex-col h-full bg-black/20 rounded-2xl border border-white/5 p-6 animate-fade-in min-h-[400px]">
                        <h3 class="text-slate-300 font-semibold uppercase tracking-wider text-sm mb-4">Preview</h3>

                        <div class="flex-grow flex items-center justify-center">
                            <div v-if="splitMode !== 'select'" class="w-full">
                                <PdfPreview v-if="file" :file="file" :start-page="startPage" :end-page="endPage" />
                            </div>
                            <div v-else class="w-full h-full flex flex-col">
                                <PageGrid v-if="file" :file="file" v-model="selectedPages" class="flex-grow" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Processing State -->
                <div v-if="processing" class="py-8 animate-fade-in">
                    <ProgressBar :progress="progress" :text="progressText" />
                </div>

                <!-- Result State -->
                <div v-if="showResult" class="py-6 text-center animate-fade-in">
                    <div class="inline-flex p-4 rounded-full bg-green-500/20 text-green-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-6">Ready for Download!</h3>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <button @click="downloadZip"
                            class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            Download ZIP
                        </button>
                        <button @click="startOver"
                            class="px-8 py-3 bg-transparent border-2 border-purple-500/50 text-purple-400 rounded-xl font-semibold hover:bg-purple-500/10 transition-all">
                            Split Again
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <footer class="text-center mt-8 text-slate-500 text-sm">
            <p>Private & Secure. Client-side processing.</p>
        </footer>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}

.animate-fade-in-down {
    animation: fadeInDown 0.6s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
