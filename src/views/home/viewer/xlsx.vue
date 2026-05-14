<template>
  <div class="xlsx-viewer">
    <div class="toolbar">
      <div class="title">{{ title }}</div>
      <div class="sheet-tabs">
        <span v-for="(sheetName, index) in sheetNames" :key="index" 
              :class="['tab', { active: activeSheet === index }]"
              @click="activeSheet = index">
          {{ sheetName }}
        </span>
      </div>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="row-header"></th>
            <th v-for="(col, index) in headers" :key="'header-' + index">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in tableData" :key="'row-' + rowIndex">
            <td class="row-header">{{ rowIndex + 1 }}</td>
            <td v-for="(cell, colIndex) in row" :key="'cell-' + colIndex" class="cell">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'

export default {
  name: 'XlsxViewer',
  data() {
    return {
      title: '',
      link: '',
      workbook: null,
      sheetNames: [],
      activeSheet: 0,
      tableData: [],
      headers: [],
    }
  },
  watch: {
    activeSheet(newVal) {
      this.loadSheet(newVal)
    }
  },
  methods: {
    async loadFile() {
      try {
        const response = await fetch(this.link)
        const buffer = await response.arrayBuffer()
        this.workbook = XLSX.read(buffer, { type: 'array' })
        this.sheetNames = this.workbook.SheetNames
        if (this.sheetNames.length > 0) {
          this.loadSheet(0)
        }
      } catch (error) {
        this.$message.error('Failed to load Excel file: ' + error.message)
        console.error('Error loading file:', error)
      }
    },
    loadSheet(sheetIndex) {
      if (!this.workbook || !this.sheetNames[sheetIndex]) return
      
      const sheetName = this.sheetNames[sheetIndex]
      const worksheet = this.workbook.Sheets[sheetName]
      
      // Convert worksheet to JSON with custom header
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length > 0) {
        // First row as headers
        this.headers = jsonData[0].map((cell, index) => {
          // If cell is empty, use column letter
          return cell !== undefined && cell !== null && cell !== '' 
            ? cell 
            : this.getColumnLetter(index)
        })
        
        // Rest as table data
        this.tableData = jsonData.slice(1)
      } else {
        this.headers = []
        this.tableData = []
      }
    },
    getColumnLetter(colIndex) {
      let letter = ''
      let num = colIndex + 1
      while (num > 0) {
        num--
        letter = String.fromCharCode(65 + (num % 26)) + letter
        num = Math.floor(num / 26)
      }
      return letter
    }
  },
  mounted() {
    this.title = this.$route.query.title
    this.link = this.$route.query.link
    
    if (this.link) {
      this.loadFile()
    }
  }
}
</script>

<style scoped>
.xlsx-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.toolbar {
  background-color: white;
  border-bottom: 1px solid #ddd;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.sheet-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.tab {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  font-size: 12px;
}

.tab:hover {
  background-color: #e8e8e8;
}

.tab.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.table-container {
  flex: 1;
  overflow: auto;
  padding: 10px;
}

.data-table {
  border-collapse: collapse;
  background-color: white;
  font-size: 12px;
}

.data-table th,
.data-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: left;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.row-header {
  background-color: #fafafa;
  color: #666;
  font-weight: 500;
  width: 40px;
  min-width: 40px;
  text-align: center;
}

.data-table tbody tr:hover {
  background-color: #f9f9f9;
}

.cell {
  max-width: 200px;
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
