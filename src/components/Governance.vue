<template>
  <div class="__content-block __cb_white h-100 d-flex flex-column justify-content-center align-items-center __cb_inactive">
    <div>
      <h2>{{ $t('governance') }}</h2>
      <p class="text-center mt-4">{{ $t('coming_soon') }}</p>      
    </div>
   
  </div> 
</template>

<script>  
  export default {
    name: 'Governance',  
    i18n: {
      messages: {
        en: {
          governance: 'Governance',
          coming_soon: 'Coming soon...',          
        },          
      }      
    }  
  }
</script>

<style lang="scss" scoped>  
  
</style>