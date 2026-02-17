<template></template>

<script>
export default {
  mounted() {
    this.$zpan.User.signout().then((ret) => {
      // 清除 Vuex store 和 cookie 中的 token
      this.$store.dispatch('removeToken');
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