<template>
  <section>
    <Topbar ref="topbar" :menus="$store.state.storages" logined />
    <el-container style="height: 100%">
      <el-aside width="200px" style="height: 100%; background-color: #f4f4f5">
        <el-menu :default-active="leftMenuActive" background-color="#f4f4f5" router>
          <el-menu-item v-for="menu in leftMenus" :key="menu.path" :index="menu.path">
            <i :class="menu.icon"></i>
            <span slot="title">{{ menu.title }}</span>
          </el-menu-item>
        </el-menu>

        <!-- <div class="copyright">
        <span>Powered by</span>
        <a href="https://github.com/saltbo/zpan" target="_blank">ZPan</a>
      </div>-->
      </el-aside>

      <el-main style="height: calc(100% - 65px)">
        <router-view @upload-action="onUploadClick" @audio-open="onAudioOpen"></router-view>
      </el-main>
    </el-container>
  </section>
</template>

<script>
import Vue from "vue";
import store from "@/store";
import router from "@/router";
import Topbar from "@/components/Topbar";
import { CSMixin } from "@/libs/mixin";
export default {
  mixins: [CSMixin],
  components: {
    Topbar,
  },
  beforeRouteEnter(to, from, next) {
    Vue.zpan.Storage.list().then((ret) => {
      let storages = ret.data.list;
      // 如果没有存储空间则强制跳去添加存储空间
      if (storages.length == 0) {
        next({ name: "storages" });
        return;
      }

      // 如果访问的是首页则自动跳去第一个存储空间
      if (to.path == "/") {
        next({ path: `/${storages[0].name}` });
        return;
      }

      // 验证访问的 sname 是否有效
      // 如果不是首页且不是有效的存储名称，显示 404
      if (to.params.sname) {
        const validStorageNames = storages.map(s => s.name);
        if (!validStorageNames.includes(to.params.sname)) {
          console.warn(`Invalid storage name: ${to.params.sname}`);
          next({ name: 'notfound' });
          return;
        }
      }

      store.commit("storages", storages);
      next();
    }).catch((err) => {
      // API 调用失败时也记录日志
      console.error('Failed to fetch storage list:', err);
      // 允许继续导航，让组件处理错误
      next();
    });
  },
  data() {
    return {};
  },
  computed: {
    currentBucket() {
      return this.$route.params.sname;
    },
    leftMenuActive() {
      return this.$route.fullPath;
    },
    leftMenus() {
      let menus = [
        { path: `/${this.currentBucket}`, icon: "el-icon-document", title: this.$t("leftnav.files") },
        // { path: `/${this.currentBucket}?type=doc`, icon: "el-icon-xx", title: this.$t("leftnav.doc") },
        { path: `/${this.currentBucket}/pic`, icon: "el-icon-xx", title: this.$t("leftnav.image") },
        // { path: `/${this.currentBucket}?type=audio`, icon: "el-icon-xx", title: this.$t("leftnav.audio") },
        // { path: `/${this.currentBucket}?type=video`, icon: "el-icon-xx", title: this.$t("leftnav.video") },
      ];

      if (this.cs.mode == 1) {
        let netdiskMenus = [
          { path: `/${this.currentBucket}/share`, icon: "el-icon-share", title: this.$t("leftnav.share") },
          { path: `/${this.currentBucket}/recyclebin`, icon: "el-icon-delete", title: this.$t("leftnav.recyclebin") },
        ];
        menus.push(...netdiskMenus);
      }

      return menus;
    },
  },
  watch: {
    $route(newVal, oldVal) {},
  },
  methods: {
    onUploadClick(obj) {
      this.$refs.topbar.uploadSelect(obj);
    },
    onAudioOpen(obj, link) {
      this.$refs.topbar.AplayerOpen(obj, link);
    },
  },
  mounted() {},
};
</script>

<style scoped>
.copyright {
  text-align: center;
  position: absolute;
  bottom: 20px;
  font-size: 10px;
}

.el-main {
  padding: 10px !important;
}

/* 右侧边栏样式 */
.el-aside .el-menu {
  border-right: solid 1px #fff;
  font-weight: 500;
  padding: 0 10px;
}

.el-aside .el-menu-item:focus,
.el-aside .el-menu-item:hover {
  outline: 0;
  background-color: #eaeaea !important;
}
</style>
