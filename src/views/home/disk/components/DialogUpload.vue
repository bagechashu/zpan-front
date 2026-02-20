<template>
  <div>
    <el-dialog :title="$t('dialog.upload-title')" :visible.sync="visible" :file-list="fileList" :close-on-click-modal="false" :close-on-press-escape="false" :before-close="closeConfirm" width="400px">
      {{ destDir }}
      <el-upload ref="uploader" class="uploader" action="" :http-request="handleUpload" :limit="20" :on-progress="handleProgress" :on-success="handleProgress" :on-exceed="handleExceed" :on-remove="handleRemove" drag multiple>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          {{ $t("dialog.upload-tips") }}
          <em>{{ $t("dialog.upload-click") }}</em>
        </div>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script>
import { DialogMixin } from "@/libs/mixin";
import UploadQueueManager from "@/libs/UploadQueueManager";

export default {
  mixins: [DialogMixin],
  props: {
    sid: Number,
    destDir: String,
  },
  data() {
    return {
      fileList: [],
      uploading: false,
      uploadQueueManager: null,
      maxRetries: 2,
    };
  },
  created() {
    // Initialize the shared upload queue manager
    // maxConcurrent = 1 ensures sequential uploads to prevent database lock issues
    this.uploadQueueManager = new UploadQueueManager(1, async (fileObj) => {
      return this._checkAndUploadFile(fileObj);
    });
  },
  methods: {
    _uploadWithRetry(fileObj, attempt = 0) {
      fileObj.filename = fileObj.file.name;
      
      return this.$zpan.File.upload(Number(this.sid), fileObj, this.destDir, (c) => {
        // Capture abort function if needed
      })
        .catch((err) => {
          if (attempt < this.maxRetries) {
            // Exponential backoff
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(this._uploadWithRetry(fileObj, attempt + 1));
              }, 1000 * Math.pow(2, attempt));
            });
          }
          
          // After all retries failed
          this.$message.error(this.$t('msg.upload-failed', { name: fileObj.filename }) + ': ' + err.message);
          throw err;
        });
    },

    // Check if a file with the same name already exists
    async _checkAndUploadFile(fileObj) {
      try {
        // Check if a file with the same name already exists
        const existing = await this.$zpan.File.checkExistingFile(
          Number(this.sid),
          this.destDir,
          fileObj.file.name
        )

        if (existing) {
          // File already exists - throw error, no rename option
          const message = `文件 "${fileObj.file.name}" 已存在，不允许重复上传`
          this.$message.error(message)
          throw new Error(message)
        }

        // No conflict, proceed with upload
        fileObj.filename = fileObj.file.name
        return this._uploadWithRetry(fileObj)
      } catch (err) {
        throw err
      }
    },
    closeConfirm(done) {
      if (this.fileList.length > 0 && this.uploading) {
        this.$confirm(this.$t('tips.uploading-cancel'), '', {
          confirmButtonText: this.$t('op.confirm'),
          cancelButtonText: this.$t('op.cancel'),
          type: "warning",
          customClass: "cancel-confirm",
        }).then(() => {
          this.fileList.forEach((file) => {
            this.$refs.uploader.abort(file);
          });
          this.uploadQueueManager.clear();
          done();
        });
        return;
      }

      done();
    },

    handleProgress(event, file, fileList) {
      this.uploading = file.status == "uploading";
      this.fileList = fileList;
    },
    
    handleExceed(files, fileList) {
      this.$message.warning(this.$t('upload.max-files-tip', { max: 20 }));
    },
    
    handleRemove(file, fileList) {
      this.$refs.uploader.abort(file);
    },
    
    handleUpload(fileObj) {
      // Add file to the shared queue manager
      return this.uploadQueueManager.add(fileObj);
    },
  },
  beforeDestroy() {
    this.uploadQueueManager.clear();
    this.completed();
  },
};
</script>

<style >
.cancel-confirm {
  vertical-align: top;
}
</style>