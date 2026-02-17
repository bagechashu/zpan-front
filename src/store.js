import Vue from 'vue'
import Vuex from 'vuex'
import Cookie from 'js-cookie'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    token: null,
    user: null,
    storages: [],
    cs: {}
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
      Cookie.remove('z-token')
    },
    // 设置用户信息
    setUser({ commit }, user) {
      commit('setUser', user)
    }
  }
})
