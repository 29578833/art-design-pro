import App from './App.vue'
import { createApp } from 'vue'
import { initStore } from './store'                 // Store
import { initRouter } from './router'               // Router
import language from './locales'                    // 国际化
import '@styles/core/tailwind.css'                  // tailwind
import '@styles/index.scss'                         // 样式           // 控制台输出内容
import { setupGlobDirectives } from './directives'
import { setupErrorHandle } from './utils/sys/error-handle'

import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'

document.addEventListener(
  'touchstart',
  function () { },
  { passive: false }
)

const app = createApp(App)
initStore(app)
initRouter(app)
setupGlobDirectives(app)
setupErrorHandle(app)

app.use(language)
app.use(VxeUITable)
app.mount('#app')