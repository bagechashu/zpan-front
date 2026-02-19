"use strict";

import axios from "axios";
import { Notification } from 'element-ui';
import store from '../../store';

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
    baseURL: "/api",
    // timeout: 60 * 1000, // Timeout
    withCredentials: withCredentials, // HttpOnly Cookie 会自动随请求发送
    // headers: { "X-Zplat-Subsystem": "zpan" }
};

const _axios = axios.create(config);

// Response 拦截器
_axios.interceptors.response.use(
    function (response) {
        return response.data;
    },
    function (error) {
        // 处理错误响应
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                // 处理认证失败 (401)
                // HttpOnly Cookie 过期或无效时，清除认证状态
                case 401: {
                    store.dispatch('logout');

                    let msg = data && data.msg ? data.msg : '认证失效, 请重新登录';
                    Notification.error(msg);

                    return Promise.reject("invalid login status");
                }

                // 处理权限不足 (403)
                case 403: {
                    // 仅显示通知，不重定向，由业务层决定如何处理
                    let msg = data && data.msg ? data.msg : '权限不足';
                    Notification.error(msg);

                    return Promise.reject("access denied");
                }

                // 处理系统未初始化 (520)
                case 520: {
                    return Promise.reject(error);
                }

                // 其他错误状态码直接返回
                default: {
                    let msg = data && data.msg ? data.msg : '权限不足';
                    Notification.error(msg);

                    return Promise.reject(error);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default _axios;