<template>
  <el-header>
    <div class="logo">
      <img src="@/assets/logo.png" alt="ZPan" @click="$router.push('/')" />
    </div>
    <el-menu v-if="showMenu" class="navbar" :default-active="menuActive" mode="horizontal" style="width: 100%" router>
      <el-menu-item v-for="(menu, index) in menus.slice(0, 5)" :key="index" :index="`/${menu.name}`">{{ menu.title }}</el-menu-item>

      <el-submenu index="more" v-show="menus.length > 5">
        <template slot="title">更多</template>
        <el-menu-item v-for="(menu, index) in menus.slice(5)" :key="index" :index="menu.path">{{ menu.title }}</el-menu-item>
      </el-submenu>
    </el-menu>

    <div v-if="logined" style="position: absolute; right: 20px">
      <!-- 音乐播放器 -->
      <el-popover v-if="alistVisible" ref="alist" placement="top" width="500" style="margin-right: 20px">
        <i slot="reference" class="el-icon-service"></i>

        <zp-aplayer ref="aplayer"></zp-aplayer>
      </el-popover>

      <!-- 任务管理器 -->
      <el-popover ref="ulist" placement="bottom-end" width="500" style="margin-right: 20px">
        <i slot="reference" class="el-icon-sort">
          <el-badge v-show="ulistTotal" :value="ulistTotal" style="top: -15px"></el-badge>
        </i>

        <zp-uploader ref="uploader" @uploadAdded="$refs.ulist.doShow()" @utotal-change="onUTotalChange"></zp-uploader>
      </el-popover>

      <el-dropdown trigger="click" @command="onDropdown" @visible-change="onVisible">
        <el-avatar :size="30" :src="profile.avatar" style="vertical-align: middle; margin-right: 4px"></el-avatar>
        <span>{{ profile.nickname }}</span>
        <el-dropdown-menu slot="dropdown" style="width: 200px">
          <div style="margin: auto 20px">
            <el-row style="text-align: center; margin: 10px 0">
              <el-avatar :size="50" :src="profile.avatar"></el-avatar>
            </el-row>
            <el-row class="storage">
              <p>
                <span style>{{ $t("leftnav.storage") }}</span>
                <span style="float: right">{{ storage.percentage }}%</span>
              </p>
              <el-progress :percentage="storage.percentage" :show-text="false"></el-progress>
              <p style="color: rgba(0, 0, 0, 0.54); font-size: 0.75rem">{{ storage.used }}/{{ storage.max }}</p>
            </el-row>
          </div>

          <el-dropdown-item icon="el-icon-setting" command="profile" divided>{{ $t("topbar.settings") }}</el-dropdown-item>
          <el-dropdown-item icon="el-icon-set-up" command="admin" v-show="showAdmin">{{ $t("topbar.s-platform") }}</el-dropdown-item>
          <el-dropdown-item icon="el-icon-switch-button" command="signout">{{ $t("topbar.signout") }}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script>
