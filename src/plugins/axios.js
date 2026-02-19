"use strict";

import Vue from 'vue';
import _axios from '../libs/zpan/axios';

// Vue 插件：注册 axios 为全局属性，供组件中使用 this.$axios
const Plugin = {
  install(Vue, options) {
    Object.defineProperties(Vue.prototype, {
      $axios: {
        get() {
          return _axios;
        }
      },
    });
  }
};

Vue.use(Plugin);

export default Plugin;
