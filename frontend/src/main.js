import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notification'
import './style.css'

const initializeApp = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const authStore = useAuthStore()
  try {
    await authStore.initializeAuth()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }
  
  app.mount('#app')

  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err)
  }
}

initializeApp().catch(console.error)
