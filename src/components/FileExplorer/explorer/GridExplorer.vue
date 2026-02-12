<template>
  <div class="explorer">
    <div v-if="data && data.length > 0" style="width: 100%">
      <div class="explorer-item" v-for="item in data" :key="item.alias" @click="onNameClick(item)">
        <i v-if="item.dirtype" class="matter-icon el-icon-folder" style="color: #ffc402"></i>
        <i v-else :class="`iconfont ${type2icon(item.type)}`"></i>
        <p>{{ item.name }}</p>
      </div>
    </div>
    <div v-else style="width: 100%; text-align: center; padding: 40px 0; color: #999;">
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
  methods: {
    onSelectionChange(selection) {
      this.$emit("selection-change", selection);
    },
    onSelectable(row, index) {
      if (!row.dirtype) return true;
    },
    handleCommand(command) {
      command.action(command.row);
    },
    onScrollEnd() {
      this.$emit("scroll-end")
    },
  },
};
</script>

<style scoped>
.explorer {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.explorer-item {
  width: 80px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
}

.explorer-item:hover {
  background: #f0f6fd;
  border-radius: 5px;
}

.explorer-item i {
  font-size: 55px;
}

.explorer-item p {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>s