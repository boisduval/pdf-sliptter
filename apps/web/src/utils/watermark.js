import { PDFDocument } from 'pdf-lib'

export const DEFAULT_WATERMARK_CONFIG = {
  text: '机密文件 · 请勿外传',
  fontFamily: 'sans-serif',
  fontSize: 32, // in px
  fontWeight: '600', // '400', '500', '600', '700', '900'
  color: '#94a3b8',
  textAlign: 'center', // 'left' | 'center' | 'right'
  opacity: 0.25, // 0.05 to 1.0
  rotation: -45, // in degrees: -180 to 180
  mode: 'tile', // 'single' | 'tile'
  // Single mode config
  position: 'center', // 'center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
  // Tile mode config
  density: 3, // 1 (sparse) to 5 (dense)
  gapX: 180, // Horizontal distance between watermarks
  gapY: 140, // Vertical distance between watermarks
  stagger: true, // Offset alternating rows
  // Target Pages config
  pageRangeType: 'all', // 'all', 'first', 'last', 'odd', 'even', 'custom'
  customPages: '',
  layer: 'foreground' // 'foreground' | 'background'
}

/**
 * Replace dynamic template macros in watermark text
 * e.g., {{date}}, {{time}}, {{year}}
 */
export function formatWatermarkText(templateText) {
  if (!templateText) return ''
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  const dateStr = `${year}-${month}-${day}`
  const timeStr = `${hours}:${minutes}`

  return templateText
    .replace(/\{\{date\}\}/gi, dateStr)
    .replace(/\{\{time\}\}/gi, timeStr)
    .replace(/\{\{year\}\}/gi, String(year))
    .replace(/\{\{datetime\}\}/gi, `${dateStr} ${timeStr}`)
}

/**
 * Draw watermark on a 2D canvas overlay
 * Used for both real-time UI preview and creating high-DPI stamps for pdf-lib
 */
