<template>
  <div class="locale-changer">
    <select v-model="$i18n.locale" @change="setLocale()">
      <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang">
        {{ lang }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'LocaleChange',  
  data: () => ({  
    langs: ['en', 'ch']    
  }),
  mounted () {  
    let locale = localStorage.getItem('PMC_LOCALE')
    if (!locale) {
      if (navigator.languages != undefined) {
        try {
          locale = navigator.languages[0].split('-')[0].toLowerCase()
        } catch (error) { 
          locale = 'en'         
        }        
        this.$log.debug('navigator', locale)
      } else {
        locale = 'en'
      }
    }
    this.$log.debug(locale)
    if (!locale || !this.langs.find(l=>locale === l)) {
      locale = 'en'
    }

    this.$i18n.locale = locale 
    localStorage.setItem('PMC_LOCALE', this.$i18n.locale)
    
  },

  methods: {
    setLocale() {
      localStorage.setItem('PMC_LOCALE', this.$i18n.locale)
    },    
  }
}
</script>