import { setup } from "@/i18n";
import utils from "@/libs/utils";
const defaultAvatar = "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";
import ZpUploader from "@/components/Uploader";
import ZpAplayer from "@/components/ZAPlayer";
export default {
  components: {
    ZpUploader,
    ZpAplayer,
  },
  props: {
    menus: Array,
    logined: Boolean,
  },
  data() {
    return {
      alistVisible: false,
      ulistTotal: 0,
      storage: {
        percentage: 0,
      },
      user: {},
      profile: {},
    };
  },
  watch: {
    locale(nv) {
      setup(nv);
    },
  },
  computed: {
    showMenu() {
      return this.menus && this.menus.length > 0;
    },
    showAdmin() {
      const user = this.$store.state.user;
      if (!user || !user.roles) {
        return false;
      }
      const roles = user.roles;
      if (Array.isArray(roles)) {
        return roles.some(role => {
          const roleStr = typeof role === 'string' ? role : role.name || role.title || '';
          return roleStr.trim().toLowerCase() === 'admin';
        });
      }
      if (typeof roles === 'string') {
        return roles.split(',').some(role => role.trim().toLowerCase() === 'admin');
      }
      return false;
    },
    menuActive() {
      return `/${this.$route.params.sname}`;
    },
  },
  methods: {
    onUTotalChange(uTotal) {
      this.ulistTotal = uTotal;
    },
    userInfo() {
      if (this.$store.state.userProfile) {
        this.user = this.$store.state.userProfile;
        this.profile = this.user.profile;
        if (this.profile.avatar == "") {
          this.profile.avatar = defaultAvatar;
        }
        
        if (!this.$store.state.user || !this.$store.state.user.roles || !Array.isArray(this.$store.state.user.roles)) {
          let roles = this.user.roles;
          if (typeof roles === 'string' && roles) {
            roles = roles.split(',').map(role => role.trim()).filter(role => role);
          }
          if (!Array.isArray(roles)) {
            roles = [];
          }
          this.$store.commit('setUser', {
            uid: this.user.id,
            username: this.user.username,
            roles: roles
          });
        }
        
        this.updateStorage();
        return;
      }
      this.$store.dispatch('fetchUserProfile').then((userProfile) => {
        this.user = userProfile;
        this.profile = this.user.profile;
        if (this.profile.avatar == "") {
          this.profile.avatar = defaultAvatar;
        }

        if (this.profile.locale) {
          this.$i18n.locale = this.profile.locale;
        }

        let roles = this.user.roles || this.user.role;
        if (typeof roles === 'string' && roles) {
          roles = roles.split(',').map(role => role.trim()).filter(role => role);
        }
        if (!Array.isArray(roles)) {
          roles = [];
        }
        // 保存用户信息到 Vuex store（简要信息）
        this.$store.commit('setUser', {
          uid: this.user.id,
          username: this.user.username,
          roles: roles
        });

        this.updateStorage();
      }).catch((error) => {
        // 如果请求失败（如 401），忽略错误
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user profile:', error);
      });
    },
    // 更新存储空间显示
    updateStorage() {
      if (this.user && this.user.storage) {
        this.storage = {
          used: utils.formatBytes(this.user.storage.used, 0),
          max: utils.formatBytes(this.user.storage.max, 0),
          percentage: this.user.storage.max === 0 ? 0 : Math.round((this.user.storage.used / this.user.storage.max) * 10000) / 100,
        };
      }
    },
    onDropdown(index) {
      this.$router.push({ name: index });
    },
    onVisible(visible) {
      if (visible) {
        this.userInfo();
      }
    },
    uploadSelect(obj) {
      // 立即打开上传状态弹窗，不要等到上传结束
      this.$nextTick(() => {
        this.$refs.ulist.doShow();
      });
      // 然后触发文件选择
      this.$refs.uploader.uploadSelect(obj);
    },
    AplayerOpen(obj, link) {
      this.alistVisible = true;
      setTimeout(() => {
        this.$refs.aplayer.play(obj, link);
        this.$refs.alist.doShow();
      }, 500);
    },
  },
  mounted() {
    if (this.logined) {
      this.userInfo();
      // 监听上传完成事件，刷新文件列表
      if (this.$refs.uploader) {
        this._uploadCompletedHandler = () => {
          try {
            this.$root.$emit("file-list-refresh");
          } catch (err) {
            console.error("Error emitting file-list-refresh:", err);
          }
        };
        this.$refs.uploader.$on("upload-completed", this._uploadCompletedHandler);
      }
    }
  },
  beforeDestroy() {
    // Clean up event listeners
    if (this._uploadCompletedHandler && this.$refs.uploader) {
      this.$refs.uploader.$off("upload-completed", this._uploadCompletedHandler);
    }
  },
};
</script>

<style>
.el-header {
  display: flex;
  line-height: 60px;
  background-color: #fff;
  box-shadow: 1px 1px 8px #c9c9c9;
  margin-bottom: 5px;
}
.el-header .logo {
  width: 150px;
  display: inline-block;
  font-size: 35px;
  padding: 0 15px;
  vertical-align: middle;
}

.logo img {
  cursor: pointer;
}

.el-header .navbar {
  font-weight: bold;
}

.el-header .storage {
  margin: 15px 0;
}
</style>