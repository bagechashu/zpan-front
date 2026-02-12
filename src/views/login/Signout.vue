<template></template>

<script>
export default {
  mounted() {
    this.$zpan.User.signout().then((ret) => {
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