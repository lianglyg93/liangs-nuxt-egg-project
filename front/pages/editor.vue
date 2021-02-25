<template>
  <div>
    <div class="write-btn">
      <el-button @click="submit" type="primary">提交</el-button>
    </div>
    <el-row>
      <el-col :span="12">
        <!-- markdown编辑器的基本操作 -->
        <textarea
          ref="editor"
          class="md-editor"
          :value="content"
          @input="update"
        ></textarea>
      </el-col>
      <el-col :span="12">
        <div class="markdown-body" v-html="compiledContent"></div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import marked from "marked";
import hljs from "highlight.js";

import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/monokai-sublime.css";
export default {
  data() {
    return {
      content: `# 梁s
* 上课
* 吃饭
* 写代码

\`\`\`javascript
  
  let a = 11;
  console.log(a)
\`\`\`
      `,
    };
  },
  mounted() {
    this.timer = null;
    this.bindEvent();
    marked.setOptions({
      rendered: new marked.Renderer(),
      highlight(code) {
        return hljs.highlightAuto(code).value;
      },
      // ..
    });
  },
  computed: {
    compiledContent() {
      return marked(this.content, {});
    },
  },
  methods: {
    bindEvent() {
      const editor = this.$refs.editor;
      editor.addEventListener("paste", (e) => {
        console.log(e.clipboardData.files);
      });

      editor.addEventListener("drop", (e) => {
        console.log(e.dataTransfer.files);
        e.preventDefault();
      });
    },
    update(e) {
      clearInterval(this.timer);
      this.timer = setTimeout(() => {
        this.content = e.target.value;
      }, 350);
    },
    submit() {
      let { data } = this.$http.post("/article/create", {
        content: this.content,
        compiledContent: this.compiledContent,
      });
    },
  },
};
</script>

<style>
.md-editor {
  width: 100%;
  height: 100vh;
  outline: none;
}
.markdown-body {
  padding-left: 20px;
}
.write-btn {
  position: fixed;
  z-index: 100;
  right: 30px;
  top: 10px;
}
</style>