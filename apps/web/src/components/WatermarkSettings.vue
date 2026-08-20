<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Type,
  Sliders,
  Layers,
  RotateCw,
  Palette,
  Sparkles,
  Grid,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  totalPages: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:modelValue', 'apply'])

const config = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const updateField = (field, val) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: val
  })
}

// Preset color list
const presetColors = [
  { name: 'Gray', value: '#94a3b8' },
  { name: 'Dark Gray', value: '#475569' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Black', value: '#0f172a' }
]

// Preset templates
const templates = [
  { label: '机密文件', text: '机密文件 · 请勿外传' },
  { label: '内部使用', text: '仅供内部使用 · 他用无效' },
  { label: 'CONFIDENTIAL', text: 'CONFIDENTIAL' },
  { label: 'DRAFT', text: 'DRAFT · 草稿' },
  { label: '带日期', text: '仅供业务核验使用 ({{date}})' }
]

const fontFamilies = [
  { label: '系统无衬线 (Sans-Serif)', value: 'sans-serif' },
  {
    label: '微软雅黑 (Microsoft YaHei)',
    value: '"Microsoft YaHei", sans-serif'
  },
  { label: '黑体 (SimHei)', value: 'SimHei, sans-serif' },
  { label: '宋体 (SimSun)', value: 'SimSun, serif' },
  { label: '楷体 (KaiTi)', value: 'KaiTi, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New (等宽)', value: '"Courier New", monospace' }
]

const fontWeights = [
  { label: '常规 (400)', value: '400' },
  { label: '中等 (500)', value: '500' },
  { label: '加粗 (700)', value: '700' },
  { label: '特粗 (900)', value: '900' }
]

const quickAngles = [-90, -45, -30, 0, 30, 45, 90]

const applyTemplate = (tpl) => {
  updateField('text', tpl.text)
}

const appendMacro = (macro) => {
  updateField('text', (config.value.text || '') + ' ' + macro)
}
</script>

<template>
  <div class="space-y-6">
    <!-- 1. Text & Templates -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label
          class="text-sm font-semibold flex items-center gap-1.5 text-foreground"
        >
          <Type class="w-4 h-4 text-primary" />
          {{ t('watermark.textLabel') }}
        </label>
        <div class="flex gap-1.5">
          <button
            type="button"
            @click="appendMacro('{{date}}')"
            class="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="插入当前日期 (YYYY-MM-DD)"
          >
            + 日期
          </button>
          <button
            type="button"
            @click="appendMacro('{{time}}')"
            class="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="插入当前时间 (HH:mm)"
          >
            + 时间
          </button>
        </div>
      </div>

      <textarea
        :value="config.text"
        @input="updateField('text', $event.target.value)"
        rows="2"
        :placeholder="t('watermark.textPlaceholder')"
        class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      ></textarea>

      <!-- Quick Template Badges -->
      <div class="flex flex-wrap items-center gap-1.5 pt-1">
        <span
          class="text-xs text-muted-foreground flex items-center gap-1 mr-1"
        >
          <Sparkles class="w-3 h-3 text-amber-500" />
          {{ t('watermark.templates') }}:
        </span>
        <button
          v-for="tpl in templates"
          :key="tpl.label"
          type="button"
          @click="applyTemplate(tpl)"
          class="text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-all"
        >
          {{ tpl.label }}
        </button>
      </div>
    </div>

    <!-- 2. Typography & Color -->
    <div class="space-y-4 pt-3 border-t border-border">
      <div class="grid grid-cols-2 gap-3">
        <!-- Font Family -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">{{
            t('watermark.fontFamily')
          }}</label>
          <select
            :value="config.fontFamily"
            @change="updateField('fontFamily', $event.target.value)"
            class="h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="f in fontFamilies" :key="f.value" :value="f.value">
              {{ f.label }}
            </option>
          </select>
        </div>

        <!-- Font Weight -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">{{
            t('watermark.fontWeight')
          }}</label>
          <select
            :value="config.fontWeight"
            @change="updateField('fontWeight', $event.target.value)"
            class="h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="w in fontWeights" :key="w.value" :value="w.value">
              {{ w.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Text Alignment -->
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-muted-foreground">{{
          t('watermark.textAlign')
        }}</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="updateField('textAlign', 'left')"
            class="flex items-center justify-center gap-1.5 h-8 rounded-md border text-xs transition-colors"
            :class="
              config.textAlign === 'left'
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-input hover:bg-accent/20 text-muted-foreground'
            "
            :title="t('watermark.alignLeft')"
          >
            <AlignLeft class="w-3.5 h-3.5" />
            <span>{{ t('watermark.alignLeft') }}</span>
          </button>
          <button
            type="button"
            @click="updateField('textAlign', 'center')"
            class="flex items-center justify-center gap-1.5 h-8 rounded-md border text-xs transition-colors"
            :class="
              !config.textAlign || config.textAlign === 'center'
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-input hover:bg-accent/20 text-muted-foreground'
            "
            :title="t('watermark.alignCenter')"
          >
            <AlignCenter class="w-3.5 h-3.5" />
            <span>{{ t('watermark.alignCenter') }}</span>
          </button>
          <button
            type="button"
            @click="updateField('textAlign', 'right')"
            class="flex items-center justify-center gap-1.5 h-8 rounded-md border text-xs transition-colors"
            :class="
              config.textAlign === 'right'
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-input hover:bg-accent/20 text-muted-foreground'
            "
            :title="t('watermark.alignRight')"
          >
            <AlignRight class="w-3.5 h-3.5" />
            <span>{{ t('watermark.alignRight') }}</span>
          </button>
        </div>
      </div>

      <!-- Font Size Slider -->
      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span class="font-medium text-muted-foreground">{{
            t('watermark.fontSize')
          }}</span>
          <span class="font-mono text-primary font-semibold"
            >{{ config.fontSize }}px</span
          >
        </div>
        <input
          type="range"
          min="14"
          max="100"
          step="2"
          :value="config.fontSize"
          @input="updateField('fontSize', Number($event.target.value))"
          class="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      <!-- Color & Preset Picker -->
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span
            class="font-medium text-muted-foreground flex items-center gap-1"
          >
            <Palette class="w-3.5 h-3.5" /> {{ t('watermark.color') }}
          </span>
          <span class="font-mono uppercase text-muted-foreground">{{
            config.color
          }}</span>
        </div>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="config.color"
            @input="updateField('color', $event.target.value)"
            class="w-8 h-8 rounded border border-input cursor-pointer p-0 bg-transparent"
          />
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="c in presetColors"
              :key="c.value"
              type="button"
              @click="updateField('color', c.value)"
              class="w-6 h-6 rounded-full border transition-transform hover:scale-110"
              :class="
                config.color.toLowerCase() === c.value.toLowerCase()
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'border-border'
              "
              :style="{ backgroundColor: c.value }"
              :title="c.name"
            ></button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Layout & Count Mode (Single vs Tile) -->
    <div class="space-y-4 pt-3 border-t border-border">
      <div class="flex items-center justify-between">
        <label
          class="text-sm font-semibold flex items-center gap-1.5 text-foreground"
        >
          <Grid class="w-4 h-4 text-primary" />
          {{ t('watermark.layoutMode') }}
        </label>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          @click="updateField('mode', 'tile')"
          class="flex items-center gap-2 p-3 rounded-lg border text-left transition-all"
          :class="
            config.mode === 'tile'
              ? 'border-primary ring-1 ring-primary bg-accent/30 font-medium'
              : 'border-input hover:bg-accent/10'
          "
        >
          <Grid
            class="w-4 h-4"
            :class="
              config.mode === 'tile' ? 'text-primary' : 'text-muted-foreground'
            "
          />
          <div>
            <p class="text-xs font-semibold">{{ t('watermark.modeTile') }}</p>
            <p class="text-[11px] text-muted-foreground">
              {{ t('watermark.modeTileDesc') }}
            </p>
          </div>
        </button>

        <button
          type="button"
          @click="updateField('mode', 'single')"
          class="flex items-center gap-2 p-3 rounded-lg border text-left transition-all"
          :class="
            config.mode === 'single'
              ? 'border-primary ring-1 ring-primary bg-accent/30 font-medium'
              : 'border-input hover:bg-accent/10'
          "
        >
          <Square
            class="w-4 h-4"
            :class="
              config.mode === 'single'
                ? 'text-primary'
                : 'text-muted-foreground'
            "
          />
          <div>
            <p class="text-xs font-semibold">{{ t('watermark.modeSingle') }}</p>
            <p class="text-[11px] text-muted-foreground">
              {{ t('watermark.modeSingleDesc') }}
            </p>
          </div>
        </button>
      </div>

      <!-- Single Position Selector -->
      <div v-if="config.mode === 'single'" class="space-y-1.5 animate-fade-in">
        <label class="text-xs font-medium text-muted-foreground">{{
          t('watermark.position')
        }}</label>
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <button
            type="button"
            @click="updateField('position', 'topLeft')"
            class="p-2 rounded border transition-colors"
            :class="
              config.position === 'topLeft'
                ? 'border-primary bg-primary/10 font-bold text-primary'
                : 'border-input hover:bg-accent/20'
            "
          >
            {{ t('watermark.posTopLeft') }}
          </button>
          <button
            type="button"
            @click="updateField('position', 'center')"
            class="p-2 rounded border transition-colors col-span-1"
            :class="
              config.position === 'center'
                ? 'border-primary bg-primary/10 font-bold text-primary'
                : 'border-input hover:bg-accent/20'
            "
          >
            {{ t('watermark.posCenter') }}
          </button>
          <button
            type="button"
            @click="updateField('position', 'topRight')"
            class="p-2 rounded border transition-colors"
            :class="
              config.position === 'topRight'
                ? 'border-primary bg-primary/10 font-bold text-primary'
                : 'border-input hover:bg-accent/20'
            "
          >
            {{ t('watermark.posTopRight') }}
          </button>
          <button
            type="button"
            @click="updateField('position', 'bottomLeft')"
            class="p-2 rounded border transition-colors"
            :class="
              config.position === 'bottomLeft'
                ? 'border-primary bg-primary/10 font-bold text-primary'
                : 'border-input hover:bg-accent/20'
            "
          >
            {{ t('watermark.posBottomLeft') }}
          </button>
          <div
            class="flex items-center justify-center text-muted-foreground text-[10px]"
          >
            {{ t('watermark.pos') }}
          </div>
          <button
            type="button"
            @click="updateField('position', 'bottomRight')"
            class="p-2 rounded border transition-colors"
            :class="
              config.position === 'bottomRight'
                ? 'border-primary bg-primary/10 font-bold text-primary'
                : 'border-input hover:bg-accent/20'
            "
          >
            {{ t('watermark.posBottomRight') }}
          </button>
        </div>
      </div>

      <!-- Tile Spacing & Density & Stagger -->
      <div v-else class="space-y-3 animate-fade-in">
        <!-- Gap X / Density -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center text-xs">
            <span class="font-medium text-muted-foreground"
              >{{ t('watermark.density') }} / {{ t('watermark.gapX') }}</span
            >
            <span class="font-mono text-muted-foreground"
              >{{ config.gapX }}px</span
            >
          </div>
          <input
            type="range"
            min="80"
            max="350"
            step="10"
            :value="config.gapX"
            @input="updateField('gapX', Number($event.target.value))"
            class="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <!-- Gap Y -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center text-xs">
            <span class="font-medium text-muted-foreground">{{
              t('watermark.gapY')
            }}</span>
            <span class="font-mono text-muted-foreground"
              >{{ config.gapY }}px</span
            >
          </div>
          <input
            type="range"
            min="60"
            max="300"
            step="10"
            :value="config.gapY"
            @input="updateField('gapY', Number($event.target.value))"
            class="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <!-- Stagger Toggle -->
        <div class="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="staggerToggle"
            :checked="config.stagger"
            @change="updateField('stagger', $event.target.checked)"
            class="rounded border-input text-primary w-4 h-4 cursor-pointer"
          />
          <label
            for="staggerToggle"
            class="text-xs text-muted-foreground cursor-pointer select-none"
          >
            {{ t('watermark.staggerLabel') }} ({{ t('watermark.staggerDesc') }})
          </label>
        </div>
      </div>
    </div>

    <!-- 4. Opacity & Rotation -->
    <div class="space-y-4 pt-3 border-t border-border">
      <!-- Opacity -->
      <div class="space-y-1.5">
        <div class="flex justify-between items-center text-xs">
          <span
            class="font-medium text-muted-foreground flex items-center gap-1"
          >
            <Sliders class="w-3.5 h-3.5" /> {{ t('watermark.opacity') }}
          </span>
          <span class="font-mono font-semibold text-primary"
            >{{ Math.round(config.opacity * 100) }}%</span
          >
        </div>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          :value="config.opacity"
          @input="updateField('opacity', Number($event.target.value))"
          class="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      <!-- Rotation -->
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span
            class="font-medium text-muted-foreground flex items-center gap-1"
          >
            <RotateCw class="w-3.5 h-3.5" /> {{ t('watermark.rotation') }}
          </span>
          <span class="font-mono font-semibold text-primary"
            >{{ config.rotation }}°</span
          >
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          step="5"
          :value="config.rotation"
          @input="updateField('rotation', Number($event.target.value))"
          class="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <!-- Quick Angles -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          <button
            v-for="ang in quickAngles"
            :key="ang"
            type="button"
            @click="updateField('rotation', ang)"
            class="text-xs px-2 py-0.5 rounded border transition-colors"
            :class="
              config.rotation === ang
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-input text-muted-foreground hover:bg-accent/20'
            "
          >
            {{ ang }}°
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Page Scope -->
    <div class="space-y-3 pt-3 border-t border-border">
      <div class="flex items-center justify-between">
        <label
          class="text-sm font-semibold flex items-center gap-1.5 text-foreground"
        >
          <Layers class="w-4 h-4 text-primary" />
          {{ t('watermark.pageRange') }}
        </label>
      </div>

      <select
        :value="config.pageRangeType"
        @change="updateField('pageRangeType', $event.target.value)"
        class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">
          {{ t('watermark.rangeAll', { total: totalPages }) }}
        </option>
        <option value="first">{{ t('watermark.rangeFirst') }}</option>
        <option value="last">{{ t('watermark.rangeLast') }}</option>
        <option value="odd">{{ t('watermark.rangeOdd') }}</option>
        <option value="even">{{ t('watermark.rangeEven') }}</option>
        <option value="custom">{{ t('watermark.rangeCustom') }}</option>
      </select>

      <div v-if="config.pageRangeType === 'custom'" class="animate-fade-in">
        <input
          type="text"
          :value="config.customPages"
          @input="updateField('customPages', $event.target.value)"
          placeholder="e.g. 1-3, 5, 8"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <div class="pt-4 border-t border-border">
      <button
        type="button"
        @click="emit('apply')"
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold"
      >
        {{ t('watermark.applyBtn') }}
      </button>
    </div>
  </div>
</template>
