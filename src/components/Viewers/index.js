import MediaViewer from './modals/MediaViewer.vue'
import PictureViewer from './modals/PictureViewer.vue'
import PdfViewer from './pages/PdfViewer.vue'
import XlsxViewer from './pages/XlsxViewer.vue'
import DocViewer from './pages/DocViewer.vue'
import PptxViewer from './pages/PptxViewer.vue'
import { transfer } from '@/helper'

/**
 * PreviewManager - 统一的文件预览管理器
 * 支持的文件类型：
 *   - media: 音视频文件（对话框）
 *   - image: 图片文件（对话框）
 *   - pdf: PDF 文件（全屏）
 *   - xlsx: Excel 文件（全屏）
 *   - doc: Word 文件（全屏）
 *   - pptx: PowerPoint 文件（全屏）
 *   - text: 文本文件（编辑器）
 */
class PreviewManager {
  /**
   * 预览文件
   * @param {string} type - 文件类型
   * @param {object} fileInfo - 文件信息 { name, alias, type }
   * @param {string} link - 文件链接
   */
  preview(type, fileInfo, link) {
    switch (type) {
      case 'media':
        transfer(MediaViewer)({
          title: fileInfo.name,
          url: link,
          type: fileInfo.type
        })
        break

      case 'image':
        transfer(PictureViewer)({
          title: fileInfo.name,
          url: link
        })
        break

      case 'pdf':
        window.open(
          `/viewer/pdf?link=${encodeURIComponent(link)}&title=${encodeURIComponent(fileInfo.name)}`,
          '_blank'
        )
        break

      case 'xlsx':
        window.open(
          `/viewer/xlsx?link=${encodeURIComponent(link)}&title=${encodeURIComponent(fileInfo.name)}`,
          '_blank'
        )
        break

      case 'doc':
        window.open(
          `/viewer/doc?link=${encodeURIComponent(link)}&title=${encodeURIComponent(fileInfo.name)}`,
          '_blank'
        )
        break

      case 'pptx':
        window.open(
          `/viewer/pptx?link=${encodeURIComponent(link)}&title=${encodeURIComponent(fileInfo.name)}`,
          '_blank'
        )
        break

      case 'text':
        window.open(`/f/editor?alias=${fileInfo.alias}`, '_blank')
        break

      default:
        console.warn(`Unsupported preview type: ${type}`)
    }
  }
}

export default new PreviewManager()

// 导出单个 viewer 组件供路由使用
export {
  MediaViewer,
  PictureViewer,
  PdfViewer,
  XlsxViewer,
  DocViewer,
  PptxViewer
}
