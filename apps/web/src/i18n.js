import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    app: {
      title: 'PDF Toolbox',
      subtitle:
        'Fast, private and secure client-side PDF utilities directly in your browser.',
      footer:
        'Private & Secure. All processing is done locally in your browser.'
    },
    nav: {
      split: 'Split & Merge',
      watermark: 'Add Watermark'
    },
    dropzone: {
      dragText: 'Drag & Drop your PDF here',
      clickText: 'or click to browse your files',
      alert: 'Please upload a PDF file.'
    },
    fileInfo: {
      remove: 'Remove file'
    },
    sidebar: {
      splitMode: 'Split Mode',
      modes: {
        all: {
          title: 'All Pages',
          desc: 'Extract every single page into a separate file.'
        },
        range: {
          title: 'Custom Range',
          desc: 'Extract specific ranges (e.g. 1-5, 8).'
        },
        select: {
          title: 'Select Manually',
          desc: 'Pick pages visually from the grid.'
        }
      },
      rangePlaceholder: 'e.g. 1-5, 8, 11-13',
      mergeLabel: 'Merge selected pages into one PDF file',
      splitBtn: 'Split PDF',
      mergeBtn: 'Merge & Download',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      invertSelect: 'Invert'
    },
    watermark: {
      textLabel: 'Watermark Text',
      textPlaceholder: 'Enter watermark text (e.g. CONFIDENTIAL)...',
      templates: 'Quick Presets',
      fontFamily: 'Font Family',
      fontWeight: 'Font Weight',
      textAlign: 'Text Alignment',
      alignLeft: 'Left',
      alignCenter: 'Center',
      alignRight: 'Right',
      fontSize: 'Font Size',
      color: 'Color',
      layoutMode: 'Layout & Quantity',
      modeTile: 'Full Page Tiled',
      modeTileDesc: 'Multiple repeated watermarks',
      modeSingle: 'Single Watermark',
      modeSingleDesc: 'One specific position',
      position: 'Position',
      posTopLeft: 'Top Left',
      posCenter: 'Center',
      posTopRight: 'Top Right',
      posBottomLeft: 'Bottom Left',
      posBottomRight: 'Bottom Right',
      pos: 'Position',
      density: 'Spacing',
      gapX: 'Horizontal Gap',
      gapY: 'Vertical Gap',
      staggerLabel: 'Staggered Grid',
      staggerDesc: 'Offset alternating rows',
      opacity: 'Opacity',
      rotation: 'Rotation Angle',
      pageRange: 'Target Pages',
      rangeAll: 'All Pages ({total} pages)',
      rangeFirst: 'First Page Only',
      rangeLast: 'Last Page Only',
      rangeOdd: 'Odd Pages Only',
      rangeEven: 'Even Pages Only',
      rangeCustom: 'Custom Pages (e.g. 1-3, 5)',
      applyBtn: 'Generate & Download PDF',
      processing: 'Adding watermark to page {current} of {total}...',
      finalizing: 'Finalizing PDF document...',
      previewHint: 'Live preview updates automatically. Click canvas to zoom.',
      skippedOnThisPage:
        'Watermark not applied on this page according to page scope'
    },
    preview: {
      title: 'Preview',
      startPage: 'Start Page',
      endPage: 'End Page',
      selectTitle: 'Select Pages to Extract',
      selected: '{n} selected',
      zoomIn: 'Click to Zoom'
    },
    process: {
      processingPage: 'Processing page {page} ({current}/{total})...',
      merging: 'Merging pages...',
      finalizingPdf: 'Finalizing PDF...',
      finalizingZip: 'Finalizing ZIP file...'
    },
    result: {
      title: 'Ready for Download!',
      successSplit: 'Your PDF pages have been successfully split.',
      successMerge: 'Your PDF has been successfully created.',
      successWatermark: 'Your PDF has been successfully watermarked.',
      downloadZip: 'Download ZIP',
      downloadPdf: 'Download PDF',
      splitAgain: 'Split Again',
      startOver: 'Start Over'
    }
  },
  zh: {
    app: {
      title: 'PDF 工具箱',
      subtitle: '轻松、私密且高效的纯前端 PDF 实用工具集。',
      footer: '私密且安全。所有处理均在浏览器本地完成，文件不会上传至服务器。'
    },
    nav: {
      split: '拆分与合并',
      watermark: '添加水印'
    },
    dropzone: {
      dragText: '将 PDF 拖放到此处',
      clickText: '或点击此处浏览文件',
      alert: '请上传 PDF 文件。'
    },
    fileInfo: {
      remove: '移除文件'
    },
    sidebar: {
      splitMode: '拆分模式',
      modes: {
        all: {
          title: '所有页面',
          desc: '将每一页提取为一个单独的文件。'
        },
        range: {
          title: '自定义范围',
          desc: '提取特定范围（例如 1-5, 8）。'
        },
        select: {
          title: '手动选择',
          desc: '从网格中直观地选择页面。'
        }
      },
      rangePlaceholder: '例如 1-5, 8, 11-13',
      mergeLabel: '将选中的页面合并为一个 PDF 文件',
      splitBtn: '拆分 PDF',
      mergeBtn: '合并并下载',
      selectAll: '全选',
      deselectAll: '取消全选',
      invertSelect: '反选'
    },
    watermark: {
      textLabel: '水印文字内容',
      textPlaceholder: '请输入水印文字（例如：机密文件 · 请勿外传）...',
      templates: '常用模板',
      fontFamily: '字体',
      fontWeight: '字重粗细',
      textAlign: '对齐方式',
      alignLeft: '居左',
      alignCenter: '居中',
      alignRight: '居右',
      fontSize: '字号大小',
      color: '文字颜色',
      layoutMode: '排版与数量模式',
      modeTile: '全页平铺',
      modeTileDesc: '密集覆盖，防盗防篡改',
      modeSingle: '单个居中/定点',
      modeSingleDesc: '单点指定位置印章',
      position: '图章位置',
      posTopLeft: '左上',
      posCenter: '居中',
      posTopRight: '右上',
      posBottomLeft: '左下',
      posBottomRight: '右下',
      pos: '九宫格',
      density: '平铺间距',
      gapX: '水平间距',
      gapY: '垂直间距',
      staggerLabel: '交错排列',
      staggerDesc: '奇偶行错位，视觉更佳',
      opacity: '透明度',
      rotation: '旋转角度',
      pageRange: '应用页面范围',
      rangeAll: '全部页面 (共 {total} 页)',
      rangeFirst: '仅第一页',
      rangeLast: '仅最后一页',
      rangeOdd: '仅奇数页',
      rangeEven: '仅偶数页',
      rangeCustom: '自定义页码范围 (如 1-3, 5)',
      applyBtn: '生成并下载带水印 PDF',
      processing: '正在为第 {current} / {total} 页添加水印...',
      finalizing: '正在生成最终 PDF 文件...',
      previewHint: '实时预览已同步。点击画板可放大查看高清大图。',
      skippedOnThisPage: '根据范围设置，本页不添加水印'
    },
    preview: {
      title: '预览',
      startPage: '起始页',
      endPage: '结束页',
      selectTitle: '选择要提取的页面',
      selected: '已选 {n} 页',
      zoomIn: '点击放大预览'
    },
    process: {
      processingPage: '正在处理第 {page} 页 ({current}/{total})...',
      merging: '正在合并页面...',
      finalizingPdf: '正在生成 PDF...',
      finalizingZip: '正在生成 ZIP 文件...'
    },
    result: {
      title: '准备下载！',
      successSplit: '您的 PDF 页面已成功拆分。',
      successMerge: '您的 PDF 已成功创建。',
      successWatermark: '您的 PDF 已成功添加水印。',
      downloadZip: '下载 ZIP',
      downloadPdf: '下载 PDF',
      splitAgain: '再次拆分',
      startOver: '重新开始'
    }
  }
}

const i18n = createI18n({
  legacy: false, // Usage with Composition API
  locale: localStorage.getItem('user-locale') || 'zh', // default locale
  fallbackLocale: 'zh',
  messages
})

export default i18n
