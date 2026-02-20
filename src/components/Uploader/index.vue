<template>
  <div class="uploader">
    <div style="display: flex; justify-content: space-between">
      <h5>{{ title }}</h5>
      <file-upload ref="upload" v-model="files" :multiple="true" :maximum="50" @input-filter="inputFilter" @input-file="inputFile"> </file-upload>
    </div>
    <el-table :data="files" size="mini" :show-header="false" empty-text="暂无上传任务" style="width: 100%">
      <el-table-column prop="icon" width="50">
        <template slot-scope="scope">
          <i :class="`iconfont matter-icon ${type2icon(scope.row.type)}`"></i>
        </template>
      </el-table-column>
      <el-table-column prop="name">
        <template slot-scope="scope">
          <div>{{ scope.row.name }}</div>
          <el-progress :percentage="Number(scope.row.progress)" v-show="scope.row.progress != 100" :stroke-width="3" :show-text="false"></el-progress>
          <div style="font-size: 12px;">
            <span class="size">{{ fomatSize(scope.row.size) }}</span>
            <span class="speed" v-show="scope.row.progress != 100">{{ fomatSize(scope.row.speed) }}/s</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="op" width="100">
        <template slot-scope="scope">
          <el-button v-if="scope.row.progress == 100" type="primary" size="mini" icon="el-icon-folder" circle plain @click="onFolderClick(scope.row.matter)"></el-button>
          <el-button v-if="scope.row.progress != 100" type="primary" size="mini" icon="el-icon-close" circle plain @click="onRemoveFile(scope.row)"></el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="tip">- 仅展示本次上传任务 -</div>
  </div>
</template>

<script>
import FileUpload from "vue-upload-component";
import utils from "@/libs/utils";
import UploadQueueManager from "@/libs/UploadQueueManager";

