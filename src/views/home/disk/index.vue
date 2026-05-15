<style scoped>
.toolbar {
  height: 45px;
  border-bottom: 1px solid #f2f6fd;
  margin-bottom: 5px;
}

.search {
  width: 200px;
}

.iconfont {
  font-size: 30px;
  vertical-align: middle;
}

.view-icon {
  width: 24px;
  height: 24px;
  margin-left: 10px;
  cursor: pointer;
  vertical-align: middle;
  display: inline-block;
  transition: opacity 0.3s ease;
  color: #606266;
  filter: invert(0.2);
  font-size: 18px;
  line-height: 24px;
}

.view-icon:hover {
  opacity: 0.7 !important;
}
</style>

<template>
  <div style="height: calc(100% - 58px)">
    <el-row class="toolbar">
      <el-dropdown size="small" style="margin-right: 10px" @command="onUploadSelect">
        <el-button type="primary" size="small" icon="el-icon-upload" @click="onUploadSelect('file')">{{ $t('disk.upload') }}</el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="file">{{ $t('disk.upload-file') }}</el-dropdown-item>
          <el-dropdown-item command="folder">{{ $t('disk.upload-folder') }}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <el-button type="primary" size="small" icon="el-icon-folder-add"  @click="openCreateFolderDiglog" plain>{{ $t('op.create-folder') }}</el-button>
      <el-button-group v-show="selectedItems.length > 0" style="margin-left: 10px">
        <el-button type="primary" icon="el-icon-download" size="medium" plain @click="onOutlinkClick">{{ $t("disk.download") }}</el-button>
        <!-- <el-button type="primary" icon="el-icon-share" size="medium" @click="share" plain>分享</el-button> -->
        <el-button type="primary" icon="el-icon-delete" size="medium" plain @click="deleteSelection">{{ $t("disk.delete") }}</el-button>
        <!-- <el-button type="primary" size="medium" plain>移动到</el-button> -->
      </el-button-group>

      <div style="float: right">
        <el-input class="search" size="small" :placeholder="$t('topbar.search')" v-model="query.kw" @keyup.enter.native="listRefresh">
          <i slot="prefix" class="el-input__icon el-icon-search"></i>
        </el-input>
        <el-tooltip content="List View" placement="top">
          <img v-if="layout == 'list'" class="view-icon" src="@/assets/icon-list.svg" alt="list" style="opacity: 0.5" />
          <img v-else class="view-icon" src="@/assets/icon-list.svg" alt="list" @click="layout = 'list'" />
        </el-tooltip>
        <el-tooltip content="Tree View" placement="top">
          <img v-if="layout == 'tree'" class="view-icon" src="@/assets/icon-tree.svg" alt="tree" style="opacity: 0.5" />
          <img v-else class="view-icon" src="@/assets/icon-tree.svg" alt="tree" @click="layout = 'tree'" />
        </el-tooltip>
        <el-tooltip content="Grid View" placement="top">
          <img v-if="layout == 'grid'" class="view-icon" src="@/assets/icon-grid.svg" alt="grid" style="opacity: 0.5" />
          <img v-else class="view-icon" src="@/assets/icon-grid.svg" alt="grid" @click="layout = 'grid'" />
        </el-tooltip>
        <el-tooltip content="Columns View" placement="top">
          <img v-if="layout == 'columns'" class="view-icon" src="@/assets/icon-columns.svg" alt="columns" style="opacity: 0.5" />
          <img v-else class="view-icon" src="@/assets/icon-columns.svg" alt="columns" @click="layout = 'columns'" />
        </el-tooltip>
      </div>
    </el-row>

    <!-- main -->
    <FileExplorer :layout="layout" ref="fexp" :dataLoader="dataLoader" :linkLoader="linkLoader" :rowButtons="rowButtons" :moreButtons="moreButtons" @file-open="onFileOpen" @selection-change="onSelectionChange" />

    <!-- dialog -->
    <!-- <DialogMove ref="move" @completed="listRefresh"></DialogMove>
    <DialogShare ref="share"></DialogShare>
    <DialogUpload ref="uploader" :sid="getSid()" :dest-dir="query.dir" @completed="listRefresh"></DialogUpload>
    <DialogOutlink ref="outlink"></DialogOutlink> -->
  </div>
</template>

