import Vue from 'vue'
import Vuex from 'vuex'
import zSystem from './libs/zpan/system'
import zUser from './libs/zpan/user'

Vue.use(Vuex)

// 创建 API 服务实例
const systemService = new zSystem()
const userService = new zUser()

export default new Vuex.Store({
  state: {
    // 认证状态：通过后端验证确认，HttpOnly Cookie 由服务器管理
    authStatus: {
      checked: false,      // 是否已检查过
      authenticated: false // 是否已认证
    },
    user: null,
    storages: [],
    cs: {},
    // 系统配置
    coreSite: {
      name: 'ZPan',
      intro: 'ZPan is a simple and efficient private cloud storage system.',
      locale: 'en',
      invite_required: true
    },
    // 完整的用户信息（包括 profile 和 storage）
    userProfile: null,
    // 标记是否已加载站点配置
    coreSiteLoaded: false
  },
  mutations: {
    setAuthStatus(state, { checked, authenticated }) {
      if (checked !== undefined) {
        state.authStatus.checked = checked
      }
      if (authenticated !== undefined) {
        state.authStatus.authenticated = authenticated
      }
    },
    setUser(state, user) {
      state.user = user
    },
    clearUser(state) {
      state.user = null
    },
    storages(state, storages) {
      state.storages = storages
    },
    cs(state, cs) {
      state.cs = cs
    },
    // 设置站点配置
    setCoreSite(state, coreSite) {
      state.coreSite = coreSite
      state.coreSiteLoaded = true
    },
    // 设置完整的用户信息
    setUserProfile(state, userProfile) {
      state.userProfile = userProfile
    }
  },
  actions: {
    // 验证用户认证状态：向服务器发送请求确认用户是否已登录
    // HttpOnly Cookie 由浏览器自动管理，无需 JS 操作
    async checkAuth({ commit }) {
      try {
        const response = await userService.profileGet()
        if (response && response.code === 0 && response.data) {
          const userData = response.data;
          commit('setAuthStatus', { authenticated: true })
          commit('setUserProfile', userData)
          if (userData && userData.id) {
            let roles = userData.roles;
            if (typeof roles === 'string' && roles) {
              roles = roles.split(',').map(role => role.trim()).filter(role => role)
            }
            if (!Array.isArray(roles)) {
              roles = []
            }
            commit('setUser', {
              uid: userData.id,
              username: userData.username,
              roles: roles
            })
          }
        }
      } catch (error) {
        commit('setAuthStatus', { authenticated: false })
        commit('clearUser')
        commit('setUserProfile', null)
      } finally {
        commit('setAuthStatus', { checked: true })
      }
    },
    // 登出：清除所有认证相关数据
    async logout({ commit }) {
      try {
        await userService.signout()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Logout error:', error)
      }
      commit('setAuthStatus', { authenticated: false, checked: false })
      commit('clearUser')
      commit('setUserProfile', null)
      // HttpOnly Cookie 由服务器通过响应清除
    },

    // 获取并设置站点配置
    async fetchCoreSite({ commit, state }) {
      // 如果已加载过，直接返回
      if (state.coreSiteLoaded) {
        return state.coreSite
      }
      try {
        const response = await systemService.optGet('core.site')
        // system.js 的 optGet 方法已经通过 axios 响应拦截器返回了数据
        if (response && response.data) {
          commit('setCoreSite', response.data)
          return response.data
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch core site config:', error)
        // 失败时返回默认值
        return state.coreSite
      }
    },
    // 获取并设置用户完整信息
    async fetchUserProfile({ commit }) {
      try {
        const response = await userService.profileGet()
        console.log("[fetchUserProfile] response:", response);
        // user.js 的 profileGet 方法已经通过 axios 响应拦截器返回了数据
        if (response && response.data) {
          commit('setUserProfile', response.data)
          return response.data
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user profile:', error)
        throw error
      }
    },
    // 清除用户信息缓存
    clearUserProfile({ commit }) {
      commit('setUserProfile', null)
    }
  }
})
