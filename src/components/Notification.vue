<template> 
  <div class="__notification" v-if="!blockchain.chainId">
    <b-container>
      Please connect MetaMask to use PlayMyCrypto platform        
    </b-container>  
  </div>       
</template>

<style lang="scss" scoped>  
  @import '@/assets/css/variables.scss';
  .__notification{
    background: #F2994A;
    color: white;
    padding: .5rem;    
    font-size: 1rem;
    text-align: center;
  }
</style>

<script>
  export default {
    name: 'Notification',
    data () {      
      return {  
        show: 0,      
      };
    }, 

  }
</script>