<script>
// @ is an alias to /src
import { transfer } from "@/helper";
import PreviewManager from "@/components/Viewers";
import { getViewerType, isPreviewable as checkPreviewable } from "@/libs/zpan/fileTypeConfig";
import DialogMove from "./components/DialogMove";
import DialogShare from "./components/DialogShare";
import DialogUpload from "./components/DialogUpload";
import DialogOutlink from "./components/DialogOutlink";
import { CSMixin } from "@/libs/mixin";
export default {
  mixins: [CSMixin],
  data() {
    return {
      query: {
        kw: "",
        dir: "",
      },
      layout: "list",
      moreButtons: [
        { name: "move", title: this.$t("ftb.move"), action: this.move, shown: (item) => !item.dirtype },
        { name: "rename", title: this.$t("ftb.rename"), action: this.rename, shown: (item) => !item.dirtype },
        { name: "remove", title: this.$t("ftb.remove"), action: this.remove },
      ],
      selectedItems: [],
    };
  },
  watch: {
    $route(newVal, oldVal) {
      this.query.type = newVal.query.type; // doc,image,audio,vedio
    },
  },
  computed: {
    rowButtons() {
      if (this.cs.mode == 1) {
        return [
          { name: "preview", icon: "el-icon-view", action: this.previewFile, shown: (item) => !item.dirtype && this.isPreviewable(item) },
          { name: "download", icon: "el-icon-download", action: this.openDownload, shown: (item) => !item.dirtype },
          { name: "share", icon: "el-icon-share", action: this.share },
        ];
      }

      return [
        { name: "preview", icon: "el-icon-view", action: this.previewFile, shown: (item) => !item.dirtype && this.isPreviewable(item) },
        { name: "download", icon: "el-icon-download", action: this.openDownload, shown: (item) => !item.dirtype },
        { name: "viewlink", icon: "el-icon-view", action: this.viewlink },
      ];
    },
  },
  methods: {
    dataLoader(dir, offset, limit) {
      if (dir != this.query.dir) {
        this.query.dir = dir;
      }

      this.query.sid = this.getSid();
      this.query.offset = offset ? offset : 0;
      this.query.limit = limit ? limit : 10;
      return new Promise((resolve, reject) => {
        this.$zpan.File.list(this.query).then((ret) => {
          resolve(ret);
        }).catch((err) => {
          this.$message({
            type: "error",
            message: this.$t("msg.list-load-failed"),
          });
          reject(err);
        });
      });
    },
    linkLoader(obj) {
      return new Promise((resolve, reject) => {
        this.$zpan.File.get(obj.alias)
          .then((ret) => {
            resolve(ret.url);
          })
          .catch(reject);
      });
    },
    listRefresh() {
      this.$refs.fexp.listRefresh();
    },
    openDownload(obj) {
      this.linkLoader(obj).then((link) => {
        let a = document.createElement("a");
        a.setAttribute("href", link);
        a.setAttribute("download", obj.name);
        a.click();
        a.remove();
      }).catch((err) => {
        this.$message({
          type: "error",
          message: this.$t("msg.download-failed") || "Download failed",
        });
      });
    },
    openCreateFolderDiglog() {
      this.$prompt(this.$t("tips.create-folder"), this.$t("op.create-folder"), {
        confirmButtonText: this.$t("op.confirm"),
        cancelButtonText: this.$t("op.cancel"),
      }).then(({ value }) => {
        this.$zpan.File.createFolder(this.getSid(), value, this.query.dir).then((ret) => {
          this.$message({
            type: "success",
            message: this.$t("msg.create-success"),
          });
          this.listRefresh();
        }).catch((err) => {
          this.$message({
            type: "error",
            message: this.$t("msg.create-failed") || "Create folder failed",
          });
        });
      }).catch(() => {});
    },
    openCreateFileDiglog() {
      this.$prompt(
        this.$t('tips.create-file'),
        this.$t('op.create-file'),
        {
          inputValue: 'Untitled.md',
          confirmButtonText: this.$t('op.confirm'),
          cancelButtonText: this.$t('op.cancel'),
        }
      ).then(({ value }) => {
        const fileObj = {
          file: new File([''], value, { type: 'text/plain' }),
          filename: value
        };
        this.$zpan.File.upload(this.getSid(), fileObj).then((data) => {
          this.$message({
            type: "success",
            message: this.$t("msg.create-success"),
          });
          this.listRefresh();
          window.open(`f/editor?alias=${data.alias}`, '_blank');
        }).catch((err) => {
          this.$message({
            type: "error",
            message: this.$t("msg.upload-failed") || "Upload failed",
          });
        });
      }).catch(() => {});
    },
    onUploadSelect(cmd) {
      this.$emit("upload-action", { type: cmd, sid: this.getSid(), dist: this.query.dir });
    },

    onFileOpen(type, obj, link) {
      if (obj.type.startsWith("audio")) {
        this.$emit("audio-open", obj, link);
        return;
      }

      PreviewManager.preview(type, obj, link);
    },
    isPreviewable(item) {
      // 使用统一的文件类型配置检查是否可预览
      return checkPreviewable(item.type, item.name);
    },
    previewFile(item) {
      // 使用统一的文件类型配置获取 viewer 类型
      const type = getViewerType(item.type, item.name) || 'doc';
      
      console.log('[DEBUG] Preview file:', { name: item.name, mimeType: item.type, viewerType: type });
      
      this.linkLoader(item).then((link) => {
        this.onFileOpen(type, item, link);
      });
    },
    onOutlinkClick() {
      transfer(DialogOutlink)({ items: this.selectedItems });
    },
    share(obj) {
      transfer(DialogShare)({ alias: obj.alias });
    },
    viewlink(obj) {
      this.linkLoader(obj).then((link) => {
        const h = this.$createElement;
        this.$msgbox({
          title: this.$t("disk.outlink-title"),
          message: h("p", null, link),
          confirmButtonText: this.$t("op.confirm"),
        });
      });
    },
    move(obj) {
      transfer(DialogMove)({ alias: obj.alias, isDir: obj.dirtype > 0 }).then(() => {
        this.listRefresh();
      });
    },
    rename(obj) {
      this.$prompt(this.$t("tips.rename"), this.$t("op.rename"), {
        inputValue: obj.name,
        confirmButtonText: this.$t("op.confirm"),
        cancelButtonText: this.$t("op.cancel"),
      }).then(({ value }) => {
        this.$zpan.File.rename(obj.alias, value).then((ret) => {
          this.$message({
            type: "success",
            message: this.$t("msg.rename-success"),
          });
          this.listRefresh();
        });
      });
    },
    remove(obj) {
      this.$confirm(this.$t("tips.remove"), this.$t("op.delete") + ` ${obj.name}`, {
        type: "warning",
        confirmButtonText: this.$t("op.confirm"),
        cancelButtonText: this.$t("op.cancel"),
      }).then(() => {
        this.$zpan.File.delete(obj.alias).then((ret) => {
          this.$message({
            type: "success",
            message: this.$t("msg.delete-success"),
          });
          this.listRefresh();
        });
      });
    },
    onSelectionChange(selection) {
      this.selectedItems = selection;
    },
    deleteSelection() {
      this.$confirm(this.$t("tips.batch-delete"), this.$t("op.batch-delete"), {
        type: "warning",
        confirmButtonText: this.$t("op.confirm"),
        cancelButtonText: this.$t("op.cancel"),
      }).then(() => {
        const loading = this.$loading({
          lock: true,
          text: this.$t("tips.deleting"),
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        Promise.all(
          this.selectedItems.map((obj) => {
            return this.$zpan.File.delete(obj.alias);
          })
        )
          .then((ret) => {
            this.listRefresh();
            this.$message({
              type: "success",
              message: this.$t("msg.batch-delete-success"),
            });
          })
          .catch((err) => {
            this.$message({
              type: "error",
              message: this.$t("msg.batch-delete-failed") || "Delete failed",
            });
          })
          .finally(() => {
            loading.close();
          });
      });
    },
  },
  mounted() {
    this.query.type = this.$route.query.type;
    // 监听文件列表刷新事件（如上传完成后）
    this._fileListRefreshHandler = () => {
      if (this && typeof this.listRefresh === 'function') {
        this.listRefresh();
      }
    };
    this.$root.$on("file-list-refresh", this._fileListRefreshHandler);
    
    // 初始化加载文件列表
    this.$nextTick(() => {
      this.listRefresh();
    });
  },
  beforeDestroy() {
    // Clean up event listener to avoid memory leaks
    if (this._fileListRefreshHandler) {
      this.$root.$off("file-list-refresh", this._fileListRefreshHandler);
    }
  },
};
</script>
