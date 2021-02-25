<template>
  <div class="login-container">
    <el-form
      class="login-form"
      label-width="100px"
      :model="form"
      :rules="rules"
      ref="loginForm"
    >
      <div class="title-container">
        <img src="/logo.png" alt="" />
      </div>
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
      </el-form-item>

      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha">
          <img :src="code.captcha" @click="resetCaptcha" />
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
      </el-form-item>

      <el-form-item
        prop="emailCode"
        label="邮箱验证码"
        class="captcha-container"
      >
        <div class="captcha">
          <el-button type="primary" @click="sendemailCode">{{
            emailCodeText
          }}</el-button>
        </div>
        <el-input
          v-model="form.emailCode"
          placeholder="请输入邮箱验证码"
        ></el-input>
      </el-form-item>

      <el-form-item prop="passwd" label="密码">
        <el-input
          type="password"
          v-model="form.passwd"
          placeholder="请输入密码"
        ></el-input>
      </el-form-item>

      <el-form-item>
        <!-- <button @click.prevent></button> -->
        <el-button type="primary" @click.native.prevent="handleLogin"
          >登录</el-button
        >
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
import md5 from "md5";
export default {
  layout: "login",
  data() {
    return {
      codeTime: 0,
      form: {
        email: "",
        passwd: "",
        captcha: "",
        emailCode: "",
      },
      rules: {
        email: [
          {
            required: true,
            message: "请输入邮箱",
          },
          {
            type: "email",
            message: "请输入正确的邮箱地址",
          },
        ],
        captcha: [
          {
            required: true,
            message: "请输入验证码",
          },
        ],
        passwd: [
          {
            required: true,
            message: "请输入6~12位密码",
            pattern: /^[\w_-]{6,12}$/g,
          },
        ],
        emailCode: [
          {
            required: true,
            message: "请输入邮箱验证码",
          },
        ],
      },
      code: {
        captcha: "/api/captcha?_t=" + Math.random(),
      },
    };
  },
  computed: {
    emailCodeText() {
      if (this.codeTime <= 0) {
        return "发送";
      }
      return `剩余${this.codeTime}S`;
    },
  },
  methods: {
    resetCaptcha() {
      this.code.captcha = "/api/captcha?_t=" + Math.random();
    },
    /** 登录 */
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          //验证成功，进行登录
          const { data } = await this.$http.post("/user/login", {
            ...this.form,
            passwd: md5(this.form.passwd),
          });
          if (data.commonRes && data.commonRes.isOk) {
            localStorage.setItem('token',data.info.token)
            this.$router.push("/");
          } else {
            this.$message.error(
              (data.commonRes && data.commonRes.message) || "登录失败"
            );
          }
        }
      });
    },
    /** 发送验证码 */
    async sendemailCode() {
      if (this.codeTime <= 0) {
        this.codeTime = 60;
        await this.$http.get("/sendcode?email=" + this.form.email);
        this.timer = setInterval(() => {
          this.codeTime -= 1;
          if (this.codeTime === 0) {
            clearInterval(this.timer);
          }
        }, 1000);
      }
    },
  },
};
</script>
<style scoped>
</style>