<template>
  <el-dialog :title="title" :visible.sync="visible" width="35%">
    <el-form :model="form" :rules="rules" ref="form" style="width: 85%">
      <el-form-item prop="email" :label="$t('user.email-label')" label-width="100px">
        <el-input v-model="form.email" :placeholder="$t('user.email-placeholder')" autofocus></el-input>
      </el-form-item>
      <el-form-item prop="role" :label="$t('user.role-label')" label-width="100px">
        <el-select v-model="form.roles" :placeholder="$t('user.role-placeholder')" style="width: 100%">
          <el-option v-for="item in roles" :key="item.value" :label="item.label" :value="item.value"> </el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="storage" :label="$t('user.storage-label')" label-width="100px">
        <el-input :placeholder="$t('user.storage-placeholder')" v-model="form.storage" style="width: 100%">
          <el-select v-model="unitValue" slot="append" :placeholder="$t('user.storage-unit')" style="width: 80px">
            <el-option v-for="item in units" :key="item.value" :label="item.label" :value="item.value"> </el-option>
          </el-select>
        </el-input>
      </el-form-item>
      <el-form-item prop="password" :label="$t('user.password-label')" label-width="100px">
        <el-input type="password" v-model="form.password" :placeholder="$t('user.password-placeholder')"></el-input>
      </el-form-item>
      <el-form-item prop="password2" :label="$t('user.password-confirm-label')" label-width="100px">
        <el-input type="password" v-model="form.password2" :placeholder="$t('user.password-confirm-placeholder')"></el-input>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button size="medium" @click="close">{{ $t("op.cancel") }}</el-button>
      <el-button size="medium" type="primary" @click="submit">{{ $t("op.confirm") }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import utils from "@/libs/utils";
import { DialogMixin } from "@/libs/mixin";
export default {
  mixins: [DialogMixin],
  props: {
    title: { type: String, default: "" },
  },
  data() {
    return {
      unitValue: utils.bytesUnits()[2].value,
      form: {
        roles: "member",
        storage: 100,
      },
    };
  },
  computed: {
    roles() {
      return [
        { label: this.$t("user.role-admin"), value: "admin" },
        { label: this.$t("user.role-member"), value: "member" },
      ];
    },
    units() {
      return utils.bytesUnits();
    },
    rules() {
      const validatePass = (rule, value, callback) => {
        if (value === "") {
          callback(new Error(this.$t("user.password-required")));
        } else {
          if (this.form.password2 !== "") {
            this.$refs.form.validateField("password2");
          }
          callback();
        }
      };
      const validatePass2 = (rule, value, callback) => {
        if (value === "") {
          callback(new Error(this.$t("user.password-confirm-required")));
        } else if (value !== this.form.password) {
          callback(new Error(this.$t("user.password-mismatch")));
        } else {
          callback();
        }
      };
      return {
        email: [
          { required: true, message: this.$t("user.email-required"), trigger: "blur" },
          { type: "email", message: this.$t("user.email-invalid"), trigger: ["blur", "change"] },
        ],
        password: [{ validator: validatePass, trigger: "blur", required: true }],
        password2: [{ validator: validatePass2, trigger: "blur", required: true }],
      };
    }
  },
  methods: {
    submit() {
      this.form.storage_max = Math.round(this.form.storage * this.unitValue);
      this.$zpan.User.signup(this.form).then((ret) => {
        this.finish();
        this.$message({
          type: "success",
          message: this.$t("msg.save-success"),
        });
      });
    },
  },
};
</script>

<style>
</style>