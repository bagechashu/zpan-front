<template>
  <div class="guest">
    <el-row style="height: 80px"></el-row>
    <div style="width: 400px; margin: 0 auto">
      <el-card class="box-card" style="padding: 10px 20px">
        <div slot="header">
          <i class="icon el-icon-lock"></i>
          <p class="title">{{ $t('login.title') }}</p>
        </div>

        <el-form ref="formItem" :model="formItem" :rules="rules">
          <el-form-item prop="email">
            <el-input v-model="formItem.email" :placeholder="$t('login.email-placeholder')"></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="formItem.password" type="password" :placeholder="$t('login.password-placeholder')" @keyup.enter.native="signIn('formItem')"></el-input>
          </el-form-item>
          <el-form-item>
            <el-row>
              <el-button type="primary" @click="signIn('formItem')" style="width: 100%">{{ $t('login.signin-btn') }}</el-button>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-link type="primary" :underline="false" @click="goto('reset_apply')">{{ $t('login.forgot-password') }}</el-link>
              </el-col>
              <el-col :span="12" style="text-align: right">
                <el-link type="primary" :underline="false" @click="goto('signup')">{{ $t('login.signup') }}</el-link>
              </el-col>
            </el-row>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      redirect: "/",
      formItem: {
        email: "",
      },
    };
  },
  computed: {
    rules() {
      return {
        email: [{ required: true, message: this.$t('login.email-required'), trigger: "blur" }],
      };
    }
  },
  methods: {
    goto(name) {
      this.$router.push({ name: name });
    },
    signIn(name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }

        this.$zpan.User.signin(this.formItem)
          .then((ret) => {
            // 保存用户信息（HttpOnly Cookie 由服务器自动管理，无需前端操作）
            if (ret && ret.uid) {
              const user = {
                uid: ret.uid,
                username: ret.username,
                roles: ret.roles
              };
              this.$store.dispatch('setUser', user);
              // 标记为已登录（放在 store 中）
              this.$store.commit('setAuthStatus', { authenticated: true });
              
              // 登录成功后，异步获取完整用户信息到 store，然后重定向
              this.$store.dispatch('fetchUserProfile').then(() => {
                location.replace(this.redirect);
              }).catch((err) => {
                // 即使获取用户信息失败，也继续重定向
                // eslint-disable-next-line no-console
                console.error('Failed to fetch user profile after login:', err);
                location.replace(this.redirect);
              });
            }
          })
          .catch((err) => {

            // todo 判断如果账户未激活则提示是否重发邮件，调用重发邮件接口帮助用户重新激活账户
          });
      });
    },
  },
  mounted() {
    if (this.$route.query.redirect) {
      this.redirect = this.$route.query.redirect;
    }
    if (this.$route.params.email) {
      this.formItem.email = this.$route.params.email;
    }
  },
};
</script>
