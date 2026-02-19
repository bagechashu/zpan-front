import Vue from 'vue'
import Router from 'vue-router'
import i18n from './i18n'
import store from './store'

Vue.use(Router)

// 权限常量
export const ROLES = {
  ADMIN: 'admin',
  USER: 'member',
}

let router = new Router({
  mode: 'history',
  routes: [
    { path: '/', name: 'home', component: () => import('./views/home') },
    // { path: '/install', name: 'installer', component: () => import('./views/installer') },
    {
      path: '/:sname',
      component: () => import('./views/home'),
      children: [
        { path: '/', name: 'disk', component: () => import('./views/home/disk') },
        { path: 'pic', name: 'picture', component: () => import('./views/home/picture') },
        { path: 'share', name: 'share', component: () => import('./views/home/share') },
        { path: 'recyclebin', name: 'recyclebin', component: () => import('./views/home/recyclebin') },
      ]
    },
    { path: '/s/:alias', name: 'share-info', component: () => import('./views/home/share/home.vue') },
    { path: '/s/:alias/draw', name: 'share-draw', component: () => import('./views/home/share/draw.vue') },
    { path: '/f/editor', name: 'editor', component: () => import('./views/home/editor') },
    { path: '/viewer/pdf', name: 'viewer', component: () => import('./views/home/viewer/pdf') },
    {
      path: '/settings',
      component: () => import('./views/settings'),
      children: [
        { path: 'profile', name: 'profile', component: () => import('./views/settings/profile') },
        { path: 'security', name: 'security', component: () => import('./views/settings/security') },
        { path: 'developer', name: 'developer', component: () => import('./views/settings/developer') },
      ]
    },
    {
      path: '/admin',
      component: () => import('./views/admin/index.vue'),
      meta: { requiresRole: ROLES.ADMIN },
      children: [
        { path: '', redirect: 'dashboard' },
        { path: 'dashboard', name: 'admin', component: () => import('./views/admin/home'), meta: { requiresRole: ROLES.ADMIN } },
        { path: 'users', name: 'users', component: () => import('./views/admin/users'), meta: { requiresRole: ROLES.ADMIN } },
        { path: 'storages', name: 'storages', component: () => import('./views/admin/storages'), meta: { requiresRole: ROLES.ADMIN } },
        { path: 'settings', name: 'settings', component: () => import('./views/admin/settings'), meta: { requiresRole: ROLES.ADMIN } },
        { path: 'settings/email', name: 'settings-email', component: () => import('./views/admin/settings/email.vue'), meta: { requiresRole: ROLES.ADMIN } },
      ]
    },
    {
      path: "/u",
      component: () => import('./views/login'),
      children: [
        { path: 'signin', name: 'signin', meta: { title: "用户登录" }, component: () => import('./views/login/Signin.vue') },
        { path: 'signout', name: 'signout', meta: { title: "用户登出" }, component: () => import('./views/login/Signout.vue') },
        { path: 'signin/:token64', name: 'activate', meta: { title: "账户激活" }, component: () => import('./views/login/Activate.vue') },
        { path: 'signup', name: 'signup', meta: { title: "用户注册" }, component: () => import('./views/login/Signup.vue') },
        { path: 'password-reset', name: 'reset_apply', meta: { title: "密码找回" }, component: () => import('./views/login/ResetApply.vue') },
        { path: 'password-reset/:token64', name: 'reset_confirm', meta: { title: "密码找回" }, component: () => import('./views/login/ResetConfirm.vue') },
      ]
    },
    { path: '*', name: 'notfound', component: () => import('./views/404') },
  ]
})
/**
 * 公开路由列表（不需要认证的路由）
 * 用于路由守卫和 axios 拦截器中统一使用
 */
export const PUBLIC_ROUTES = [
  '/u/signin',
  '/u/signup',
  '/u/password-reset',
  '/installer',
  '/s/', // 分享链接
];

