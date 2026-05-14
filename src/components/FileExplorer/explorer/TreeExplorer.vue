<template>
  <div class="tree-wrapper">
    <el-tree
      ref="tree"
      :data="treeData"
      :props="treeProps"
      node-key="id"
      highlight-current
      lazy
      :load="loadTreeNode"
      @node-click="handleTreeNodeClick"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
    >
      <span slot-scope="{ node, data }" class="tree-node-content">
        <i 
          v-if="data.dirtype" 
          class="matter-icon el-icon-folder" 
          style="color: #ffc402; font-size: 16px"
        ></i>
        <i 
          v-else 
          :class="`iconfont matter-icon ${type2icon(data.type)}`" 
          style="font-size: 16px"
        ></i>
        <span 
          class="tree-node-label" 
          @click.stop="toggleNodeExpanded(data, node)"
        >
          {{ data.name }}
        </span>
        <span class="tree-node-actions" v-if="showActions(data, node)">
          <el-link 
            v-for="item in rowButtons" 
            :key="item.name" 
            v-show="!item.shown || item.shown(data)" 
            type="primary" 
            :underline="false"
          >
            <i 
              :class="`${item.icon} el-icon--right`" 
              style="font-size: 14px" 
              @click="item.action(data)"
            ></i>
          </el-link>

          <el-dropdown 
            v-show="moreButtons && moreButtons.length > 0" 
            trigger="click" 
            @command="handleCommand"
          >
            <el-link 
              type="primary" 
              class="el-dropdown-link" 
              :underline="false"
            >
              <i class="el-icon-more el-icon--right" style="font-size: 14px"></i>
            </el-link>

            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item 
                v-for="item in moreButtons" 
                :key="item.name" 
                v-show="!item.shown || item.shown(data)" 
                :command="{ action: item.action, row: data }"
              >
                {{ item.title }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </span>
      </span>
    </el-tree>

    <div v-loading="loading" style="height: 100%; width: 100%"></div>
  </div>
</template>

<script>
import mixin from "./mixin";
import { getViewerType } from '@/libs/zpan/fileTypeConfig';

export default {
  mixins: [mixin],
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    dataLoader: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      treeData: [],
      treeProps: {
        children: 'children',
        label: 'name',
        isLeaf: 'isLeaf',
      },
      currentHoveredNode: null,
      loadedNodeIds: new Set(), // 追踪已加载过的节点
      nodeDataCache: {}, // 缓存节点加载过的子节点数据
    };
  },
  watch: {
    value(newVal) {
      if (newVal && Array.isArray(newVal) && newVal.length > 0) {
        this.treeData = this.processRootData(newVal);
      }
    },
  },
  methods: {
    /**
     * 处理根节点数据
     */
    processRootData(items) {
      return items.map(item => this.buildNodeData(item, true));
    },

    /**
     * 构建节点数据对象
     */
    buildNodeData(item, isRoot = false) {
      const nodeId = item.alias || item.name;
      const isDirectory = !!item.dirtype;

      const node = {
        id: nodeId,
        name: item.name || '',
        type: item.type || '',
        dirtype: isDirectory,
        alias: item.alias || '',
        fullpath: item.fullpath || '',
        isLeaf: !isDirectory,
        children: [],
      };

      // 保留原始数据的所有其他字段
      Object.assign(node, item);

      return node;
    },

    /**
     * el-tree lazy load 回调函数
     */
    loadTreeNode(node, resolve) {
      // 根节点加载
      if (!node) {
        if (this.data && Array.isArray(this.data) && this.data.length > 0) {
          const rootNodes = this.processRootData(this.data);
          resolve(rootNodes);
        } else {
          resolve([]);
        }
        return;
      }

      // 非目录节点不加载子节点
      if (!node.data.dirtype) {
        resolve([]);
        return;
      }

      const nodeId = node.data.id;

      // 检查是否已加载过
      if (this.loadedNodeIds.has(nodeId)) {
        const cachedData = this.nodeDataCache[nodeId] || [];
        resolve(cachedData);
        return;
      }

      // 加载子节点数据
      const dir = node.data.fullpath || '';
      this.dataLoader(dir, 0, 1000)
        .then((response) => {
          const items = response.list || [];
          const childNodes = items.map(item => this.buildNodeData(item, false));

          // 缓存数据
          this.loadedNodeIds.add(nodeId);
          this.nodeDataCache[nodeId] = childNodes;

          resolve(childNodes);
        })
        .catch((error) => {
          console.error(`Failed to load children for node "${nodeId}":`, error);
          resolve([]);
        });
    },

    /**
     * 切换节点展开/折叠状态（标签点击）
     */
    toggleNodeExpanded(data, node) {
      if (!data.dirtype) {
        return;
      }

      const nodeId = data.id;
      const isExpanding = !node.expanded; // 是否要展开
      const hasLoaded = this.loadedNodeIds.has(nodeId); // 是否已加载过

      // 如果要展开且未加载过，需要先加载
      if (isExpanding && !hasLoaded) {
        this.loadChildrenAndExpand(data, node);
      } else {
        // 已加载过或要折叠，直接切换
        node.expanded = !node.expanded;
      }
    },

    /**
     * 加载子节点并展开
     */
    loadChildrenAndExpand(data, node) {
      const nodeId = data.id;
      const dir = data.fullpath || '';

      this.dataLoader(dir, 0, 1000)
        .then((response) => {
          const items = response.list || [];
          const childNodes = items.map(item => this.buildNodeData(item, false));

          // 缓存数据
          this.loadedNodeIds.add(nodeId);
          this.nodeDataCache[nodeId] = childNodes;

          // 设置子节点
          data.children = childNodes;

          // 在下一个tick中设置展开，确保DOM已更新
          this.$nextTick(() => {
            node.expanded = true;
          });
        })
        .catch((error) => {
          console.error(`Failed to load children for node "${nodeId}":`, error);
        });
    },

    /**
     * el-tree node-click 事件处理
     */
    handleTreeNodeClick(data, node, treeNode) {
      // 处理文件点击事件
      this.handleFileClick(data);
    },

    /**
     * 处理文件点击
     */
    handleFileClick(data) {
      // 如果点击的是目录，不处理（由展开/折叠处理）
      if (data.dirtype) {
        return;
      }

      // 使用统一的文件类型配置获取 viewer 类型
      const viewerType = getViewerType(data.type, data.name);
      if (viewerType) {
        this.$emit('on-click', viewerType, data);
      } else {
        // 未知类型的文件
        this.$emit('on-click', 'file', data);
      }
    },

    /**
     * 节点展开事件
     */
    handleNodeExpand(data, node, treeNode) {
      this.currentHoveredNode = node;
    },

    /**
     * 节点折叠事件
     */
    handleNodeCollapse(data, node, treeNode) {
      this.currentHoveredNode = null;
    },

    /**
     * 下拉菜单命令处理
     */
    handleCommand(command) {
      if (command && command.action && command.row) {
        command.action(command.row);
      }
    },

    /**
     * 判断是否显示操作按钮
     */
    showActions(data, node) {
      return this.currentHoveredNode === node || node.expanded;
    },

    /**
     * 清空缓存并刷新页面
     */
    forceRefreshPage() {
      window.location.reload(true);
    },
  },
  mounted() {
    // 初始化根节点数据
    if (this.data && Array.isArray(this.data) && this.data.length > 0) {
      this.treeData = this.processRootData(this.data);
    }
  },
};
</script>

<style scoped>
.tree-wrapper {
  position: relative;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  flex: 1;
  width: 100%;
}

.tree-node-label {
  margin-left: 8px;
  flex: 1;
  cursor: pointer;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-actions {
  display: none;
  align-items: center;
  margin-left: 10px;
  white-space: nowrap;
}

.tree-node-content:hover .tree-node-actions {
  display: flex;
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

.matter-icon {
  font-size: 16px;
  margin-right: 5px;
}

.el-tree >>> .el-tree-node__content {
  height: 32px;
  line-height: 32px;
}

.el-tree >>> .el-tree-node__content:hover {
  background-color: #f5f5f5;
}

.operation .el-link {
  font-size: 16px !important;
  margin: 0 2px;
}
</style>
