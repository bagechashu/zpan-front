"use strict";

import Vue from 'vue';
import axios from "axios";
import { Notification } from 'element-ui';
import Cookie from 'js-cookie';
import store from '../store';

// Full config:  https://github.com/axios/axios#request-config
// axios.defaults.baseURL = process.env.baseURL || process.env.apiUrl || '';
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

// 根据环境动态设置 withCredentials
// 生产环境强制启用（HTTPS + HttpOnly Cookie 认证）
// 开发环境默认启用（本地测试用 HTTP）
const isProduction = process.env.NODE_ENV === 'production';
const withCredentialsEnv = process.env.VUE_APP_WITH_CREDENTIALS;
let withCredentials = isProduction ? true : (withCredentialsEnv === 'false' ? false : true);

let config = {
  // baseURL: process.env.baseURL || process.env.apiUrl || ""
  // timeout: 60 * 1000, // Timeout
  withCredentials: withCredentials, // HttpOnly Cookie 跨域发送 (生产环境强制启用)
};

const _axios = axios.create(config);

// 公开路由列表（不需要认证的页面）
const publicRoutes = ['/u/signin', '/u/signup', '/u/password-reset', '/installer', '/s/'];

// 检查当前路由是否是公开路由
const isPublicRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return publicRoutes.some(route => path.includes(route));
};

// Request 拦截器：添加 JWT token 到 Authorization header
_axios.interceptors.request.use(
  function (config) {
    // 优先从 Vuex store 获取 token，如果没有则从 cookie 中获取
    let token = store.state.token;
    if (!token) {
      token = Cookie.get('z-token');
      // 如果从 cookie 中获取到 token，存到 Vuex store
      if (token) {
        store.commit('setToken', token);
      }
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Response 拦截器
_axios.interceptors.response.use(
  function (response) {
    // Do something with response data
    return response.data;
  },
  function (error) {
    if (axios.isCancel(error)) {
      return Promise.reject(error.message ? error.message : "Request canceled");
    }

    // 处理认证失败（401、403）
    // 但仅在非公开路由时才重定向，避免在登录页面形成循环
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // 只要不是公开路由才清除 token 和重定向
      if (!isPublicRoute()) {
        // 清除 Vuex store 和 cookie 中的 token
        store.dispatch('removeToken');
        
        // 重定向到登录页
        if (window.location.pathname !== '/u/signin') {
          window.location = "/u/signin";
        }
      }
      return Promise.reject(error.response.status === 401 ? "invalid login status" : "access denied");
    }

    let msg = error.message;
    if (error.response && error.response.data && error.response.data.msg) {
      msg = error.response.data.msg;
    }

    Notification.error(msg);
    return Promise.reject(error);
  }
);

Plugin.install = function (Vue, options) {
  Vue.axios = _axios;
  window.axios = _axios;
  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return _axios;
      }
    },
    $axios: {
      get() {
        return _axios;
      }
    },
  });
};

Vue.use(Plugin)

export default Plugin;
