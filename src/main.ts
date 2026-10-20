import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// Element Plus 深色模式变量（在 style.css 中再覆盖为我们的色系）
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'

// 启用 Element Plus 深色模式
document.documentElement.classList.add('dark')

createApp(App).use(router).use(createPinia())
.mount('#app')
// aaaa