import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useNotificationStore } from './stores/notification'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store
const authStore = useAuthStore()
await authStore.initializeAuth()

app.mount('#app')

app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err)
    console.error('Error Info:', info)
    const notificationStore = useNotificationStore(pinia)
    notificationStore.error('An error occurred. Please try again.')
}
