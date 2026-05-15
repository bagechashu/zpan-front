<template>
  <div class="doc-viewer">
    <div class="doc-toolbar">
      <div class="doc-toolbar-left">
        <h2 class="doc-title">{{ title }}</h2>
      </div>
      <div class="doc-toolbar-right">
        <button class="doc-btn" @click="closeViewer" :title="$t('viewer.doc.close')">
          <i class="el-icon-close"></i>
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

        let arrayBuffer
        try {
          const response = await fetch(this.link)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const blob = await response.blob()
          arrayBuffer = await blob.arrayBuffer()
        } catch (fetchErr) {
          console.error('Direct fetch failed:', fetchErr)
          this.error = this.$t('viewer.doc.preview-failed')
          this.loading = false
          return
        }

        const result = await mammoth.convertToHtml({ arrayBuffer })
        const html = result.value
        const messages = result.messages

        if (messages.length > 0) {
          console.warn('Mammoth conversion messages:', messages)
        }

        const container = document.getElementById('docPreview')
        container.innerHTML = html

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
        const images = container.querySelectorAll('img')
        images.forEach(img => {
          img.style.maxWidth = '100%'
          img.style.height = 'auto'
          img.style.marginBottom = '10px'
        })

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
  font-size: 14px;
  color: #f56c6c;
  background-color: #fef0f0;
  margin: 20px;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #fde2e2;
}

.doc-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: #fff;
  margin: 10px;
  border-radius: 4px;
}
</style>
