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
      // 优先从 Vuex store 获取用户角色信息
      const user = this.$store.state.user;
      console.log("[showAdmin] store.state.user:", user); // 调试：查看 store 中的 user 对象
      console.log("[showAdmin] userProfile:", this.$store.state.userProfile); // 调试：查看 userProfile
      
      if (!user) {
        console.log("[showAdmin] user is null or undefined");
        return false;
      }
      
      if (!user.roles) {
        console.log("[showAdmin] user.roles is empty");
        return false;
      }

      const roles = user.roles;
      console.log("[showAdmin] User roles:", roles, "Type:", typeof roles); // 调试输出用户角色信息
      
      // 处理 roles 是数组的情况
      if (Array.isArray(roles)) {
        console.log("[showAdmin] roles is array, length:", roles.length);
        return roles.some(role => {
          // 处理数组元素可能是对象或字符串的情况
          const roleStr = typeof role === 'string' ? role : role.name || role.title || '';
          return roleStr.trim().toLowerCase() === 'admin';
        });
      }
      // 处理 roles 是字符串的情况（后端返回的格式可能是 "admin" 或 "admin,user" 或多个角色）
      if (typeof roles === 'string') {
        console.log("[showAdmin] roles is string");
        // 处理空字符串的情况
        if (!roles || roles.trim() === '') {
          console.log("[showAdmin] roles is empty string");
          return false;
        }
        // 分割字符串并检查是否包含 'admin'
        const result = roles.split(',').some(role => role.trim().toLowerCase() === 'admin');
        console.log("[showAdmin] string check result:", result);
        return result;
      }
      console.log("[showAdmin] roles type not recognized");
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
    // 从 store 获取或请求用户信息
    userInfo() {
      console.log("[userInfo] called, userProfile in store:", this.$store.state.userProfile);
      // 优先从 store 中获取用户完整信息
      if (this.$store.state.userProfile) {
        console.log("[userInfo] using userProfile from store");
        this.user = this.$store.state.userProfile;
        this.profile = this.user.profile;
        if (this.profile.avatar == "") {
          this.profile.avatar = defaultAvatar;
        }
        
        // 确保 store 中的 user 对象有正确的 roles 格式
        if (!this.$store.state.user || !this.$store.state.user.roles || !Array.isArray(this.$store.state.user.roles)) {
          console.log("[userInfo] Converting roles to array format");
          let roles = this.user.roles;
          if (typeof roles === 'string' && roles) {
            roles = roles.split(',').map(role => role.trim()).filter(role => role);
          }
          if (!Array.isArray(roles)) {
            roles = [];
          }
          console.log("[userInfo] Setting user with converted roles:", roles);
          this.$store.commit('setUser', {
            uid: this.user.id,
            username: this.user.username,
            roles: roles
          });
        }
        
        this.updateStorage();
        return;
      }

      // 如果 store 中没有，则请求
      console.log("[userInfo] Fetching user profile from server");
      this.$store.dispatch('fetchUserProfile').then((userProfile) => {
        console.log("[userInfo] fetchUserProfile response:", userProfile);
        this.user = userProfile;
        this.profile = this.user.profile;
        if (this.profile.avatar == "") {
          this.profile.avatar = defaultAvatar;
        }

        if (this.profile.locale) {
          this.$i18n.locale = this.profile.locale;
        }

        // 处理 roles：转换为数组格式并确保一致性
        let roles = this.user.roles || this.user.role;
        console.log("[userInfo] Original roles from server:", roles);
        if (typeof roles === 'string' && roles) {
          roles = roles.split(',').map(role => role.trim()).filter(role => role);
        }
        if (!Array.isArray(roles)) {
          roles = [];
        }

        console.log("[userInfo] Converted roles to array:", roles);
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
      // 只在下拉菜单打开时加载用户信息，避免不必要的请求
      console.log("[onVisible] visible:", visible);
      if (visible) {
        this.userInfo();
      }
    },
    uploadSelect(obj) {
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