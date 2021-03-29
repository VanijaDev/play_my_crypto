<template> 
  <!-- TODO :  all , ! network url -->
  <div class="__notification" v-if="notification.show">
    <b-container>
      <div v-if="notification.id === 'METAMASK_CONNECT_ERROR'">
        {{ $t('mm_connect_error') }}         
      </div>
      <div v-if="notification.id === 'METAMASK_ERROR'">
        {{ $t('mm_connect_error') }}         
      </div>
      <div v-if="notification.id === 'PENDING_TRANSACTION' || notification.id === 'MINED_TRANSACTION' || notification.id === 'TRANSACTION_ERROR'" class="__pm_transaction text-wrap">
        <span class="mr-2">{{ $t('transaction') }}</span>
        <a :href="`https://ropsten.etherscan.io/tx/${notification.data.tx}`" target="_blank" class="text-break">{{ notification.data.tx }}</a> 
        <span class="ml-2" v-if="notification.id === 'PENDING_TRANSACTION'">{{ $t('mining') }}</span>   
        <span class="ml-2" v-if="notification.id === 'MINED_TRANSACTION'">{{ $t('mined') }}</span>
        <span class="ml-2" v-if="notification.id === 'TRANSACTION_ERROR'">{{ $t('error') }}</span>       
      </div>
     
      
      <button type="button" aria-label="Close" v-if="closeable" @click="closeNotification()" class="__close">×</button>
              
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
    position: relative;
    .__pm_transaction{      
      a{
        font-weight: 600;
        color: white !important;
        text-decoration: underline;
      }
    }
    .__close {
      float: right;
      font-size: 1.6rem;
      font-weight: 600;
      line-height: 1;
      color: white;
      position: absolute;
      right: 0;
      background-color: transparent;
      border: 0;
      top: 0.25rem;
    }
  }
</style>

<script>
  export default {
    name: 'Notification',    
    data: () => ({       
    }),    
    mounted() {
      this.$eventBus.$on('notification::open', this.openNotification)
      this.$eventBus.$on('notification::close', this.closeNotification)
    },
    beforeDestroy () {      
      this.$eventBus.$off('notification::open') 
      this.$eventBus.$off('notification::close')    
    },
    computed: {      
      notification() { return this.$store.getters['notification/notification'] },  
      closeable() { 
        return this.notification.closeable 
          || this.notification.id === 'MINED_TRANSACTION'
          || this.notification.id === 'TRANSACTION_ERROR'
      }    
    },
    methods: {
      openNotification ({ id, type, closable, delay, data }) {
        this.$store.dispatch('notification/OPEN', { id, type, closable, delay, data } )        
      },
      closeNotification () {
        this.$store.dispatch('notification/CLOSE') 
      },
    },
    i18n: {
      messages: {
        en: {
          mm_connect_error: 'Please connect MetaMask to use PlayMyCrypto platform',
          transaction: 'Transaction',
          mining: 'mining...',
          mined: 'mined!',
          error: 'ERROR !',
             
        },          
      }      
    } 

  }
</script>

