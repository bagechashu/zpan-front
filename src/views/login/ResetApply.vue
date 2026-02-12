<template>
  <div class="guest">
    <el-row style="height: 80px"></el-row>
    <div style="width: 400px; margin: 0 auto">
      <el-card class="box-card" style="padding: 10px 20px">
        <div slot="header">
          <i class="icon el-icon-key"></i>
          <p class=\"title\">{{ $t('reset.title') }}</p>
        </div>

        <el-form :model=\"formItem\" :rules=\"rules\" ref=\"resetForm\">
          <el-form-item prop=\"email\">
            <el-input v-model=\"formItem.email\" :placeholder=\"$t('reset.email-placeholder')\"></el-input>
          </el-form-item>
          <el-form-item>
            <el-row>
              <el-button type=\"primary\" @click=\"reset('resetForm')\" style=\"width: 100%\">{{ $t('reset.send-email-btn') }}</el-button>
            </el-row>
            <el-row>
              <el-link type=\"primary\" :underline=\"false\" @click=\"$router.push({ name: 'signin' })\">{{ $t('reset.back-to-signin') }}</el-link>
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
      return {
        email: [
          { required: true, message: this.$t('reset.email-required'), trigger: "blur" },
          {
            type: "email",
            message: this.$t('reset.email-invalid'),
            trigger: ["blur", "change"],
          },
        ],
      };
    }
  },
  methods: {
    reset(name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }

        this.$zpan.User.applyPasswordReset(this.formItem.email).then((ret) => {
          this.$message({
            type: "success",
            message: this.$t('reset.send-success'),
          });
          this.$router.push({ name: "signin" });
        });
      });
    },
  },
};
</script>
