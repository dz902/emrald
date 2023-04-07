import { createApp } from 'vue'
import router from './router'
import store from './store'
import Main from './Main.vue'

const main = createApp(Main)

main.use(router)
main.use(store)

main.mount('#mount-point')
