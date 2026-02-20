<template>
  <div>
    <Topbar />
    <el-empty description="页面不存在">
      <el-button type="primary" @click="$router.push({ path: '/' })">返回首页</el-button>
    </el-empty>
  </div>
</template>

<script>
import Topbar from "@/components/Topbar";
export default {
  components: { Topbar }
};
</script>

<style>
</style>