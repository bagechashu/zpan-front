<template>
  <div class="list-wrapper">
    <el-table style="width: 100%" height="100%" tooltip-effect="dark" size="small" :data="data" v-loading="loading" v-el-table-infinite-scroll="onScrollEnd" @selection-change="onSelectionChange" highlight-current-row :empty-text="''">
      <el-table-column type="selection" width="30" :selectable="onSelectable"></el-table-column>
      <el-table-column prop="name" :label="$t('fth.name')" min-width="200" show-overflow-tooltip sortable>
        <template slot-scope="scope">
          <i v-if="scope.row.dirtype" class="matter-icon el-icon-folder" style="color: #ffc402"></i>
          <i v-else :class="`iconfont matter-icon ${type2icon(scope.row.type)}`"></i>
          <el-link :underline="false" class="matter-title" href="Javascript: void(0);">
            <span @click="onNameClick(scope.row)">{{ scope.row.name }}</span>
          </el-link>
        </template>
      </el-table-column>
      <el-table-column width="150">
        <template slot-scope="scope">
          <div style="float: right; vertical-align: super" class="operation">
            <el-link v-for="item in rowButtons" :key="item.name" v-show="!item.shown || item.shown(scope.row)" type="primary" :underline="false">
              <i :class="`${item.icon} el-icon--right`" @click="item.action(scope.row)"></i>
            </el-link>

            <el-dropdown v-show="moreButtons && moreButtons.length > 0" trigger="click" @command="handleCommand">
              <el-link type="primary" class="el-dropdown-link" :underline="false">
                <i class="el-icon-more el-icon--right"></i>
              </el-link>

              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-for="item in moreButtons" :key="item.name" v-show="!item.shown || item.shown(scope.row)" :command="{ action: item.action, row: scope.row }">
                  {{ item.title }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="size" :label="$t('fth.size')" width="120" show-overflow-tooltip sortable>
        <template slot-scope="scope">
          <div v-if="scope.row.dirtype">-</div>
          <div v-else>{{ scope.row.size }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="uploader" :label="$t('fth.uploader')" width="180" show-overflow-tooltip sortable>
        <template slot-scope="scope">
          {{ scope.row.uploader && scope.row.uploader.username ? scope.row.uploader.username : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="updated" :label="$t('fth.updated')" width="180" sortable>
        <template slot-scope="scope">{{ scope.row.updated | moment }}</template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && (!data || data.length === 0)" class="empty-action">
      <div class="empty-text">{{ $t('table.empty-text') }}</div>
      <el-button type="primary" size="mini" plain @click="forceRefreshPage">{{ $t("ft.force-refresh") }}</el-button>
    </div>
  </div>
</template>

<script>
import mixin from "./mixin";
import elTableInfiniteScroll from "el-table-infinite-scroll";
export default {
  mixins: [mixin],
  directives: {
    "el-table-infinite-scroll": elTableInfiniteScroll,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onSelectionChange(selection) {
      this.$emit("selection-change", selection);
    },
    onSelectable(row) {
      if (!row.dirtype) return true;
    },
    handleCommand(command) {
      command.action(command.row);
    },
    onScrollEnd() {
      this.$emit("scroll-end");
    },
    forceRefreshPage() {
      window.location.reload(true);
    },
  },
};
</script>

<style scoped>
.list-wrapper {
  position: relative;
  height: 100%;
}

.empty-action {
  position: absolute;
  top: 22%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
}

.empty-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.matter-icon {
  font-size: 35px;
}
.matter-title {
  display: inline;
  margin-left: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  top: -8px;
  position: relative;
}

.el-table__row .operation {
  display: none;
}
.el-table__row:hover .operation {
  display: block;
}

.el-table >>> .el-checkbox__inner {
  width: 15px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.operation .el-link {
  font-size: 20px !important;
  margin: 0 2px;
}
</style>
