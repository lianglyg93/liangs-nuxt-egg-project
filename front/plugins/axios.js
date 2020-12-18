import Vue from "vue";
import axios from "axios";
import { Loading } from "element-ui";
import { MessageBox } from 'element-ui';

let loadingInstance = null;
const service = axios.create({
  baseURL: "/api",
  timeout: 5000,
});
export default ({ store, redirect }) => {
  //请求拦截
  service.interceptors.request.use(
    (config) => {
      loadingInstance = Loading.service({ fullscreen: true });
      // console.log(config);
      const getToken = localStorage.getItem("token");
      if (getToken) {
        config.headers["Authorization"] = "Bearer " + getToken;
      }
      return config;
    },
    (err) => {
      loadingInstance.close();
      console.log(err.request);

      return Promise.reject(err);
    }
  );

  //响应拦截
  service.interceptors.response.use(
    (response) => {
      loadingInstance.close();
      console.log(response);
      const { data, config } = response;
      const { commonRes } = data;
      if(commonRes && commonRes.code === 0){
        if(config.url ==='/user/login'){
          localStorage.setItem('token',data.info.token)
        }
      }
      if(commonRes && commonRes.code===-666){
        MessageBox.confirm('登录已过期','过期',{
          confirmButtonText: '登录',
          showCancelButton: false,
          type: 'warning'
        }).then(()=>{
          localStorage.removeItem('token')
          redirect({path:'/login'})
        })
      }
      if(commonRes && commonRes.code===-222){
        MessageBox.confirm('用户未登录','提示',{
          confirmButtonText: '登录',
          showCancelButton: false,
          type: 'warning'
        }).then(()=>{
          redirect({path:'/login'})
        })
      }
      return response;
    },
    (err) => {
      loadingInstance.close();
      // if (err.response) {
      //   // The request was made and the server responded with a status code
      //   // that falls out of the range of 2xx
      //   console.log(err.response.data);
      //   console.log(err.response.status);
      //   console.log(err.response.headers);
      // } else {
      //   // Something happened in setting up the request that triggered an err
      //   console.log('err', err.message);
      // }
      // console.log(err.config);
      return Promise.reject({
        data: {
          err,
          commonRes: {
            isOk: false,
            code: err.response && err.response.status,
            message: err.message,
          },
        },
      });
    }
  );
};
Vue.prototype.$http = service;

export const http = service;
