<template>
  <div class="explorer">
    <div v-if="data && data.length > 0" class="explorer-content">
      <div class="explorer-item" v-for="item in data" :key="item.alias" @click="onNameClick(item)">
        <i v-if="item.dirtype" class="matter-icon el-icon-folder"></i>
        <i v-else :class="`iconfont ${type2icon(item.type)}`"></i>
        <p class="item-name">{{ item.name }}</p>
      </div>
    </div>
    <div v-else class="explorer-empty">
      {{ $t('table.empty-text') }}
    </div>
  </div>
</template>

<script>
import mixin from "./mixin";
export default {
  mixins: [mixin],
  data() {
    return {};
  },
};
</script>

<style scoped>
.explorer {
  width: 100%;
}

.explorer-content {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.explorer-item {
  width: 100px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.2s;
  box-sizing: border-box;
  flex-shrink: 0;
}

.explorer-item:hover {
  background-color: #f0f6fd;
}

.explorer-item i {
  font-size: 55px;
  display: block;
  margin-bottom: 5px;
  color: #ffc402;
}

.explorer-item i.iconfont {
  color: inherit;
}

.item-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

.explorer-empty {
  width: 100%;
  text-align: center;
  padding: 40px 0;
  color: #999;
}
</style>