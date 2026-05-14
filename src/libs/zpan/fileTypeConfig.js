/**
 * 统一的文件类型配置
 * 一处定义，全处使用
 * 添加新类型时仅需在此修改
 */

// ========== MIME 类型定义 ==========
export const OFFICE_TYPES = {
  WORD: {
    mimes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    extensions: ['.doc', '.docx'],
    viewer: 'doc',
    icon: 'icon-doc'
  },
  EXCEL: {
    mimes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    extensions: ['.xls', '.xlsx'],
    viewer: 'xlsx',
    icon: 'icon-excel'
  },
  POWERPOINT: {
    mimes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    extensions: ['.ppt', '.pptx'],
    viewer: 'pptx',
    icon: 'icon-ppt'
  }
}

export const MEDIA_TYPES = {
  IMAGE: {
    mimePrefix: 'image',
    viewer: 'image',
    icon: 'icon-image'
  },
  AUDIO: {
    mimePrefix: 'audio',
    viewer: 'media',
    icon: 'icon-audio'
  },
  VIDEO: {
    mimePrefix: 'video',
    viewer: 'media',
    icon: 'icon-video'
  }
}

export const DOCUMENT_TYPES = {
  PDF: {
    mimes: ['application/pdf'],
    extensions: ['.pdf'],
    viewer: 'pdf',
    icon: 'icon-pdf'
  },
  TEXT: {
    mimePrefix: 'text',
    viewer: 'text',
    icon: 'icon-text'
  },
  CODE: {
    // 代码文件通过 TEXT 处理
    extensions: ['.js', '.json', '.yaml', '.yml', '.xml', '.html', '.css', '.ts', '.py', '.go', '.java'],
    viewer: 'text',
    icon: 'icon-code'
  }
}

// ========== 预构建的查找表（性能优化） ==========

// 构建 MIME→viewer 的快速查找表
const mimeToViewer = {}
const mimeToIcon = {}

// Office 类型
Object.values(OFFICE_TYPES).forEach(type => {
  type.mimes.forEach(mime => {
    mimeToViewer[mime] = type.viewer
    mimeToIcon[mime] = type.icon
  })
})

// 文档类型
Object.values(DOCUMENT_TYPES).forEach(type => {
  if (type.mimes) {
    type.mimes.forEach(mime => {
      mimeToViewer[mime] = type.viewer
      mimeToIcon[mime] = type.icon
    })
  }
})

// ========== 工具函数 ==========

/**
 * 获取文件的 Viewer 类型
 * @param {string} mimeType - MIME 类型
 * @param {string} fileName - 文件名（用作备用判断）
 * @returns {string} viewer 类型 (pdf|image|text|media|xlsx|pptx|doc|folder)
 */
export function getViewerType(mimeType, fileName = '') {
  if (!mimeType) return null

  const mime = mimeType.toLowerCase()
  const name = fileName.toLowerCase()

  // 1. 精确 MIME 匹配（快速路径）
  if (mimeToViewer[mime]) {
    return mimeToViewer[mime]
  }

  // 2. 前缀匹配
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('audio/')) return 'media'
  if (mime.startsWith('video/')) return 'media'
  if (mime.startsWith('text/')) return 'text'

  // 3. 包含关键字（处理变体 MIME 类型）
  if (mime.includes('spreadsheet') || mime.includes('ms-excel')) return 'xlsx'
  if (mime.includes('presentation') || mime.includes('ms-powerpoint')) return 'pptx'
  if (mime.includes('word') || mime.includes('wordprocessingml')) return 'doc'

  // 4. 文件名后缀备用（处理 MIME 类型不准确的情况）
  if (name) {
    for (const type of Object.values(OFFICE_TYPES)) {
      if (type.extensions.some(ext => name.endsWith(ext))) {
        return type.viewer
      }
    }
    for (const type of Object.values(DOCUMENT_TYPES)) {
      if (type.extensions && type.extensions.some(ext => name.endsWith(ext))) {
        return type.viewer
      }
    }
  }

  return null
}

/**
 * 检查文件是否可预览
 * @param {string} mimeType - MIME 类型
 * @param {string} fileName - 文件名（可选）
 * @returns {boolean}
 */
export function isPreviewable(mimeType, fileName = '') {
  const viewerType = getViewerType(mimeType, fileName)
  return viewerType !== null && viewerType !== 'folder'
}

/**
 * 检查是否是 Office 文件（Word/Excel/PowerPoint）
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function isOfficeFile(mimeType) {
  if (!mimeType) return false
  const mime = mimeType.toLowerCase()
  return Object.values(OFFICE_TYPES).some(type =>
    type.mimes.includes(mime)
  )
}

/**
 * 获取文件的图标类名
 * @param {string} mimeType - MIME 类型
 * @returns {string} 图标类名
 */
export function getFileIcon(mimeType) {
  if (!mimeType) return 'icon-file'

  const mime = mimeType.toLowerCase()

  // 精确 MIME 匹配
  if (mimeToIcon[mime]) {
    return mimeToIcon[mime]
  }

  // 前缀匹配
  const [mainType, subType] = mime.split('/')

  // 特殊处理
  if (subType) {
    const specialIcons = ['pdf', 'html', 'xml', 'psd', 'rtf', 'json', 'yaml', 'zip']
    if (specialIcons.includes(subType)) {
      return `icon-${subType}`
    }

    const codeTypes = ['json', 'yaml', 'x-yaml']
    if (codeTypes.includes(subType)) {
      return 'icon-code'
    }

    const compressedFileTypes = ['zip', 'x-gzip', 'x-rar', 'x-7z']
    if (compressedFileTypes.includes(subType)) {
      return 'icon-compressed-file'
    }
  }

  // 通用前缀
  if (['audio', 'video', 'image', 'text'].includes(mainType)) {
    return `icon-${mainType}`
  }

  return 'icon-file'
}

/**
 * 获取文件的展示名称（用于调试）
 * @param {string} mimeType - MIME 类型
 * @param {string} fileName - 文件名
 * @returns {string}
 */
export function getFileTypeName(mimeType, fileName = '') {
  const viewerType = getViewerType(mimeType, fileName)
  const typeNames = {
    pdf: 'PDF',
    image: '图片',
    text: '文本',
    media: '媒体',
    xlsx: 'Excel',
    pptx: 'PowerPoint',
    doc: 'Word'
  }
  return typeNames[viewerType] || '未知'
}

/**
 * 获取所有支持的 MIME 类型（用于 validation）
 * @returns {string[]} MIME 类型数组
 */
export function getAllSupportedMimes() {
  const mimes = []
  Object.values(OFFICE_TYPES).forEach(type => mimes.push(...type.mimes))
  Object.values(DOCUMENT_TYPES).forEach(type => {
    if (type.mimes) mimes.push(...type.mimes)
  })
  return mimes
}

export default {
  OFFICE_TYPES,
  MEDIA_TYPES,
  DOCUMENT_TYPES,
  getViewerType,
  isPreviewable,
  isOfficeFile,
  getFileIcon,
  getFileTypeName,
  getAllSupportedMimes
}
