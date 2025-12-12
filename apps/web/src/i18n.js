import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    app: {
      title: 'PDF Splitter',
      subtitle:
        'Instantly separate your PDF into individual pages with privacy and ease.',
      footer: 'Private & Secure. Client-side processing.'
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
    preview: {
      title: 'Preview',
      startPage: 'Start Page',
      endPage: 'End Page',
      selectTitle: 'Select Pages to Extract',
      selected: '{n} selected'
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
      downloadZip: 'Download ZIP',
      downloadPdf: 'Download PDF',
      splitAgain: 'Split Again',
      startOver: 'Start Over'
    }
  },
  zh: {
    app: {
      title: 'PDF 拆分工具',
      subtitle: '轻松、私密地将您的 PDF 文件拆分为单独的页面。',
      footer: '私密且安全。所有处理均在浏览器端完成。'
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
    preview: {
      title: '预览',
      startPage: '起始页',
      endPage: '结束页',
      selectTitle: '选择要提取的页面',
      selected: '已选 {n} 页'
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
