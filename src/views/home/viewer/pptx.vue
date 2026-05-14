<template>
  <div class="pptx-viewer">
    <div class="toolbar">
      <div class="title">{{ title }}</div>
      <div class="controls">
        <button @click="previousSlide" :disabled="currentSlide === 0">← Previous</button>
        <span class="slide-counter">Slide {{ currentSlide + 1 }} of {{ totalSlides }}</span>
        <button @click="nextSlide" :disabled="currentSlide >= totalSlides - 1">Next →</button>
      </div>
    </div>
    <div class="content">
      <div class="placeholder">
        <p>PowerPoint Preview</p>
        <p>{{ title }}</p>
        <p style="font-size: 12px; color: #999;">Slide {{ currentSlide + 1 }} of {{ totalSlides }}</p>
        <p style="font-size: 12px; margin-top: 20px;">Full preview support coming soon.</p>
        <p style="font-size: 12px;">
          <a :href="link" target="_blank" download>Download file</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PptxViewer',
  data() {
    return {
      title: '',
      link: '',
      currentSlide: 0,
      totalSlides: 1, // Placeholder value
    }
  },
  methods: {
    previousSlide() {
      if (this.currentSlide > 0) {
        this.currentSlide--
      }
    },
    nextSlide() {
      if (this.currentSlide < this.totalSlides - 1) {
        this.currentSlide++
      }
    }
  },
  mounted() {
    this.title = this.$route.query.title
    this.link = this.$route.query.link
  }
}
</script>

<style scoped>
.pptx-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
}

.toolbar {
  background-color: #2a2a2a;
  border-bottom: 1px solid #444;
  padding: 15px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.controls button {
  padding: 6px 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.controls button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.controls button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.slide-counter {
  color: #aaa;
  font-size: 12px;
}

.content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.placeholder {
  text-align: center;
  color: #aaa;
  background-color: #2a2a2a;
  padding: 40px;
  border-radius: 8px;
  border: 1px solid #444;
}

.placeholder p {
  margin: 10px 0;
}

.placeholder a {
  color: #409eff;
  text-decoration: none;
}

.placeholder a:hover {
  text-decoration: underline;
}
</style>
