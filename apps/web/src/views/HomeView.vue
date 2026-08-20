<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import {
  FileText,
  Download,
  RefreshCw,
  Scissors,
  Check,
  Settings2,
  LayoutGrid,
  List,
  Globe,
  Stamp,
} from 'lucide-vue-next'

import DropZone from '../components/DropZone.vue'
import FileInfo from '../components/FileInfo.vue'
import ProgressBar from '../components/ProgressBar.vue'
import PdfPreview from '../components/PdfPreview.vue'
import PageGrid from '../components/PageGrid.vue'
import WatermarkSettings from '../components/WatermarkSettings.vue'
import WatermarkPreview from '../components/WatermarkPreview.vue'
import {
  DEFAULT_WATERMARK_CONFIG,
  applyWatermarkToPdf
} from '../utils/watermark'

const { t, locale } = useI18n()

// Active Tool Tab: 'split' | 'watermark'
const activeTab = ref('watermark') // Default to watermark per user's current focus, or split

const file = ref(null)
const splitMode = ref('all') // 'all' | 'range' | 'select'
const rangeInput = ref('')
const selectedPages = ref([])
const mergePages = ref(false)
const processing = ref(false)
const progress = ref(0)
const progressText = ref('')
const resultFile = ref(null)
const showResult = ref(false)
const totalPages = ref(0)

// Watermark state
const watermarkConfig = ref({ ...DEFAULT_WATERMARK_CONFIG })

// Preview pages for Splitter
const startPage = ref(1)
const endPage = ref(1)

const toggleLanguage = () => {
  const newLocale = locale.value === 'en' ? 'zh' : 'en'
  locale.value = newLocale
  localStorage.setItem('user-locale', newLocale)
}

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
  resultFile.value = null
  processing.value = false
  progress.value = 0
  rangeInput.value = ''
  selectedPages.value = []
  splitMode.value = 'all'
  mergePages.value = false
}

