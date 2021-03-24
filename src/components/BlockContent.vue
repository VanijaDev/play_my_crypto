<template> 
  <div class="__block_content">    
  </div>       
</template>

<style lang="scss" scoped>  
  @import '@/assets/css/variables.scss';
  .__block_content{
    background: white;
    opacity: .8;
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
    z-index: 999;
    
  }
</style>

<script>
  export default {
    name: 'Notification',
    data () {      
      return {  
        show: false,      
      };
    },  
  }
</script>