/**
 * 检查当前路由是否是公开路由
 * @param {string} pathname - 当前路由路径
 * @returns {boolean} 是否为公开路由
 */
export const isPublicRoute = (pathname) => {
  if (!pathname) return false;

  return PUBLIC_ROUTES.some(route => {
    // 精确匹配或前缀匹配（处理动态路由）
    if (route.endsWith('/')) {
      // 对于以 / 结尾的路由（如 /s/），使用前缀匹配
      return pathname.startsWith(route);
    }
    // 对于精确路由，需要匹配完整路径或作为路径的开始
    // /u/signin 应匹配 /u/signin，但不应匹配 /u/signin-demo
    return pathname === route || pathname.startsWith(route + '/');
  });
};

const setTitle = (title) => {
  // 从 store 中获取站点配置，如果未加载则触发加载
  let coreSite = store.state.coreSite

  if (!store.state.coreSiteLoaded) {
    // 首次需要加载配置
    store.dispatch('fetchCoreSite').then(site => {
      applyTitle(site, title)
    }).catch(error => {
      handleTitleError(error)
    })
  } else {
    // 使用已加载的配置
    applyTitle(coreSite, title)
  }
}

const applyTitle = (coreSite, title) => {
  let fullTitle = coreSite.name
  if (title) {
    fullTitle += `- ${title}`
  }
  window.document.title = fullTitle

  // Only set locale if it's a valid loaded locale
  if (coreSite.locale && ['en', 'zh-CN'].includes(coreSite.locale)) {
    i18n.locale = coreSite.locale
  }
}

const handleTitleError = (error) => {
  // 忽略认证失败（401/403）的错误，这在未登录时是正常的
  if (error.response) {
    if (error.response.status === 520) {
      router.push({ name: "installer" })
      return
    } else {
      window.document.title = document.title || 'ZPAN'
      return
    }
  }

  // If API fails, set a default title
  window.document.title = document.title || 'ZPAN'
}

/**
 * 检查用户是否拥有所需的角色
 * @param {object} user - 用户信息对象
 * @param {string} requiredRole - 所需的角色
 * @returns {boolean} 用户是否拥有该角色
 */
const checkUserRole = (user, requiredRole) => {
  if (!user || !user.roles) {
    return false;
  }

  // roles 可能是数组或字符串
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return roles.includes(requiredRole);
};

// 处理路由权限检查，返回是否允许访问
const checkRouteAccess = (to) => {
  if (!to.meta || !to.meta.requiresRole) {
    return true;
  }
  return checkUserRole(store.state.user, to.meta.requiresRole);
};

// 设置页面标题和完成路由导航
const finalizeNavigation = (to, next) => {
  let pageTitle = i18n.t(`title.${to.name}`);
  if (!pageTitle || pageTitle === `title.${to.name}`) {
    pageTitle = '';
  }
  setTitle(pageTitle);
  next();
};

router.beforeEach((to, from, next) => {
  const isPublicRoutePath = isPublicRoute(to.path);
  const authRequired = !isPublicRoutePath;

  // 如果访问受保护的路由，但还没检查过认证状态，则先检查
  if (authRequired && !store.state.authStatus.checked) {
    store.dispatch('checkAuth')
      .then(() => {
        // 认证检查完成后，再次判断是否有权访问
        if (!store.state.authStatus.authenticated) {
          next('/u/signin');
        } else if (!checkRouteAccess(to)) {
          next('/');
        } else {
          finalizeNavigation(to, next);
        }
      })
      .catch(() => {
        // 认证检查失败，重定向到登录
        next('/u/signin');
      });
    return;
  }

  // 如果已检查过认证状态，直接使用存储的状态
  if (authRequired && !store.state.authStatus.authenticated) {
    return next('/u/signin');
  }

  // 检查角色权限
  if (!checkRouteAccess(to)) {
    return next('/');
  }

  finalizeNavigation(to, next);
});

router.afterEach(() => {
  window.scrollTo(0, 0);
});


export default router