<template>
  <div>
    <div class="topbar">
      <el-input v-model="query.email" @change="listRefresh" size="medium" :placeholder="$t('admin.storage-search-placeholder')" prefix-icon="el-icon-search" style="width: 300px"></el-input>
      <el-button type="primary" size="medium" style="float: right" @click="onCreate">{{ $t("admin.btn-storage-add") }}</el-button>
    </div>

    <el-card shadow="never" style="margin-top: 10px; padding-bottom: 20px">
      <el-table :data="rows" size="medium" style="width: 100%">
        <el-table-column prop="id" label="ID" width="60"> </el-table-column>
        <el-table-column prop="name" :label="$t('admin.label-name')" width="100"> </el-table-column>
        <el-table-column prop="title" :label="$t('admin.label-title')" width="100"> </el-table-column>
        <el-table-column prop="bucket" :label="$t('admin.label-bucket')" width="150"> </el-table-column>
        <el-table-column prop="endpoint" :label="$t('admin.label-endpoint')"> </el-table-column>
        <el-table-column prop="status" :label="$t('admin.label-status')" width="80">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status == 1" type="success">Enable</el-tag>
            <el-tag v-else type="warning">Disabled</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation" :label="$t('admin.label-operation')" width="310">
          <template slot-scope="scope">
            <el-button size="mini" @click="onEdit(scope.$index, scope.row)">{{ $t("admin.btn-edit") }}</el-button>
            <el-button size="mini" @click="onScan(scope.$index, scope.row)">{{ $t("admin.btn-scan") }}</el-button>
            <el-button size="mini" @click="onStatusSwitch(scope.$index, scope.row)" type="primary" plain>{{ $t(`op.${scope.row.status == 1 ? "disable" : "enable"}`) }}</el-button>
            <el-button size="mini" type="danger" @click="onDelete(scope.$index, scope.row)">{{ $t("op.delete") }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px">
        <el-pagination layout="prev, pager, next" :current-page.sync="pageNo" :page-size="query.limit" :total="total" @current-change="listRefresh" style="float: right"> </el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
import { transfer } from "@/helper";
import EditDialog from "./dialog-edit";
export default {
  data() {
    return {
      query: {
        offset: 0,
        limit: 20,
      },
      pageNo: 1,
      rows: [],
      total: 0,
    };
  },
  methods: {
    listRefresh() {
      this.query.offset = (this.pageNo - 1) * this.query.limit;
      this.$zpan.Storage.list(this.query).then((ret) => {
        this.rows = ret.data.list;
        this.total = ret.data.total;
      });
    },
    onCreate() {
      transfer(EditDialog)({}).then(() => {
        this.listRefresh();
      });
    },
    onEdit(index, row) {
      if (!row.region) row.region = "auto";
      let props = { form: Object.assign({}, row) };
      transfer(EditDialog)(props).then(() => {
        this.listRefresh();
      });
    },
    onStatusSwitch(index, row) {
      const ENABLE = 1;
      const DISABLE = 2;
      let form = Object.assign({}, row);
      let op = this.$t("op.enable");
      let msg = op + this.$t("msg.success");
      let tips = this.$t("tips.enable");
      if (row.status == DISABLE) {
        form.status = ENABLE;
      } else {
        form.status = DISABLE;
        op = this.$t("op.disable");
        msg = op + this.$t("msg.success");
        tips = this.$t("tips.disable");
      }

      this.$confirm(tips, `${op} ${row.name}`, {
        type: "warning",
        confirmButtonText: this.$t("op.confirm"),
        cancelButtonText: this.$t("op.cancel"),
      }).then(() => {
        this.$zpan.Storage.update(form).then((ret) => {
          this.$message({
            type: "success",
            message: msg,
          });
          this.listRefresh();
        });
      });
    },
    onDelete(index, row) {
      this.$confirm(this.$t("tips.remove"), this.$t("op.delete") + ` ${row.name}`, {
        type: "warning",
        confirmButtonText: this.$t("op.confirm"),
        cancelButtonText: this.$t("op.cancel"),
      }).then(() => {
        this.$zpan.Storage.delete(row.id).then((ret) => {
          this.$message({
            type: "success",
            message: this.$t("msg.delete-success"),
          });
          this.listRefresh();
        });
      });
    },
    onScan(index, row) {
      this.$prompt(this.$t("admin.label-prefix") + " (可选)", `扫描 ${row.name}`, {
        confirmButtonText: this.$t("op.confirm"),
        cancelButtonText: this.$t("op.cancel"),
        inputValue: "",
      }).then(({ value }) => {
        const loading = this.$loading({
          lock: true,
          text: "扫描中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        this.$zpan.Storage.scan(row.id, value).then((ret) => {
          loading.close();
          const data = ret.data;
          const msg = `扫描完成：总数 ${data.total}，新建 ${data.created}，跳过 ${data.skipped}，失败 ${data.failed}`;
          
          if (data.errors && data.errors.length > 0) {
            this.$message({
              type: "warning",
              message: msg + `\n错误：${data.errors.join("; ")}`,
              duration: 5000,
            });
          } else {
            this.$message({
              type: "success",
              message: msg,
            });
          }
        }).catch((error) => {
          loading.close();
          const errMsg = (error.response && error.response.data && error.response.data.msg) || error.message || '扫描失败';
          this.$message({
            type: "error",
            message: "扫描失败：" + errMsg,
          });
        });
      }).catch(() => {
        // 用户取消
      });
    },
  },
  mounted() {
    this.listRefresh();
  },
};
</script>

<style>
</style>