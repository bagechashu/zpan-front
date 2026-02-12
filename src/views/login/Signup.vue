<template>
  <div class="guest">
    <el-row style="height: 80px"></el-row>
    <div style="width: 400px; margin: 0 auto">
      <el-card class="box-card" style="padding: 10px 20px">
        <div slot="header">
          <i class="icon el-icon-postcard"></i>
          <p class="title">{{ $t('signup.title') }}</p>
        </div>

        <el-form :model="formItem" :rules="rules" ref="formItem">
          <el-form-item prop="email">
            <el-input v-model="formItem.email" :placeholder="$t('signup.email-placeholder')" autofocus></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input type="password" v-model="formItem.password" :placeholder="$t('signup.password-placeholder')"></el-input>
          </el-form-item>
          <el-form-item prop="password2">
            <el-input type="password" v-model="formItem.password2" :placeholder="$t('signup.password-confirm-placeholder')"></el-input>
          </el-form-item>
          <el-form-item prop="invitation">
            <el-input v-model="formItem.ticket" :placeholder="$t('signup.invitation-placeholder')"></el-input>
          </el-form-item>
          <el-form-item>
            <el-row>
              <el-button type="primary" @click="signUp('formItem')" style="width: 100%">{{ $t('signup.signup-btn') }}</el-button>
            </el-row>
            <el-row>
              <el-link type="primary" :underline="false" @click="$router.push({ name: 'signin' })">{{ $t('signup.back-to-signin') }}</el-link>
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
      formItem: {},
    };
  },
  computed: {
    rules() {
      const validatePass = (rule, value, callback) => {
        if (value === "") {
          callback(new Error(this.$t('signup.password-required')));
        } else {
          if (this.formItem.password2 !== "") {
            this.$refs.formItem.validateField("password2");
          }
          callback();
        }
      };
      const validatePass2 = (rule, value, callback) => {
        if (value === "") {
          callback(new Error(this.$t('signup.password-confirm-required')));
        } else if (value !== this.formItem.password) {
          callback(new Error(this.$t('signup.password-mismatch')));
        } else {
          callback();
        }
      };
      return {
        email: [
          { required: true, message: this.$t('signup.email-required'), trigger: "blur" },
          { type: "email", message: this.$t('signup.email-invalid'), trigger: ["blur", "change"] },
        ],
        password: [{ validator: validatePass, trigger: "blur", required: true }],
        password2: [{ validator: validatePass2, trigger: "blur", required: true }],
      };
    }
  },
  methods: {
    signUp(name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }

        this.$zpan.User.signup(this.formItem).then((ret) => {
          this.$message({
            type: "success",
            message: this.$t('signup.signup-success'),
          });
          this.$router.push({ name: "signin" });
        });
      });
    },
  },
  mounted() {
    // 设置角色标签
    this.$set(this.formItem, 'roles', 'member');
    this.$set(this.formItem, 'storage', 100);
  },
};
</script>