<template>
  <el-card shadow="never">
    <div slot="header" class="clearfix">
      <span>站点设置</span>
    </div>

    <el-form ref="form" :model="form" label-width="100px" style="width: 500px">
      <el-form-item label="站点名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="站点描述">
        <el-input v-model="form.intro" type="textarea"></el-input>
      </el-form-item>
      <el-form-item label="默认语言">
        <el-select v-model="form.locale" placeholder="请选择系统默认语言">
          <el-option label="中文" value="zh-CN"></el-option>
          <el-option label="英语" value="en"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="邀请码注册">
        <el-switch v-model="form.invite_required"></el-switch>
        <span class="tips"><i class="el-icon-warning"></i>开启后只允许通过邀请码进行注册</span>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
export default {
  data() {
    return {
      form: {},
    };
  },
  methods: {
    refresh() {
      // 优先从 store 获取配置
      if (this.$store.state.coreSiteLoaded && this.$store.state.coreSite) {
        this.form = { ...this.$store.state.coreSite };
        return;
      }

      // 如果 store 中没有，则请求 API，并更新 store
      this.$store.dispatch('fetchCoreSite').then((coreSite) => {
        this.form = { ...coreSite };
      }).catch((err) => {
        console.error('Failed to fetch core site config:', err);
      });
    },
    onSubmit() {
      this.$zpan.System.optSave("core.site", this.form).then((ret) => {
        // 保存后更新 store 中的配置
        this.$store.commit('setCoreSite', this.form);
        this.$message({
          type: "success",
          message: this.$t("msg.save-success"),
        });
        this.refresh();
      });
    },
  },
  mounted() {
    this.refresh();
  },
};
</script>

<style>
.tips {
  margin: 0 10px;
  color: #979696;
}
.tips i {
  padding: 0 2px;
}
</style>