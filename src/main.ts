import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/main.css'

import App from './App.vue'
import { setUnauthorizedHandler } from './api/request'
import { installPermissionDirective } from './features/auth/directives/permission'
import { useAuthStore } from './features/auth/store'
import router from './router'
import { pinia } from './stores/pinia'

const app = createApp(App)
const authStore = useAuthStore(pinia)

document.title = import.meta.env.VITE_APP_TITLE

setUnauthorizedHandler(() => {
  authStore.logout()

  if (router.currentRoute.value.name !== 'login') {
    void router.replace({
      name: 'login',
      query: {
        redirect: router.currentRoute.value.fullPath,
      },
    })
  }
})

app.use(ElementPlus)
app.use(pinia)
app.use(router)
installPermissionDirective(app)

await authStore.hydrateSession()

app.mount('#app')
