<template></template>

<script>
export default {
  mounted() {
    this.$zpan.User.signout().then((ret) => {
      // 清除认证状态和用户信息
      this.$store.dispatch('logout');
      this.$message({
        type: "success",
        message: this.$t("msg.signout-success"),
      });
      this.$router.push({ name: "signin" });
    });
  },
};
</script>

<style>
</style>