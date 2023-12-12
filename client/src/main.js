import router from './router';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
//import 'tailwindcss/tailwind.css';
import './styles.css'
import './index.css'
import App from './App.vue'




const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.mount('#app')
