<template>
  <el-card shadow="never" class="box-card">
    <div slot="header" class="clearfix">
      <span>个人信息</span>
    </div>

    <el-form ref="form" :model="profile" :rules="rules" label-width="100px" class="profile">
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="user.email" disabled></el-input>
      </el-form-item>
      <el-form-item label="邀请码" prop="ticket">
        <el-input v-model="user.ticket" disabled></el-input>
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="profile.nickname"></el-input>
      </el-form-item>
      <el-form-item label="个人介绍" prop="bio">
        <el-input type="textarea" v-model="profile.bio"></el-input>
      </el-form-item>
      <el-form-item label="URL" prop="url">
        <el-input v-model="profile.url"></el-input>
      </el-form-item>
      <el-form-item label="公司" prop="company">
        <el-input v-model="profile.company"></el-input>
      </el-form-item>
      <el-form-item label="地址" prop="location">
        <el-input v-model="profile.location"></el-input>
      </el-form-item>
      <el-form-item label="语言" prop="locale">
        <el-select v-model="profile.locale">
          <el-option v-for="lang in langs" :key="lang.value" :value="lang.value" :label="lang.label">{{ lang.label }}</el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm('form')">保存</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
export default {
  data() {
    return {
      user: {},
      profile: {},
      rules: {},
      langs: [
        { label: "中文", value: "zh-CN" },
        { label: "English", value: "en" },
      ],
    };
  },
  methods: {
    loadInfo() {
      // 优先从 store 获取用户信息
      if (this.$store.state.userProfile) {
        this.user = this.$store.state.userProfile;
        this.profile = this.$store.state.userProfile.profile;
        return;
      }

      // 如果 store 中没有，则请求 API
      this.$store.dispatch('fetchUserProfile').then((userProfile) => {
        this.user = userProfile;
        this.profile = userProfile.profile;
      }).catch((err) => {
        console.error('Failed to fetch user profile:', err);
        this.$message.error('获取用户信息失败');
      });
    },
    submitForm(name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }

        this.$zpan.User.updateProfile(this.profile).then((ret) => {
          this.$message({
            type: "success",
            message: "保存成功!",
          });
          // 保存后重新刷新 store 中的用户信息
          this.$store.dispatch('fetchUserProfile').then(() => {
            this.loadInfo();
          });
        });
      });
    },
  },
  mounted() {
    this.loadInfo();
  },
};
</script>

<style>
.profile {
  width: 60%;
}
</style>