export default {
  components: {
    FileUpload,
  },
  data() {
    return {
      sid: 0,
      dist: "",
      files: [],
      uploading: false,
      uploadedCnt: 0,
      uploadQueueManager: null,
      startTime: null,
      totalSize: 0,
      uploadedSize: 0,
    };
  },
  created() {
    // Initialize the shared upload queue manager
    // maxConcurrent = 1 ensures sequential uploads to prevent database lock issues
    this.uploadQueueManager = new UploadQueueManager(1, async (newFile) => {

      try {
        // Step 0: Check for existing files with the same name
        const existing = await this.$zpan.File.checkExistingFile(
          this.sid,
          this.dist,
          newFile.name
        )

        if (existing) {
          // File with same name already exists - throw error, no rename option
          const message = `文件 "${newFile.name}" 已存在，不允许重复上传`
          this.$message.error(message)
          this.$refs.upload.remove(newFile)
          throw new Error(message)
        }

        // Step 1: Create file metadata on server (no retry for folder uploads)
        const ret = await this.$zpan.File.createFile(this.sid, this.dist, newFile)
        
        newFile.putAction = ret.data.uploader.upURL
        newFile.headers = ret.data.uploader.upHeaders
        newFile.matter = ret.data
        
        // Step 2: Wait for the actual file upload and uploadDone to complete
        // This Promise will be resolved by inputFile() method when uploadDone completes
        return new Promise((resolve, reject) => {
          newFile._uploadPromiseResolve = resolve
          newFile._uploadPromiseReject = reject
          
          // Activate upload for this specific file only
          this.$refs.upload.active = true
        })
      } catch (err) {
        console.error("File processing failed", err)
        const message = err.message || this.$t('msg.create-failed', { name: newFile.name })
        this.$message({
          type: "error",
          message: message,
        })
        this.$refs.upload.remove(newFile)
        throw err
      }
    });
  },
  watch: {
    files(nv) {
      this.$emit("utotal-change", nv.length);
    },
  },
  computed: {
    title() {
      let text = this.uploading ? "正在上传" : "上传完成";
      
      if (this.uploading && this.files.length > 0) {
        // Calculate upload speed and remaining time
        const stats = this.uploadQueueManager.getStats();
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const avgSpeed = this.uploadedSize / Math.max(elapsedSeconds, 1);
        const remainingSize = this.totalSize - this.uploadedSize;
        const remainingSeconds = remainingSize / Math.max(avgSpeed, 1);
        
        // Format remaining time
        let timeText = '';
        if (remainingSeconds > 0 && remainingSeconds !== Infinity) {
          const hours = Math.floor(remainingSeconds / 3600);
          const minutes = Math.floor((remainingSeconds % 3600) / 60);
          const seconds = Math.floor(remainingSeconds % 60);
          
          if (hours > 0) {
            timeText = ` - 预计还需 ${hours}h ${minutes}m`;
          } else if (minutes > 0) {
            timeText = ` - 预计还需 ${minutes}m ${seconds}s`;
          } else if (seconds > 0) {
            timeText = ` - 预计还需 ${seconds}s`;
          }
        }
        
        const speed = utils.formatBytes(avgSpeed, 1);
        return `${text}（${this.uploadedCnt}/${this.files.length}，速度 ${speed}/s${timeText}）`;
      }
      
      return `${text}（${this.uploadedCnt}/${this.files.length}）`;
    },
  },
  methods: {
    type2icon(type) {
      let [t1, t2] = type.split("/");
      let mt = ["pdf", "html", "xml", "psd", "rtf"];
      if (mt.includes(t2)) {
        return `icon-${t2}`;
      }

      let codeTypes = ["json", "yaml", "x-yaml"];
      if (codeTypes.includes(t2)) {
        return "icon-html";
      }

      let compressedFileTypes = ["zip", "x-gzip"];
      if (compressedFileTypes.includes(t2)) {
        return "icon-compressed-file";
      }

      let gt = ["audio", "video", "image", "text"];
      if (gt.includes(t1)) {
        return `icon-${t1}`;
      }

      return "icon-file";
    },
    fomatSize(v) {
      return utils.formatBytes(v, 1);
    },
    onFolderClick(matter) {
      this.$router.push({ name: "disk", params: this.$route.params, query: { dir: matter.parent } });
    },
    
    onRemoveFile(file) {
      this.$refs.upload.remove(file);
    },
    uploadSelect(obj) {
      this.sid = obj.sid;
      this.dist = obj.dist;
      if (!this.$refs.upload.features.directory) {
        this.alert("Your browser does not support");
        return;
      }

      let input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("style", "display: none");
      input.setAttribute("multiple", true);
      if (obj.type == "folder") {
        input.setAttribute("allowdirs", true);
        input.setAttribute("directory", true);
        input.setAttribute("webkitdirectory", true);
      }
      document.querySelector("body").appendChild(input);
      input.click();
      input.onchange = (e) => {
        if (obj.type == "folder") {
          // For folder uploads, check for duplicates
          this.handleFolderSelection(input);
        } else {
          // For file uploads, proceed directly
          this.$refs.upload.addInputFile(input);
          document.querySelector("body").removeChild(input);
        }
      };
    },

    /**
     * Handle folder selection - check for internal duplicates
     */
    handleFolderSelection(input) {
      const fileList = input.files;
      if (fileList.length === 0) {
        return;
      }

      // Check for duplicates within the folder
      const duplicates = this.checkFolderDuplicates(fileList);
      
      if (duplicates.length > 0) {
        const duplicateNames = duplicates.join(', ');
        this.$message.error(`文件夹中存在重名文件，不允许上传。重名文件: ${duplicateNames}`);
        document.querySelector("body").removeChild(input);
        return;
      }
      
      // No duplicates, add all files to upload
      this.$refs.upload.addInputFile(input);
      document.querySelector("body").removeChild(input);
    },

    /**
     * Check for duplicate filenames in the folder
     */
    checkFolderDuplicates(fileList) {
      const fileNamesByPath = {}; // Track files by path to find duplicates
      const duplicates = new Set(); // Store duplicate file names

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const path = file.webkitRelativePath || file.name;
        const parts = path.split('/');
        
        // Check for duplicates: same filename in the same directory
        if (parts.length > 1) {
          // For files in subdirectories
          const dirPath = parts.slice(0, -1).join('/');
          const fileName = parts[parts.length - 1];
          const fullPath = `${dirPath}/${fileName}`;
          
          if (fileNamesByPath[fullPath]) {
            // Duplicate found!
            duplicates.add(fileName);
          } else {
            fileNamesByPath[fullPath] = true;
          }
        }
      }

      return Array.from(duplicates);
    },
    inputFilter(newFile, oldFile, prevent) {},
    inputFile(newFile, oldFile) {
      // Handle upload completion
      if (newFile && oldFile && !newFile.active && oldFile.active) {
        
        let uploadSuccess = false;
        
        // Track uploaded size for progress feedback
        this.uploadedSize += newFile.size;
        
        // Check if upload was successful
        if (newFile.xhr && newFile.xhr.status >= 200 && newFile.xhr.status < 300) {
          uploadSuccess = true;
          // File upload successful, now mark as done on server
          this.$zpan.File.uploadDone(oldFile.matter.alias)
            .then((ret) => {
              this.uploadedCnt++;
              this.$message({
                type: "success",
                message: this.$t('msg.upload-success', { name: newFile.name }),
              });
            })
            .catch((err) => {
              console.error("uploadDone failed", err);
              this.$message({
                type: "warning",
                message: this.$t('msg.upload-done-failed', { name: newFile.name }),
              });
            })
            .finally(() => {
              // CRITICAL: Resolve the Promise to signal queue that this file is COMPLETELY done
              // This allows the queue to process the next file
              if (oldFile._uploadPromiseResolve) {
                oldFile._uploadPromiseResolve({ success: true });
              }
              
              this.$emit("upload-completed");
            });
        } else if (newFile.xhr && newFile.xhr.status >= 400) {
          this.$message({
            type: "error",
            message: `${newFile.name} 上传失败 (HTTP ${newFile.xhr.status})`,
          });
          this.$emit("upload-completed");
          
          // Reject the Promise to signal queue that this file failed
          if (oldFile._uploadPromiseReject) {
            oldFile._uploadPromiseReject(new Error(`Upload failed with HTTP ${newFile.xhr.status}`));
          }
        } else if (newFile.error) {
          this.$message({
            type: "error",
            message: `${newFile.name} 上传出错: ${newFile.error}`,
          });
          this.$emit("upload-completed");
          
          // Reject the Promise to signal queue that this file failed
          if (oldFile._uploadPromiseReject) {
            oldFile._uploadPromiseReject(newFile.error);
          }
        } else {
          this.$message({
            type: "warning",
            message: `${newFile.name} 上传状态未知`,
          });
          this.$emit("upload-completed");
          
          // Reject the Promise to signal queue that this file is in unknown state
          if (oldFile._uploadPromiseReject) {
            oldFile._uploadPromiseReject(new Error("Upload completed with unknown state"));
          }
        }
        
        this.$refs.upload.active = false;
        
        // Check if all files have been uploaded
        if (this.uploadedCnt === this.files.length && this.uploadQueueManager.getQueueLength() === 0 && this.uploadQueueManager.getActiveCount() === 0) {
          this.uploading = false;
        }
        return;
      }

      if (!newFile && oldFile) {
        return;
      }

      // Handle new file added to list
      if (newFile && (!oldFile || newFile.error !== oldFile.error)) {
        this.$emit("uploadAdded");
        
        // Initialize progress tracking
        if (!newFile.matter) {
          if (!this.uploading) {
            this.startTime = Date.now();
            this.uploadedSize = 0;
            this.totalSize = 0;
          }
          
          // Update total size
          this.totalSize += newFile.size;
          
          this.uploading = true;
          this.uploadQueueManager.add(newFile).catch((err) => {
            console.error("Upload queue error:", err);
          });
        }
      }
    },
  },
  beforeDestroy() {
    this.uploadQueueManager.clear();
  },
};
</script>

<style lang="stylus">
.uploader
  .size
    color: #878c9c;

  .speed
    color: #06a7ff;
    float: right;

  .tip
    color: #afb3bf;
    margin-top: 10px;
    text-align: center;

  .matter-icon
    font-size: 35px;
    padding-left: 5px;
</style>