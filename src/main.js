import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initOrientationLock } from './lib/orientationLock.js'

initOrientationLock()

createApp(App).mount('#app')
