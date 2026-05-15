<template>
  <div class="pptx-viewer">
    <div class="pptx-toolbar">
      <div class="pptx-toolbar-left">
        <h2 class="pptx-title">{{ title }}</h2>
      </div>
      <div class="pptx-toolbar-right">
        <button class="pptx-btn" @click="closeViewer" :title="$t('viewer.close', 'Close')">
          <i class="el-icon-close"></i>
        </button>
      </div>
    </div>

    <div v-if="loading" class="pptx-loading">
      <i class="el-icon-loading"></i> {{ $t('viewer.loading', 'Loading...') }}
    </div>
    <div v-if="error" class="pptx-error">
      <p>{{ error }}</p>
      <p v-if="link" style="font-size: 12px; margin-top: 10px;">
        <a :href="link" target="_blank" download>{{ $t('viewer.download-file', 'Download file') }}</a>
      </p>
    </div>

    <div v-show="!loading && !error" id="pptx-wrapper" class="pptx-wrapper"></div>
  </div>
</template>

<script>
import { init } from 'pptx-preview'

export default {
  name: 'PptxViewer',
  data() {
    return {
      title: '',
      link: '',
      loading: true,
      error: '',
      previewer: null
    }
  },
  methods: {
    async loadPresentation() {
      try {
        this.loading = true
        this.error = ''

        if (!this.link) {
          this.error = this.$t('viewer.no-link', 'No file link provided')
          this.loading = false
          return
        }

        const response = await fetch(this.link)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()

        // 初始化预览器
        const container = document.getElementById('pptx-wrapper')
        if (!container) {
          this.error = this.$t('viewer.init-error', 'Failed to initialize viewer')
          this.loading = false
          return
        }

        this.previewer = init(container, {
          width: '100%',
          height: '100%'
        })

        // 预览文件
        this.previewer.preview(arrayBuffer)
        this.loading = false
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load presentation:', err)
        this.error = `${this.$t('viewer.load-error', 'Failed to load file')}: ${err.message}`
        this.loading = false
      }
    },
    closeViewer() {
      window.close()
    }
  },
  mounted() {
    this.title = this.$route.query.title || 'PowerPoint'
    this.link = this.$route.query.link
    this.loadPresentation()
  }
}
</script>

<style scoped>
.pptx-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.pptx-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  gap: 20px;
}

.pptx-toolbar-left {
  flex: 1;
}

.pptx-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pptx-toolbar-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.pptx-btn {
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

.pptx-btn:hover {
  background-color: #66b1ff;
}

.pptx-btn:active {
  background-color: #0a7bc4;
}

.pptx-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pptx-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
}

.pptx-error {
  flex: 1;
  display: flex;
  flex-direction: column;
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

.pptx-wrapper {
  flex: 1;
  overflow: auto;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
}

/* pptx-preview 库生成的样式补充 */
.pptx-wrapper >>> .pptx-preview-wrapper {
  background: #fff !important;
  position: relative;
  margin: 0 auto;
  overflow-y: auto;
  width: 100%;
}

.pptx-wrapper >>> .pptx-preview-slide-wrapper {
  position: relative;
  margin: 0 auto 10px;
  background: #fff;
  overflow: hidden;
  max-width: 960px;
  height: 540px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.pptx-wrapper >>> .slide-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  width: 960px;
  height: 540px;
}
</style>
