<script setup>
import { ref, watch } from 'vue'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { FileText, Download, RefreshCw, Scissors, Check, Settings2, LayoutGrid, List } from 'lucide-vue-next'
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
    <div
        class="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <header class="text-center mb-12 animate-fade-in-down max-w-2xl">
            <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">PDF Splitter</h1>
            <p class="text-muted-foreground text-lg">Instantly separate your PDF into individual pages with privacy and
                ease.</p>
        </header>

        <main class="w-full relative" :class="[file ? 'max-w-7xl' : 'max-w-xl']">
            <!-- Upload State -->
            <div v-if="!file" class="animate-fade-in">
                <DropZone v-model="file" @file-dropped="handleFileDropped" />
            </div>

            <!-- Config State -->
            <div v-else class="animate-fade-in rounded-xl border bg-card text-card-foreground shadow-sm">

                <div class="p-6 md:p-8">
                    <!-- Controls (Hidden during processing/result) -->
                    <div v-if="!processing && !showResult" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                        <!-- LEFT COLUMN: Controls -->
                        <div class="lg:col-span-5 space-y-8 flex flex-col">
                            <FileInfo :file="file" @remove="removeFile" />

                            <div class="space-y-4">
                                <div class="flex items-center gap-2 pb-2 border-b">
                                    <Settings2 class="w-5 h-5 text-primary" />
                                    <h3 class="font-semibold text-lg">Split Mode</h3>
                                </div>

                                <div class="grid gap-4">
                                    <!-- All Pages -->
                                    <div class="relative items-start flex gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50"
                                        :class="splitMode === 'all' ? 'border-primary ring-1 ring-primary bg-accent/20' : 'border-input'"
                                        @click="splitMode = 'all'">
                                        <div class="mt-0.5">
                                            <input type="radio" v-model="splitMode" value="all" class="sr-only" />
                                            <List class="w-5 h-5"
                                                :class="splitMode === 'all' ? 'text-primary' : 'text-muted-foreground'" />
                                        </div>
                                        <div class="space-y-1">
                                            <p class="font-medium leading-none">All Pages</p>
                                            <p class="text-sm text-muted-foreground">Extract every single page into a
                                                separate file.</p>
                                        </div>
                                    </div>

                                    <!-- Custom Range -->
                                    <div class="relative items-start flex gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50"
                                        :class="splitMode === 'range' ? 'border-primary ring-1 ring-primary bg-accent/20' : 'border-input'"
                                        @click="splitMode = 'range'">
                                        <div class="mt-0.5">
                                            <input type="radio" v-model="splitMode" value="range" class="sr-only" />
                                            <Scissors class="w-5 h-5"
                                                :class="splitMode === 'range' ? 'text-primary' : 'text-muted-foreground'" />
                                        </div>
                                        <div class="space-y-2 w-full">
                                            <div class="space-y-1">
                                                <p class="font-medium leading-none">Custom Range</p>
                                                <p class="text-sm text-muted-foreground">Extract specific ranges (e.g.
                                                    1-5, 8).</p>
                                            </div>
                                            <div v-if="splitMode === 'range'"
                                                class="animate-accordion-down overflow-hidden">
                                                <input v-model="rangeInput" type="text" placeholder="e.g. 1-5, 8, 11-13"
                                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    @click.stop />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Select Manually -->
                                    <div class="relative items-start flex gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50"
                                        :class="splitMode === 'select' ? 'border-primary ring-1 ring-primary bg-accent/20' : 'border-input'"
                                        @click="splitMode = 'select'">
                                        <div class="mt-0.5">
                                            <input type="radio" v-model="splitMode" value="select" class="sr-only" />
                                            <LayoutGrid class="w-5 h-5"
                                                :class="splitMode === 'select' ? 'text-primary' : 'text-muted-foreground'" />
                                        </div>
                                        <div class="space-y-1">
                                            <p class="font-medium leading-none">Select Manually</p>
                                            <p class="text-sm text-muted-foreground">Pick pages visually from the grid.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button @click="processPDF"
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4 shadow-md">
                                Split PDF
                            </button>
                        </div>

                        <!-- RIGHT COLUMN: Preview -->
                        <div class="lg:col-span-7 flex flex-col h-full bg-muted/30 rounded-xl border p-6 min-h-[500px]">
                            <h3
                                class="font-semibold text-lg mb-6 flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs">
                                <FileText class="w-4 h-4" /> Preview
                            </h3>

                            <div class="flex-grow flex items-center justify-center w-full">
                                <div v-if="splitMode !== 'select'" class="w-full flex justify-center">
                                    <PdfPreview v-if="file" :file="file" :start-page="startPage" :end-page="endPage" />
                                </div>
                                <div v-else class="w-full h-full flex flex-col">
                                    <PageGrid v-if="file" :file="file" v-model="selectedPages" class="flex-grow" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Processing State -->
                    <div v-if="processing" class="py-12 animate-fade-in max-w-lg mx-auto">
                        <ProgressBar :progress="progress" :text="progressText" />
                    </div>

                    <!-- Result State -->
                    <div v-if="showResult" class="py-12 text-center animate-fade-in flex flex-col items-center">
                        <div
                            class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
                            <Check class="w-8 h-8" />
                        </div>
                        <h3 class="text-2xl font-bold mb-2">Ready for Download!</h3>
                        <p class="text-muted-foreground mb-8">Your PDF pages have been successfully split.</p>

                        <div class="flex flex-col sm:flex-row gap-4">
                            <button @click="downloadZip"
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2">
                                <Download class="w-4 h-4" /> Download ZIP
                            </button>
                            <button @click="startOver"
                                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground gap-2">
                                <RefreshCw class="w-4 h-4" /> Split Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="mt-12 text-center text-sm text-muted-foreground">
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
