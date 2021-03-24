import Vue from 'vue'
import App from './App.vue'
import router from "./router";
import store from "./store";
import './assets/css/app.scss'

import { LayoutPlugin } from 'bootstrap-vue'
Vue.use(LayoutPlugin)
import { TooltipPlugin } from 'bootstrap-vue'
Vue.use(TooltipPlugin)
import { DropdownPlugin } from 'bootstrap-vue'
Vue.use(DropdownPlugin)
import { ModalPlugin } from 'bootstrap-vue'
Vue.use(ModalPlugin)
import { CollapsePlugin } from 'bootstrap-vue'
Vue.use(CollapsePlugin)

import VueI18n from 'vue-i18n'
Vue.use(VueI18n)
const i18n = new VueI18n({ locale: 'en', fallbackLocale: 'en', silentTranslationWarn: true })

import globalMixins from "@/utils/globalMixins";
Vue.mixin(globalMixins)

Vue.config.productionTip = false

Vue.prototype.$eventBus = new Vue(); // Global event bus

new Vue({
  router,
  store,
  i18n,
  render: h => h(App),
}).$mount('#app')
