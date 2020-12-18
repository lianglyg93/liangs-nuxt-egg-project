<template>
  <div>
    <h1>用户中心</h1>
    <div ref="drag" id="drag">
      <input type="file" name="file" @change="handleFileChange" />
    </div>
    <div class="btnWrap">
      <el-button @click="uploadFile">上传</el-button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      file: null,
    };
  },
  mounted() {
    // this.init();
    this.bindEvent();
  },
  methods: {
    // async init() {
    //   let { data } = await this.$http.get("/user/info");
    // },
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
        console.log(e.dataTransfer.files);
        e.preventDefault();
      });
    },
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
    },
    async uploadFile() {
      const form = new FormData();
      form.append("name", "file");
      form.append("file", this.file);
      const { data } = this.$http.post("/uploadfile", form);
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
</style>
