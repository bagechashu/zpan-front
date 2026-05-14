<template>
  <div class="doc-viewer">
    <div class="doc-toolbar">
      <div class="doc-toolbar-left">
        <h2 class="doc-title">{{ title }}</h2>
      </div>
      <div class="doc-toolbar-right">
        <!-- <button class="doc-btn" @click="downloadDoc" :title="$t('viewer.doc.download')">
          <i class="el-icon-download"></i> {{ $t('viewer.doc.download') }}
        </button> -->
        <button class="doc-btn" @click="closeViewer" :title="$t('viewer.doc.close')">
          <i class="el-icon-close"></i> {{ $t('viewer.doc.close') }}
        </button>
      </div>
    </div>
    <div v-if="loading" class="doc-loading">
      <i class="el-icon-loading"></i> {{ $t('viewer.doc.loading') }}
    </div>
    <div v-if="error" class="doc-error">
      <p>{{ error }}</p>
    </div>
    <div id="docPreview" class="doc-content"></div>
  </div>
</template>

<script>
import mammoth from 'mammoth'

export default {
  name: 'DocViewer',
  data() {
    return {
      title: '',
      link: '',
      loading: true,
      error: '',
    }
  },
  mounted() {
    this.link = this.$route.query.link
    this.title = this.$route.query.title || this.$t('viewer.doc.title')
    this.loadDocument()
  },
  methods: {
    async loadDocument() {
      try {
        this.loading = true
        this.error = ''

        if (!this.link) {
          this.error = this.$t('viewer.doc.no-link')
          this.loading = false
          return
        }

        // 尝试直接 fetch（用于本地测试或已配置 CORS 的存储）
        let arrayBuffer
        try {
          const response = await fetch(this.link)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const blob = await response.blob()
          arrayBuffer = await blob.arrayBuffer()
        } catch (fetchErr) {
          // 如果直接 fetch 失败（如 CORS 错误），提示用户使用下载功能
          console.error('Direct fetch failed:', fetchErr)
          this.error = this.$t('viewer.doc.preview-failed')
          this.loading = false
          return
        }

        // 使用 mammoth 转换
        const result = await mammoth.convertToHtml({ arrayBuffer })
        const html = result.value
        const messages = result.messages

        // 记录任何转换消息（警告等）
        if (messages.length > 0) {
          console.warn('Mammoth conversion messages:', messages)
        }

        // 渲染到容器
        const container = document.getElementById('docPreview')
        container.innerHTML = html

        // 添加默认样式
        this.applyDefaultStyles()

        this.loading = false
      } catch (err) {
        console.error('Failed to load document:', err)
        this.error = `${this.$t('viewer.doc.load-error')}: ${err.message}`
        this.loading = false
      }
    },
    applyDefaultStyles() {
      const container = document.getElementById('docPreview')
      if (container) {
        // 为 img 标签添加样式
        const images = container.querySelectorAll('img')
        images.forEach(img => {
          img.style.maxWidth = '100%'
          img.style.height = 'auto'
          img.style.marginBottom = '10px'
        })

        // 为表格添加样式
        const tables = container.querySelectorAll('table')
        tables.forEach(table => {
          table.style.borderCollapse = 'collapse'
          table.style.width = '100%'
          table.style.marginBottom = '10px'
        })

        const cells = container.querySelectorAll('td, th')
        cells.forEach(cell => {
          cell.style.border = '1px solid #ddd'
          cell.style.padding = '8px'
        })
      }
    },
    downloadDoc() {
      const a = document.createElement('a')
      a.href = this.link
      a.download = this.title
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    closeViewer() {
      window.close()
    }
  }
}
</script>

<style scoped>
.doc-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.doc-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.doc-toolbar-left {
  flex: 1;
}

.doc-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-toolbar-right {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.doc-btn {
  padding: 8px 12px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.3s;
}

.doc-btn:hover {
  background-color: #66b1ff;
}

.doc-btn:active {
  background-color: #0a7bc4;
}

.doc-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
}

.doc-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f56c6c;
  font-size: 14px;
  padding: 20px;
}

.doc-error p {
  margin: 0;
}

.doc-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #fff;
  margin: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.doc-content >>> p {
  margin: 0 0 10px 0;
  line-height: 1.6;
  color: #333;
}

.doc-content >>> h1,
.doc-content >>> h2,
.doc-content >>> h3,
.doc-content >>> h4,
.doc-content >>> h5,
.doc-content >>> h6 {
  margin: 15px 0 10px 0;
  line-height: 1.4;
  color: #222;
}

.doc-content >>> h1 {
  font-size: 24px;
}

.doc-content >>> h2 {
  font-size: 20px;
}

.doc-content >>> h3 {
  font-size: 18px;
}

.doc-content >>> ul,
.doc-content >>> ol {
  margin: 10px 0;
  padding-left: 30px;
}

.doc-content >>> li {
  margin: 5px 0;
  color: #333;
}

.doc-content >>> blockquote {
  border-left: 4px solid #409eff;
  padding-left: 15px;
  margin: 10px 0;
  color: #666;
}

.doc-content >>> code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #d63384;
}

.doc-content >>> pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 10px 0;
}

.doc-content >>> table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.doc-content >>> th,
.doc-content >>> td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

.doc-content >>> th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #333;
}

.doc-content >>> img {
  max-width: 100%;
  height: auto;
  margin: 15px 0;
  border-radius: 4px;
  display: block;
}
</style>
