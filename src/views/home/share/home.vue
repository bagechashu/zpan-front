<template>
  <div>
    <Topbar />
    <div style="margin: 20px 50px">
      <el-empty v-if="!matter.id" description="分享已失效">
        <el-button type="primary">去分享者主页</el-button>
      </el-empty>

      <!-- for folder -->
      <el-card v-else-if="matter.dirtype" class="folder-card" shadow="never">
        <div slot="header" class="header clearfix">
          <div>
            <span class="name">{{ matter.name }}</span>
            <div style="float: right">
              <el-button type="primary" size="medium" icon="el-icon-download" @click="onDownloadClick">下载</el-button>
            </div>
          </div>
          <p class="time">
            <i class="el-icon-time"></i>
            <span>{{ matter.created | moment("YYYY-MM-DD HH:hh") }}</span>
            <span>失效时间：{{ expireTime }}</span>
          </p>
        </div>

        <el-alert 
          title="下载链接过期提示" 
          type="warning" 
          description="下载链接有固定的有效期。如果已失效，请刷新页面后重新点击下载。"
          :closable="true"
          style="margin-bottom: 10px;">
        </el-alert>

        <FileExplorer ref="fexp" class="file-explorer" :dataLoader="dataLoader" :linkLoader="linkLoader" :rowButtons="rowButtons" :rootDir="rootDir" @selection-change="onSelectionChange" />
      </el-card>

      <!-- for file -->
      <el-card v-else-if="info.id" class="file-card" shadow="never">
        <div slot="header" class="header clearfix">
          <div>
            <span class="name">{{ matter.name }}</span>
            <div style="float: right">
              <el-button type="primary" size="medium" icon="el-icon-download" @click="openDownload(matter)">下载</el-button>
            </div>
          </div>
          <p class="time">
            <i class="el-icon-time"></i>
            <span>{{ matter.created | moment("YYYY-MM-DD HH:hh") }}</span>
            <span>失效时间：{{ expireTime }}</span>
          </p>
        </div>

        <el-alert 
          title="下载链接过期提示" 
          type="warning" 
          description="下载链接有固定的有效期。如果已失效，请刷新页面后重新点击下载。"
          :closable="true"
          style="margin-bottom: 10px;">
        </el-alert>

        <div class="content">
          <div>
            <i class="el-icon-document"></i>
            <p>文件大小：{{ matter.size }}</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { transfer } from "@/helper";
import utils from "@/libs/utils.js";
import DialogOutlink from "@/views/home/disk/components/DialogOutlink";
import Topbar from "@/components/Topbar";
export default {
  components: { Topbar },
  data() {
    return {
      rowButtons: [{ name: "download", icon: "el-icon-download", action: this.openDownload, shown: (item) => !item.dirtype }],

      info: {},
      matter: {},
      selectedItems: [],
    };
  },
  computed: {
    layout() {
      if (!this.info.type) {
        return "folder";
      }

      return "file";
    },
    rootDir() {
      return `${this.matter.parent}${this.matter.name}/`; // 以分享的文件夹为根路径
    },
    expireTime() {
      if (this.info.expire_at) {
        return this.info.expire_at.moment();
      }
    },
  },
  methods: {
    dataLoader(dir) {
      return new Promise((resolve, reject) => {
        // 只有当 matter 存在且是目录时，才加载子文件列表
        if (!this.matter.id || !this.matter.dirtype) {
          resolve({ list: [], total: 0 });
          return;
        }

        let alias = this.$route.params.alias;
        // 构建查询目录：去掉前导斜杠转成相对路径，确保末尾有斜杠
        let queryDir = dir ? (this.rootDir + dir) : this.rootDir;
        queryDir = queryDir.replace(/^\//, ''); // 移除前导斜杠，转成相对路径
        if (!queryDir.endsWith('/')) {
          queryDir += '/';
        }
        
        this.$zpan.Share.listMatters(alias, { dir: queryDir }).then((ret) => {
          let data = ret.data;
          data.list = data.list.map((item) => {
            item.size = utils.formatBytes(item.size, 1);
            item.fullpath = `${item.parent}${item.name}`;
            if (item.dirtype) item.fullpath += "/";
            return item;
          });
          resolve(data);
        }).catch(reject);
      });
    },
    linkLoader(obj) {
      return new Promise((resolve, reject) => {
        // If the object already has URL (e.g., from getMatter), use it directly
        if (obj.url) {
          resolve(obj.url);
          return;
        }
        // Otherwise, fetch the matter details to get the URL
        this.$zpan.Share.getMatter(this.info.alias, obj.alias)
          .then((ret) => {
            resolve(ret.url);
          })
          .catch(reject);
      });
    },
    openDownload(obj) {
      this.linkLoader(obj).then((link) => {
        var a = document.createElement("a");
        a.href = link;
        a.download = obj.name;
        a.click();
      }).catch((err) => {
        this.$message({
          type: "error",
          message: "下载链接获取失败：" + (err.message || err),
        });
      });
    },
    onSelectionChange(selection) {
      this.selectedItems = selection;
    },
    onDownloadClick(obj) {
      if (this.selectedItems.length == 0) {
        this.$message({
          type: "warning",
          message: "您还没有选择下载的文件",
        });
      } else if (this.selectedItems.length == 1) {
        this.openDownload(this.selectedItems[0]);
      } else {
        transfer(DialogOutlink)({ items: this.selectedItems });
      }
    },
    listRefresh(alias) {
      this.$zpan.Share.findMatter(alias)
        .then((ret) => {
          this.matter = ret.data;
          this.matter.size = utils.formatBytes(this.matter.size, 1);

          if (this.$refs.fexp) {
            this.$refs.fexp.listRefresh();
          }
        })
        .catch((err) => {
          console.log(12, err);
        });
    },
  },
  watch: {
    $route(nv) {
      this.listRefresh(nv.params.alias);
    },
  },
  mounted() {
    let alias = this.$route.params.alias;
    this.$zpan.Share.find(alias).then((ret) => {
      let info = ret.data;
      if (info.protected && localStorage.getItem("zpan-share") != alias) {
        this.$router.push({ name: "share-draw" });
        return;
      }

      this.info = info;
      this.listRefresh(alias);
      document.title = `${info.name} | Zpan`;
    });
  },
};
</script>

<style scoped>
.file-card {
  width: 800px;
  margin: 0 auto;
  height: 600px;
}

.folder-card {
  min-width: 800px;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

/* 处理 el-card 内部结构 */
.folder-card /deep/ .el-card__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.file-explorer {
  flex: 1;
  overflow: hidden;
}

.header .name {
  font-size: 22px;
  font-weight: bold;
}

.header .time {
  font-size: 12px;
  margin: 10px 0;
}

.time i {
  width: 18px;
}

.time span {
  margin-right: 20px;
}

.content {
  background: #f6f9fd;
  height: 600px;
  text-align: center;
  padding-top: 120px;
}

.content i {
  font-size: 90px;
}

.content p {
  margin-top: 30px;
}
</style>