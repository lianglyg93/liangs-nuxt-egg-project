<template>
  <div>
    <h1>用户中心</h1>
    <div ref="drag" id="drag">
      <input type="file" name="file" @change="handleFileChange" />
    </div>
    <div>
      <el-progress
        :text-inside="true"
        :stroke-width="20"
        :percentage="uploadProgress"
      ></el-progress>
    </div>
    <div class="btnWrap">
      <el-button @click="uploadFile">上传</el-button>
    </div>
    <div>
      <p>计算hash的进度</p>
      <el-progress
        :stroke-width="20"
        :text-inside="true"
        :percentage="hashProgress"
      ></el-progress>
    </div>

    <div class="cube-container" :style="{ width: cubeWidth + 'px' }">
      <div class="cube" v-for="chunk in chunks" :key="chunk.name">
        <div
          :class="{
            uploading: chunk.progress > 0 && chunk.progress < 100,
            success: chunk.progress == 100,
            error: chunk.progress < 0,
          }"
          :style="{ height: chunk.progress + '%' }"
        >
          <i
            class="el-icon-loading"
            style="color: #f56c6c"
            v-if="chunk.progress < 100 && chunk.progress > 0"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const CHUNK_SIZE = 0.1 * 1024 * 1024;
import sparkMD5 from "spark-md5";
export default {
  data() {
    return {
      file: null,
      // uploadProgress: 0,
      chunks: [],
      hashProgress: 0,
      hash: "",
    };
  },
  computed: {
    cubeWidth() {
      return Math.ceil(Math.sqrt(this.chunks.length)) * 16;
    },
    uploadProgress() {
      if (!this.file || this.chunks.length) {
        return 0;
      }
      const loaded = this.chunks
        .map((item) => item.chunk.size * item.progress)
        .reduce((acc, cur) => acc + cur, 0);
      return parseInt(((loaded * 100) / this.file.size).toFixed(2));
    },
  },
  mounted() {
    // this.init();
    this.bindEvent();
  },
  methods: {
    // async init() {
    //   let { data } = await this.$http.get("/user/info");
    // },

    /** 监听鼠标拖拽文件 */
    bindEvent() {
      const drag = this.$refs.drag;
      drag.addEventListener("dragover", (e) => {
        drag.style.borderColor = "red";
        e.preventDefault();
      });
      drag.addEventListener("dragleave", (e) => {
        drag.style.borderColor = "#eee";
        e.preventDefault();
      });
      drag.addEventListener("drop", (e) => {
        const filesList = e.dataTransfer.files;
        console.log(filesList[0]);
        drag.style.borderColor = "#eee";
        this.file = filesList[0];
        e.preventDefault();
      });
    },

    /** 选择文件 */
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
      this.hashProgress = 0;
    },
    async blobToString(blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function () {
          console.log(reader.result);
          const ret = reader.result
            .split("")
            .map((v) => v.charCodeAt())
            .map((v) => v.toString(16).toUpperCase())
            .map((v) => v.padStart(2, "0"))
            .join("");
          resolve(ret);
          // const ret = reader.
        };
        reader.readAsBinaryString(blob);
      });
    },
    /** 判断是否是gif */
    async isGif(file) {
      const ret = await this.blobToString(file.slice(0, 6));
      // console.log("gif？", ret);
      const isGif = ret == "474946383961" || ret == "474946383761";
      return isGif;
    },
    /** 判断是否是png */
    async isPng(file) {
      const ret = await this.blobToString(file.slice(0, 8));
      // console.log("png?", ret);
      const ispng = ret == "89504E470D0A1A0A";
      return ispng;
    },
    /** 判断是否是jpg */
    async isJpg(file) {
      const len = file.size;
      const start = await this.blobToString(file.slice(0, 2));
      const end = await this.blobToString(file.slice(-2, len));
      // console.log("start=", start, "end=", end);
      const isJPG = start == "FFD8" && end == "FFD9";
      return isJPG;
    },
    /** 判断是否是图片：gif、jpg */
    async isImage(file) {
      return (
        (await this.isGif(file)) ||
        (await this.isPng(file)) ||
        (await this.isJpg(file))
      );
    },
    /** web-worker计算md5值 */
    async calculateHashWorker() {
      return new Promise((resolve) => {
        this.worker = new Worker("/hash.js");
        this.worker.postMessage({ chunks: this.chunks });
        this.worker.onmessage = (e) => {
          const { progress, hash } = e.data;
          this.hashProgress = Number(progress.toFixed(2));
          if (hash) {
            resolve(hash);
          }
        };
      });
    },
    /** requestIdleCallback计算md5值 */
    async calculateHashIdle() {
      const chunks = this.chunks;
      return new Promise((resolve) => {
        const spark = new sparkMD5.ArrayBuffer();
        let count = 0;

        const appendToSpark = async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = (e) => {
              spark.append(e.target.result);
              resolve();
            };
          });
        };
        const workLoop = async (deadline) => {
          // timeRemaining获取当前帧的剩余时间
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            // 空闲时间，且有任务
            await appendToSpark(chunks[count].file);
            count++;
            if (count < chunks.length) {
              this.hashProgress = Number(
                ((100 * count) / chunks.length).toFixed(2)
              );
            } else {
              this.hashProgress = 100;
              resolve(spark.end());
            }
          }
          window.requestIdleCallback(workLoop);
        };
        // 浏览器一旦空闲，就会调用workLoop
        window.requestIdleCallback(workLoop);
      });
    },

    /** 抽样hash计算 */
    async calculateHashSample() {
      return new Promise((resolve) => {
        const spark = new sparkMD5.ArrayBuffer();
        const reader = new FileReader();
        const file = this.file;
        const size = file.size;
        const offset = 2 * 1024 * 1024;
        let chunks = [file.slice(0, offset)];
        let cur = offset;
        while (cur < size) {
          if (cur + offset >= size) {
            chunks.push(file.slice(cur, cur + offset));
          } else {
            const mid = cur + offset / 2;
            const end = cur + offset;
            chunks.push(file.slice(cur, cur + 2));
            chunks.push(file.slice(mid, mid + 2));
            chunks.push(file.slice(end - 2, end));
          }
          cur += offset;
        }
        reader.readAsArrayBuffer(new Blob(chunks));
        reader.onload = (e) => {
          spark.append(e.target.result);
          this.hashProgress = 100;
          resolve(spark.end());
        };
      });
    },
    createFileChunk(file, size = CHUNK_SIZE) {
      const chunks = [];
      let cur = 0;
      while (cur < this.file.size) {
        chunks.push({ index: cur, file: this.file.slice(cur, cur + size) });
        cur += size;
      }
      return chunks;
    },

    /** 上传文件 */
    async uploadFile() {
      if (!this.file) {
        return;
      }
      // if (!(await this.isImage(this.file))) {
      //   return alert("文件格式错误!");
      // }

      const chunks = this.createFileChunk(this.file);
      // console.log(chunks);
      // const hash = await this.calculateHashWorker();
      // const hash1 = await this.calculateHashIdle();
      const hash2 = await this.calculateHashSample();
      this.hash = hash2;
      // console.log("hash==" + hash);
      // console.log("hash1==" + hash1);
      // console.log("hash2==" + hash2);

      //根据hash判断文件是否上传过
      const {
        data: { info },
      } = await this.$http.post("/checkfile", {
        ext: this.file.name.split(".").pop(),
        hash: this.hash,
      });
      const { uploaded, uploadedList } = info;
      if (uploaded) {
        this.$message.success("秒传成功");
      }
      this.chunks = chunks.map((chunk, index) => {
        const name = hash2 + "-" + index;
        return {
          hash: hash2,
          name,
          chunk: chunk.file,
          index,
          error: 0,
          // 设置进度条，已经上传的，设为100
          progress: uploadedList.indexOf(name) > -1 ? 100 : 0,
        };
      });
      await this.uploadChunks(uploadedList);
    },
    /** 切片上传 */
    async uploadChunks() {
      const requests = this.chunks
        .filter((chunk) => chunk.progress == 0)
        .map((chunkInfo, index) => {
          const form = new FormData();

          form.append("name", chunkInfo.name);
          form.append("chunk", chunkInfo.chunk);
          form.append("hash", chunkInfo.hash);
          // form.append("index", chunkInfo.index);
          return {
            form,
            index: chunkInfo.index,
          };
        });
      // .map(({ form, index }) =>
      //   this.$http.post("/uploadfile", form, {
      //     onUploadProgress: (progress) => {
      //       this.chunks[index].progress = Number(
      //         ((progress.loaded / progress.total) * 100).toFixed(2)
      //       );
      //     },
      //   })
      // );
      await this.sendRequest(requests);
      // await Promise.all(requests);
      await this.mergeRequest();
      // const form = new FormData();
      // form.append("name", "file");
      // form.append("file", this.file);
      // const { data } = this.$http.post("/uploadfile", form, {
      //   onUploadProgress: (progress) => {
      //     this.uploadProgress = Number(
      //       ((progress.loaded / progress.total) * 100).toFixed(2)
      //     );
      //   },
      // });
    },
    /** 合并文件 */
    async mergeRequest() {
      const { data } = await this.$http.post("/mergefile", {
        ext: this.file.name.split(".").pop(),
        size: CHUNK_SIZE,
        hash: this.hash,
      });
      // const url = data.info.url;
      // await this.$http.put("/user/info", { url: "/api" + url });
    },
    /** 并发量控制 */
    async sendRequest(chunks, limit = 4) {
      return new Promise((resolve, reject) => {
        const len = chunks.length;
        let counter = 0;
        let isStop = false;
        const start = async () => {
          if (isStop) {
            return;
          }
          const task = chunks.shift();
          if (task) {
            const { form, index } = task;
            try {
              await this.$http.post("/uploadfile", form, {
                onUploadProgress: (progress) => {
                  // 不是整体的进度条了，而是每个区块有自己的进度条，整体的进度条需要计算
                  this.chunks[index].progress = Number(
                    ((progress.loaded / progress.total) * 100).toFixed(2)
                  );
                },
              });
              if (counter == len - 1) {
                // 最后一个任务
                resolve();
              } else {
                counter++;
                // 启动下一个任务
                start();
              }
            } catch (e) {
              this.chunks[index].progress = -1;
              if (task.error < 3) {
                task.error++;
                chunks.unshift(task);
                start();
              } else {
                // 错误三次
                isStop = true;
                reject();
              }
            }
          }
        };
        while (limit > 0) {
          setTimeout(() => {
            start();
          }, Math.random() * 2000);
          limit -= 1;
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
#drag {
  height: 100px;
  line-height: 100px;
  border: 2px dashed #eee;
  text-align: center;
  margin-bottom: 20px;
}
.btnWrap {
  width: max-content;
  margin: 0 auto;
}
.cube-container {
  .cube {
    width: 14px;
    height: 14px;
    line-height: 12px;
    border: 1px black solid;
    background: #eee;
    float: left;
    .success {
      background: green;
    }
    .uploading {
      background: blue;
    }
    .error {
      background: red;
    }
  }
}
</style>