export function drawWatermarkOnCanvas(
  canvas,
  width,
  height,
  config,
  scale = 1.0
) {
  const ctx = canvas.getContext('2d')
  canvas.width = width * scale
  canvas.height = height * scale

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.scale(scale, scale)

  const rawText = config.text || ''
  const text = formatWatermarkText(rawText)
  if (!text.trim()) {
    ctx.restore()
    return
  }

  const fontSize = Number(config.fontSize) || 32
  const fontWeight = config.fontWeight || 'normal'
  const fontFamily = config.fontFamily || 'sans-serif'
  const textAlign = config.textAlign || 'center'
  const opacity =
    config.opacity != null && !isNaN(Number(config.opacity))
      ? Number(config.opacity)
      : 0.25
  const rotation = (Number(config.rotation) || 0) * (Math.PI / 180)
  const color = config.color || '#94a3b8'

  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.textAlign = textAlign
  ctx.textBaseline = 'middle'

  if (config.mode === 'single') {
    let x = width / 2
    let y = height / 2

    const margin = 60
    if (config.position === 'topLeft') {
      x = margin + fontSize * 2
      y = margin + fontSize
    } else if (config.position === 'topRight') {
      x = width - (margin + fontSize * 2)
      y = margin + fontSize
    } else if (config.position === 'bottomLeft') {
      x = margin + fontSize * 2
      y = height - (margin + fontSize)
    } else if (config.position === 'bottomRight') {
      x = width - (margin + fontSize * 2)
      y = height - (margin + fontSize)
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    drawMultiLineText(ctx, text, 0, 0, fontSize * 1.3, textAlign)
    ctx.restore()
  } else {
    // TILE MODE
    const gapX = Math.max(60, Number(config.gapX) || 180)
    const gapY = Math.max(50, Number(config.gapY) || 140)
    const stagger = config.stagger !== false

    // Extend boundaries to cover rotation corners
    const diagonal = Math.sqrt(width * width + height * height)
    const startX = -diagonal / 2
    const endX = width + diagonal / 2
    const startY = -diagonal / 2
    const endY = height + diagonal / 2

    let rowIndex = 0
    for (let y = startY; y < endY; y += gapY) {
      const offsetX = stagger && rowIndex % 2 === 1 ? gapX / 2 : 0
      for (let x = startX - gapX; x < endX + gapX; x += gapX) {
        ctx.save()
        ctx.translate(x + offsetX, y)
        ctx.rotate(rotation)
        drawMultiLineText(ctx, text, 0, 0, fontSize * 1.3, textAlign)
        ctx.restore()
      }
      rowIndex++
    }
  }

  ctx.restore()
}

function drawMultiLineText(ctx, text, x, y, lineHeight, textAlign = 'center') {
  const lines = text.split('\n')
  const totalHeight = (lines.length - 1) * lineHeight
  const startY = y - totalHeight / 2

  // Measure maximum line width to ensure alignment anchor is consistent
  let maxWidth = 0
  lines.forEach((line) => {
    const metrics = ctx.measureText(line)
    if (metrics.width > maxWidth) {
      maxWidth = metrics.width
    }
  })

  lines.forEach((line, index) => {
    let drawX = x
    if (textAlign === 'left') {
      drawX = x - maxWidth / 2
    } else if (textAlign === 'right') {
      drawX = x + maxWidth / 2
    } else {
      drawX = x
    }
    ctx.fillText(line, drawX, startY + index * lineHeight)
  })
}

/**
 * Generate a PNG blob / Uint8Array representing the watermark layer for a specific page dimension
 */
export async function createWatermarkStampPng(
  width,
  height,
  config,
  dpr = 2.0
) {
  const offscreen = document.createElement('canvas')
  drawWatermarkOnCanvas(offscreen, width, height, config, dpr)
  return new Promise((resolve) => {
    offscreen.toBlob((blob) => {
      blob.arrayBuffer().then((buffer) => {
        resolve(new Uint8Array(buffer))
      })
    }, 'image/png')
  })
}

/**
 * Parse page range string to list of 1-based page numbers
 */
export function resolveTargetPages(config, totalPages) {
  const type = config.pageRangeType || 'all'
  if (type === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (type === 'first') {
    return [1]
  }
  if (type === 'last') {
    return [totalPages]
  }
  if (type === 'odd') {
    const pages = []
    for (let i = 1; i <= totalPages; i += 2) pages.push(i)
    return pages
  }
  if (type === 'even') {
    const pages = []
    for (let i = 2; i <= totalPages; i += 2) pages.push(i)
    return pages
  }
  if (type === 'custom') {
    const set = new Set()
    const parts = (config.customPages || '').split(',')
    for (const part of parts) {
      const p = part.trim()
      if (!p) continue
      if (p.includes('-')) {
        const [s, e] = p.split('-').map((n) => parseInt(n.trim(), 10))
        if (!isNaN(s) && !isNaN(e)) {
          const start = Math.max(1, Math.min(s, e))
          const end = Math.min(totalPages, Math.max(s, e))
          for (let i = start; i <= end; i++) set.add(i)
        }
      } else {
        const num = parseInt(p, 10)
        if (!isNaN(num) && num >= 1 && num <= totalPages) set.add(num)
      }
    }
    return Array.from(set).sort((a, b) => a - b)
  }
  return Array.from({ length: totalPages }, (_, i) => i + 1)
}

/**
 * Apply watermark to PDF document and export bytes
 */
export async function applyWatermarkToPdf(pdfFile, config, onProgress) {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const pages = pdfDoc.getPages()
  const totalCount = pages.length

  const targetPageIndices = new Set(
    resolveTargetPages(config, totalCount).map((p) => p - 1)
  )

  // Cache stamp if page sizes are identical to save processing time
  const stampCache = new Map()

  for (let i = 0; i < totalCount; i++) {
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: totalCount,
        percent: Math.round(((i + 1) / totalCount) * 100)
      })
    }

    if (!targetPageIndices.has(i)) {
      continue
    }

    const page = pages[i]
    const { width, height } = page.getSize()
    const sizeKey = `${Math.round(width)}x${Math.round(height)}`

    let pngBytes
    if (stampCache.has(sizeKey)) {
      pngBytes = stampCache.get(sizeKey)
    } else {
      pngBytes = await createWatermarkStampPng(width, height, config, 2.0)
      stampCache.set(sizeKey, pngBytes)
    }

    const embeddedImage = await pdfDoc.embedPng(pngBytes)

    // Draw image covering the full page
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: width,
      height: height
    })

    // Allow main thread to update UI
    await new Promise((r) => setTimeout(r, 0))
  }

  const modifiedPdfBytes = await pdfDoc.save()
  return new Blob([modifiedPdfBytes], { type: 'application/pdf' })
}
