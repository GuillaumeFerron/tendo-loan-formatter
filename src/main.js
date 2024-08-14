import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import 'floating-vue/dist/style.css'

import { createApp } from 'vue'
import FloatingVue from 'floating-vue'
import App from './App.vue'

const app = createApp(App)

app.use(FloatingVue)

app.mount('#app')