watch(file, async (newFile) => {
  if (newFile) {
    try {
      const arrayBuffer = await newFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      totalPages.value = pdfDoc.getPageCount()
      endPage.value = totalPages.value
      startPage.value = 1
    } catch (e) {
      console.error('Failed to parse PDF info:', e)
    }
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
    console.error('Invalid page range:', e)
  }
}

const parsePageRange = (rangeStr, maxPages) => {
  const pages = new Set()
  const parts = rangeStr.split(',')
  for (const part of parts) {
    const p = part.trim()
    if (!p) continue
    if (p.includes('-')) {
      const nums = p.split('-').map((n) => parseInt(n.trim(), 10))
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

// Process PDF Split or Merge
const processSplitPDF = async () => {
  if (!file.value) return
  processing.value = true
  showResult.value = false
  resultFile.value = null

  try {
    const arrayBuffer = await file.value.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const totalCount = pdfDoc.getPageCount()

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

    const totalProcessing = targetPages.length

    if (mergePages.value) {
      progressText.value = t('process.merging')
      const mergedPdf = await PDFDocument.create()
      const pageIndices = targetPages.map((p) => p - 1)

      const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices)
      copiedPages.forEach((page) => mergedPdf.addPage(page))

      progress.value = 100
      progressText.value = t('process.finalizingPdf')
      const pdfBytes = await mergedPdf.save()
      resultFile.value = new Blob([pdfBytes], { type: 'application/pdf' })
    } else {
      const zip = new JSZip()
      const baseName = file.value.name.replace('.pdf', '')

      for (let i = 0; i < totalProcessing; i++) {
        const pageNum = targetPages[i]
        const pageIndex = pageNum - 1
        progress.value = Math.round(((i + 1) / totalProcessing) * 100)
        progressText.value = t('process.processingPage', {
          page: pageNum,
          current: i + 1,
          total: totalProcessing
        })

        const newPdf = await PDFDocument.create()
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex])
        newPdf.addPage(copiedPage)

        const pdfBytes = await newPdf.save()
        const paddedNum = pageNum
          .toString()
          .padStart(Math.max(3, totalCount.toString().length), '0')
        zip.file(`${baseName}_page_${paddedNum}.pdf`, pdfBytes)

        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      progressText.value = t('process.finalizingZip')
      resultFile.value = await zip.generateAsync({ type: 'blob' })
    }

    showResult.value = true
  } catch (err) {
    console.error(err)
    alert(err.message || 'An error occurred')
  } finally {
    processing.value = false
  }
}

// Process Watermark Application
const processWatermarkPDF = async () => {
  if (!file.value) return
  processing.value = true
  showResult.value = false
  resultFile.value = null

  try {
    progressText.value = t('watermark.processing', {
      current: 1,
      total: totalPages.value || 1
    })
    const watermarkedBlob = await applyWatermarkToPdf(
      file.value,
      watermarkConfig.value,
      ({ current, total, percent }) => {
        progress.value = percent
        progressText.value = t('watermark.processing', { current, total })
      }
    )

    progressText.value = t('watermark.finalizing')
    progress.value = 100
    resultFile.value = watermarkedBlob
    showResult.value = true
  } catch (err) {
    console.error('Failed to watermark PDF:', err)
    alert(err.message || 'An error occurred while adding watermark')
  } finally {
    processing.value = false
  }
}

const downloadResult = () => {
  if (resultFile.value && file.value) {
    const baseName = file.value.name.replace('.pdf', '')
    if (activeTab.value === 'watermark') {
      saveAs(resultFile.value, `${baseName}_watermarked.pdf`)
    } else if (mergePages.value) {
      saveAs(resultFile.value, `${baseName}_merged.pdf`)
    } else {
      saveAs(resultFile.value, `${baseName}_split.zip`)
    }
  }
}

const startOver = () => {
  showResult.value = false
  resultFile.value = null
}

const selectAll = () => {
  if (!totalPages.value) return
  selectedPages.value = Array.from(
    { length: totalPages.value },
    (_, i) => i + 1
  )
}

const deselectAll = () => {
  selectedPages.value = []
}

const invertSelection = () => {
  if (!totalPages.value) return
  const currentSet = new Set(selectedPages.value)
  const newSelection = []
  for (let i = 1; i <= totalPages.value; i++) {
    if (!currentSet.has(i)) {
      newSelection.push(i)
    }
  }
  selectedPages.value = newSelection
}

const isAllSelected = computed(
  () => totalPages.value > 0 && selectedPages.value.length === totalPages.value
)
const isIndeterminate = computed(
  () =>
    selectedPages.value.length > 0 &&
    selectedPages.value.length < totalPages.value
)

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    deselectAll()
  } else {
    selectAll()
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 transition-all duration-300">
    <!-- Top Bar: Navigation & Lang Switcher -->
    <header class="w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      <!-- App Branding -->
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
          <FileText class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-tight flex items-center gap-2">
            {{ $t('app.title') }}
            <span
              class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Local & Safe
            </span>
          </h1>
          <p class="text-xs text-muted-foreground">{{ $t('app.subtitle') }}</p>
        </div>
      </div>

      <!-- Tabs & Language Toggle -->
      <div class="flex items-center gap-3">
        <!-- Mode Switcher Tabs -->
        <div class="flex p-1 bg-muted rounded-xl border shadow-inner">
          <button @click="
            activeTab = 'watermark'
          resetState()
            " class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all" :class="activeTab === 'watermark'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              ">
            <Stamp class="w-4 h-4 text-primary" />
            {{ $t('nav.watermark') }}
          </button>
          <button @click="
            activeTab = 'split'
          resetState()
            " class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all" :class="activeTab === 'split'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              ">
            <Scissors class="w-4 h-4 text-primary" />
            {{ $t('nav.split') }}
          </button>
        </div>

        <!-- Lang Switcher -->
        <button @click="toggleLanguage"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium transition-colors border shadow-sm">
          <Globe class="w-3.5 h-3.5" />
          {{ locale === 'en' ? 'English' : '中文' }}
        </button>
      </div>
    </header>

    <main class="w-full relative" :class="[file ? 'max-w-7xl' : 'max-w-xl']">
      <!-- Upload State -->
      <div v-if="!file" class="animate-fade-in my-8">
        <DropZone v-model="file" @file-dropped="handleFileDropped" />
      </div>

      <!-- Config State -->
      <div v-else class="animate-fade-in rounded-2xl border bg-card text-card-foreground shadow-md">
        <div class="p-6 md:p-8">
          <!-- Controls (Hidden during processing/result) -->
          <div v-if="!processing && !showResult" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <!-- LEFT COLUMN: Controls -->
            <div class="lg:col-span-5 space-y-6 flex flex-col">
              <FileInfo :file="file" @remove="removeFile" />

              <!-- TAB 1: WATERMARK SETTINGS -->
              <div v-if="activeTab === 'watermark'" class="animate-fade-in">
                <WatermarkSettings v-model="watermarkConfig" :total-pages="totalPages" @apply="processWatermarkPDF" />
              </div>

              <!-- TAB 2: SPLIT SETTINGS -->
              <div v-else class="space-y-6 animate-fade-in">
                <div class="space-y-4">
                  <div class="flex items-center gap-2 pb-2 border-b">
                    <Settings2 class="w-5 h-5 text-primary" />
                    <h3 class="font-semibold text-lg">
                      {{ $t('sidebar.splitMode') }}
                    </h3>
                  </div>

                  <div class="grid gap-4">
                    <!-- All Pages -->
                    <div
                      class="relative items-start flex gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50"
                      :class="splitMode === 'all'
                        ? 'border-primary ring-1 ring-primary bg-accent/20'
                        : 'border-input'
                        " @click="splitMode = 'all'">
                      <div class="mt-0.5">
                        <input type="radio" v-model="splitMode" value="all" class="sr-only" />
                        <List class="w-5 h-5" :class="splitMode === 'all'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                          " />
                      </div>
                      <div class="space-y-1">
                        <p class="font-medium leading-none">
                          {{ $t('sidebar.modes.all.title') }}
                        </p>
                        <p class="text-sm text-muted-foreground">
                          {{ $t('sidebar.modes.all.desc') }}
                        </p>
                      </div>
                    </div>

                    <!-- Custom Range -->
                    <div
                      class="relative items-start flex gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50"
                      :class="splitMode === 'range'
                        ? 'border-primary ring-1 ring-primary bg-accent/20'
                        : 'border-input'
                        " @click="splitMode = 'range'">
                      <div class="mt-0.5">
                        <input type="radio" v-model="splitMode" value="range" class="sr-only" />
                        <Scissors class="w-5 h-5" :class="splitMode === 'range'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                          " />
                      </div>
                      <div class="space-y-2 w-full">
                        <div class="space-y-1">
                          <p class="font-medium leading-none">
                            {{ $t('sidebar.modes.range.title') }}
                          </p>
                          <p class="text-sm text-muted-foreground">
                            {{ $t('sidebar.modes.range.desc') }}
                          </p>
                        </div>
                        <div v-if="splitMode === 'range'" class="animate-accordion-down overflow-hidden">
                          <input v-model="rangeInput" type="text" :placeholder="$t('sidebar.rangePlaceholder')"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            @click.stop />
                        </div>
                      </div>
                    </div>

                    <!-- Select Manually -->
                    <div
                      class="relative items-start flex gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50"
                      :class="splitMode === 'select'
                        ? 'border-primary ring-1 ring-primary bg-accent/20'
                        : 'border-input'
                        " @click="splitMode = 'select'">
                      <div class="mt-0.5">
                        <input type="radio" v-model="splitMode" value="select" class="sr-only" />
                        <LayoutGrid class="w-5 h-5" :class="splitMode === 'select'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                          " />
                      </div>
                      <div class="space-y-2 w-full">
                        <div class="space-y-1">
                          <p class="font-medium leading-none">
                            {{ $t('sidebar.modes.select.title') }}
                          </p>
                          <p class="text-sm text-muted-foreground">
                            {{ $t('sidebar.modes.select.desc') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center space-x-2 mt-4">
                  <input type="checkbox" id="merge" v-model="mergePages"
                    class="rounded border-input bg-background/50 text-primary w-4 h-4 focus:ring-primary/20 transition-all" />
                  <label for="merge"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground select-none cursor-pointer">
                    {{ $t('sidebar.mergeLabel') }}
                  </label>
                </div>

                <button @click="processSplitPDF"
                  class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4 shadow-md font-semibold">
                  {{
                    mergePages ? $t('sidebar.mergeBtn') : $t('sidebar.splitBtn')
                  }}
                </button>
              </div>
            </div>

            <!-- RIGHT COLUMN: Preview -->
            <div class="lg:col-span-7 flex flex-col h-full bg-muted/20 rounded-2xl border p-6 min-h-[520px]">
              <!-- Watermark Live Preview -->
              <div v-if="activeTab === 'watermark'" class="w-full h-full flex flex-col">
                <WatermarkPreview :file="file" :config="watermarkConfig" />
              </div>

              <!-- Splitter Preview -->
              <div v-else class="w-full h-full flex flex-col">
                <div class="flex items-center justify-between mb-6">
                  <h3
                    class="font-semibold text-lg flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs">
                    <FileText class="w-4 h-4" /> {{ $t('preview.title') }}
                  </h3>
                  <div v-if="splitMode === 'select'" class="flex items-center gap-4 animate-fade-in">
                    <label
                      class="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
                      <input type="checkbox" :checked="isAllSelected" :indeterminate="isIndeterminate"
                        @change="toggleSelectAll"
                        class="rounded border-input bg-background/50 text-primary w-4 h-4 focus:ring-primary/20 transition-all cursor-pointer" />
                      {{ $t('sidebar.selectAll') }}
                    </label>
                    <button @click="invertSelection"
                      class="text-xs px-2 py-1.5 rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                      {{ $t('sidebar.invertSelect') }}
                    </button>
                  </div>
                </div>

                <div class="flex-grow flex items-center justify-center w-full">
                  <div v-show="splitMode !== 'select'" class="w-full flex justify-center">
                    <PdfPreview v-if="file" :file="file" :start-page="startPage" :end-page="endPage" />
                  </div>
                  <div v-show="splitMode === 'select'" class="w-full h-full flex flex-col">
                    <PageGrid v-if="file" :file="file" v-model="selectedPages" class="flex-grow" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Processing State -->
          <div v-if="processing" class="py-16 animate-fade-in max-w-lg mx-auto">
            <ProgressBar :progress="progress" :text="progressText" />
          </div>

          <!-- Result State -->
          <div v-if="showResult" class="py-12 text-center animate-fade-in flex flex-col items-center">
            <div
              class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
              <Check class="w-8 h-8" />
            </div>
            <h3 class="text-2xl font-bold mb-2">{{ $t('result.title') }}</h3>
            <p class="text-muted-foreground mb-8">
              {{
                activeTab === 'watermark'
                  ? $t('result.successWatermark')
                  : mergePages
                    ? $t('result.successMerge')
                    : $t('result.successSplit')
              }}
            </p>

            <div class="flex flex-col sm:flex-row gap-4">
              <button @click="downloadResult"
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2 font-semibold">
                <Download class="w-4 h-4" />
                {{
                  activeTab === 'watermark'
                    ? $t('result.downloadPdf')
                    : mergePages
                      ? $t('result.downloadPdf')
                      : $t('result.downloadZip')
                }}
              </button>
              <button @click="startOver"
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground gap-2">
                <RefreshCw class="w-4 h-4" />
                {{ $t('result.startOver') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="mt-12 text-center text-sm text-muted-foreground px-4">
      <p>{{ $t('app.footer') }}</p>
    </footer>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
