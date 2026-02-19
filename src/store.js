import Vue from 'vue'
import Vuex from 'vuex'
import Cookie from 'js-cookie'
import zSystem from './libs/zpan/system'
import zUser from './libs/zpan/user'

Vue.use(Vuex)

// 创建 API 服务实例
const systemService = new zSystem()
const userService = new zUser()

export default new Vuex.Store({
  state: {
    token: null,
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
    setToken(state, token) {
      state.token = token
    },
    clearToken(state) {
      state.token = null
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
    // 初始化 token：从 cookie 中恢复 token 到 state
    initToken({ state, commit }) {
      if (!state.token) {
        const tokenFromCookie = Cookie.get('z-token')
        if (tokenFromCookie) {
          commit('setToken', tokenFromCookie)
        }
      }
    },
    // 设置 token：同时保存到 state 和 cookie
    saveToken({ commit }, token) {
      commit('setToken', token)
      Cookie.set('z-token', token, { path: '/' })
    },
    // 清除 token：同时清除 state 和 cookie
    removeToken({ commit }) {
      commit('clearToken')
      commit('clearUser')
      commit('setUserProfile', null)
      Cookie.remove('z-token')
    },
    // 设置用户信息（处理 roles 的转换）
    setUser({ commit }, user) {
      // 确保 roles 是数组格式
      if (user && user.roles) {
        if (typeof user.roles === 'string') {
          // 如果 roles 是字符串，转换为数组
          user.roles = user.roles.split(',').map(role => role.trim())
        }
      }
      commit('setUser', user)
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
