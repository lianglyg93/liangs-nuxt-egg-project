<template>
  <div class="login-container">
    <el-form
      class="login-form"
      label-width="100px"
      :model="form"
      :rules="rules"
      ref="registerForm"
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

      <el-form-item prop="nickname" label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称"></el-input>
      </el-form-item>

      <el-form-item prop="passwd" label="密码">
        <el-input
          type="password"
          v-model="form.passwd"
          placeholder="请输入密码"
        ></el-input>
      </el-form-item>

      <el-form-item prop="repasswd" label="确认密码">
        <el-input
          type="password"
          v-model="form.repasswd"
          placeholder="请再次输入密码"
        ></el-input>
      </el-form-item>

      <el-form-item>
        <!-- <button @click.prevent></button> -->
        <el-button type="primary" @click.native.prevent="handleRegister"
          >注册</el-button
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
      form: {
        email: "",
        nickname: "",
        passwd: "",
        repasswd: "",
        captcha: "",
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
        nickname: [
          {
            required: true,
            message: "请输入昵称",
          },
        ],
        passwd: [
          {
            required: true,
            message: "请输入6~12位密码",
            pattern: /^[\w_-]{6,12}$/g,
          },
        ],
        repasswd: [
          {
            required: true,
            message: "请输入确认密码",
          },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.passwd) {
                callback(new Error("两次密码不一致"));
              } else {
                callback();
              }
            },
          },
        ],
      },
      code: {
        captcha: "/api/captcha?_t=" + Math.random(),
      },
    };
  },
  methods: {
    resetCaptcha() {
      this.code.captcha = "/api/captcha?_t=" + Math.random();
    },
    handleRegister() {
      this.$refs.registerForm.validate(async (valid) => {
        if (valid) {
          const { repasswd, ...registerInfo } = this.form;
          //验证成功，进行注册
          const { data } = await this.$http.post("/user/register", {
            ...registerInfo,
            passwd: md5(registerInfo.passwd),
          });
          console.log(data)
          if (data.commonRes && data.commonRes.isOk) {
            this.$confirm("注册成功，是否登录?", "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            })
              .then(() => {
                this.$router.push('/login')
              })
              .catch(() => {
              });
          } else {
            this.$message.error(
              (data.commonRes && data.commonRes.message) || "注册失败"
            );
          }
        }
      });
    },
  },
};
</script>
<style scoped>
</style>