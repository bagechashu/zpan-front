<template>
  <div class="columns-wrapper">
    <div v-loading="loading" class="columns-container" ref="columnsContainer">
      <div v-for="(column, index) in columns" :key="index" class="column">
        <div class="column-header">{{ column.name }}</div>
        <div class="column-content">
          <div
            v-for="item in column.items"
            :key="item.alias"
            class="column-item"
            :class="{ selected: isSelected(item, index), 'is-folder': item.dirtype }"
            @click="onItemSelect(item, index)"
          >
            <div class="item-icon">
              <i v-if="item.dirtype" class="matter-icon el-icon-folder" style="color: #ffc402"></i>
              <i v-else :class="`iconfont matter-icon ${type2icon(item.type)}`"></i>
            </div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-actions">
              <el-link v-for="btn in rowButtons" :key="btn.name" v-show="!btn.shown || btn.shown(item)" type="primary" :underline="false" class="action-btn">
                <i :class="`${btn.icon} el-icon--right`" @click.stop="btn.action(item)"></i>
              </el-link>
              <el-dropdown v-show="moreButtons && moreButtons.length > 0" trigger="click" @command="handleCommand" class="action-btn">
                <el-link type="primary" class="el-dropdown-link" :underline="false">
                  <i class="el-icon-more el-icon--right"></i>
                </el-link>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item v-for="btn in moreButtons" :key="btn.name" v-show="!btn.shown || btn.shown(item)" :command="{ action: btn.action, row: item }">
                    {{ btn.title }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
          <div v-if="column.items.length === 0 && !loading" class="empty-column">
            {{ $t('table.empty-text') }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && columns[0] && columns[0].items.length === 0" class="empty-action">
      <div class="empty-text">{{ $t('table.empty-text') }}</div>
      <el-button type="primary" size="mini" plain @click="forceRefreshPage">{{ $t("ft.force-refresh") }}</el-button>
    </div>
  </div>
</template>

<script>
import mixin from "./mixin";

export default {
  mixins: [mixin],
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    dataLoader: Function,
  },
  data() {
    return {
      columns: [
        {
          name: this.$t("ft.breadcrumb"),
          dir: "",
          items: [],
          selectedItem: null,
        },
      ],
    };
  },
  watch: {
    value(nval, oval) {
      this.data = nval;
      // Update the first column items
      if (this.columns.length > 0) {
        this.columns[0].items = nval;
      }
    },
  },
  methods: {
    isSelected(item, columnIndex) {
      return this.columns[columnIndex] && this.columns[columnIndex].selectedItem && this.columns[columnIndex].selectedItem.alias === item.alias;
    },
    onItemSelect(item, columnIndex) {
      // Set selected item in this column
      this.columns[columnIndex].selectedItem = item;

      // If it's a folder, load its contents in the next column
      if (item.dirtype) {
        this.loadColumnContent(item.name, item.fullpath, columnIndex + 1);
        // Remove columns after this one
        this.columns = this.columns.slice(0, columnIndex + 2);
        // Scroll to the right after DOM update
        this.$nextTick(() => {
          this.scrollToRight();
        });
      } else {
        // Remove columns after this one for files
        this.columns = this.columns.slice(0, columnIndex + 1);
        // Emit the file open event
        this.$emit("on-click", "file", item);
      }
    },
    loadColumnContent(folderName, folderPath, columnIndex) {
      if (!this.dataLoader) return;

      // Ensure we have enough columns
      while (this.columns.length <= columnIndex) {
        this.columns.push({
          name: "",
          dir: "",
          items: [],
          selectedItem: null,
        });
      }

      const column = this.columns[columnIndex];
      column.name = folderName;
      column.dir = folderPath;

      // Load folder contents
      this.dataLoader(folderPath, 0, 1000)
        .then((ret) => {
          column.items = ret.list || ret.items || [];
        })
        .catch((err) => {
          column.items = [];
          this.$message.error(this.$t("msg.list-load-failed"));
        });
    },
    handleCommand(command) {
      command.action(command.row);
    },
    scrollToRight() {
      const container = this.$refs.columnsContainer;
      if (container) {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
      }
    },
    forceRefreshPage() {
      window.location.reload(true);
    },
  },
  mounted() {
    // Initialize the first column with current data
    if (this.columns.length > 0 && this.data) {
      this.columns[0].items = this.data;
    }
  },
};
</script>

<style scoped>
.columns-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.columns-container {
  display: flex;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  background-color: #fafafa;
}

.column {
  display: flex;
  flex-direction: column;
  min-width: 250px;
  max-width: 400px;
  border-right: 1px solid #e8e8e8;
  background-color: white;
  flex-shrink: 0;
}

.column-header {
  padding: 10px 15px;
  border-bottom: 1px solid #f2f6fd;
  font-weight: 500;
  font-size: 13px;
  color: #606266;
  background-color: #f5f7fa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.column-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.column-item {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f9f9f9;
  transition: background-color 0.2s;
  user-select: none;
}

.column-item:hover {
  background-color: #f0f9ff;
}

.column-item.selected {
  background-color: #e6f7ff;
  border-left: 3px solid #409eff;
  padding-left: 7px;
}

.column-item.is-folder .item-name::after {
  content: '';
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 5px solid #606266;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  margin-left: auto;
}

.item-icon {
  display: flex;
  align-items: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.matter-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #303133;
  display: flex;
  align-items: center;
}

.item-actions {
  display: none;
  gap: 2px;
  margin-left: 5px;
  flex-shrink: 0;
}

.column-item:hover .item-actions {
  display: flex;
}

.action-btn {
  font-size: 14px !important;
}

.empty-column {
  padding: 20px 15px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.empty-action {
  position: absolute;
  top: 22%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
}

.empty-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}
</style>
