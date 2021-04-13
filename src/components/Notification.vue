<template> 
  <!-- TODO :  all , ! network url -->
  <div class="__notification" v-if="notification.show">
    <b-container>
      <div v-if="notification.id === 'ERROR'">
        {{notification.data}}
      </div>
      <div v-if="notification.id === 'METAMASK_CONNECT_ERROR'">
        {{ $t('mm_connect_error') }}
      </div>
      <div v-if="notification.id === 'METAMASK_ERROR'">
        {{ $t('mm_error') }}
      </div>      
      <div v-if="notification.id === 'TRANSACTION_PENDING' || notification.id === 'TRANSACTION_MINED' || notification.id === 'TRANSACTION_ERROR'">
        <span class="mr-2">{{ $t('transaction') }}</span>
        <a :href="explorerURL(notification.data.tx)" target="_blank" class="text-break">{{ notification.data.tx }}</a>
        <span class="ml-2" v-if="notification.id === 'TRANSACTION_PENDING'">{{ $t('mining') }}</span>
        <span class="ml-2" v-if="notification.id === 'TRANSACTION_MINED'">{{ $t('mined') }}</span>
        <span class="ml-2" v-if="notification.id === 'TRANSACTION_ERROR'">{{ $t('error') }}</span>
      </div>
     
      
      <button type="button" aria-label="Close" v-if="closeable" @click="closeNotification()" class="__close">×</button>
              
    </b-container>
  </div>
</template>

<style lang="scss" scoped>
  @import '@/assets/css/variables.scss';
  .__notification{
    background: $_orange;
    color: $_white;
    padding: .5rem;
    font-size: 1rem;
    text-align: center;
    position: relative;
    a{
      font-weight: 600;
      color: $_white !important;
      text-decoration: underline;
      &:hover {
        text-decoration: underline !important;
      }
    }    
    .__close {
      float: right;
      font-size: 1.6rem;
      font-weight: 600;
      line-height: 1;
      color: $_white;
      position: absolute;
      right: 0;
      background-color: transparent;
      border: 0;
      top: 0.2rem;
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
          || this.notification.id === 'TRANSACTION_MINED'
          || this.notification.id === 'TRANSACTION_ERROR'
          || this.notification.id === 'ERROR'
      }    
    },
    methods: {
      openNotification ({ id, type, closable, delay, data }) {
        this.$store.dispatch('notification/OPEN', { id, type, closable, delay, data } )        
      },
      closeNotification () {
        this.$store.dispatch('notification/CLOSE') 
      },
      explorerURL(tx) {        
        return  this.gNetwork.explorerBaseURL + tx;
      },
    },
    i18n: {
      messages: {
        en: {
          mm_error: 'MetaMask error',
          mm_connect_error: 'Please connect MetaMask and select supported network',
          transaction: 'Transaction',
          mining: 'is being mined...',
          mined: 'mining SUCCESS.',
          error: 'mining ERROR.',
        },
      }
    } 

  }
</script>

