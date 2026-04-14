import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router/index.js'
import { i18n } from './i18n/index.js'
import App from './App.vue'
import './styles/global.css'

// Eski service worker'larni o'chirish
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')

// Init auth after pinia
import { useAuthStore } from './stores/auth.js'
const auth = useAuthStore()
auth.init()
