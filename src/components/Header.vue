<template>

  <header ref="header">    
    <nav class="navbar navbar-light bg-light">
      <b-container :class="{'px-0': gBreakPoint('sm', 'lt')}">
        <b-row no-gutters class="w-100">
          <b-col class=" d-flex justify-content-between">
            <!-- logo -->
            <div class="d-flex align-items-center">
              <a class="align-self-center" href="/">
                <img src="/img/logo.svg" :height="gBreakPoint('sm', 'gte') ? 80 : 50" alt="Logo">
              </a>              
            </div>
            
            <!-- contact us -->
            <!-- TODO :  click methods -->
            <div class="d-flex align-items-center" v-if="gBreakPoint('lg', 'gte')">
              <div class="__strong-text mr-2">
                {{ $t('contact_us') }}
              </div>              
              <div class="__img_button">
                <img src="/img/telegram.svg" height="40" width="40" alt="Telegram logo" class="__shadow_filter" @click="gOpenTelegram()">
              </div>                         
            </div>

            <!-- choose crypto -->            
            <div class="d-flex align-items-center">
              <div class="__strong-text mr-2" v-if="gBreakPoint('md', 'gte')">
                {{ $t('choose_crypto') }}
              </div>
              <div class="__currency_select_block d-flex align-items-center">
                <div v-for="network in gBlockchain.networks" :key="'network_select_' + network.id"
                  class="d-flex flex-column justify-content-center align-items-center mr-3  " 
                  :class="{'__selected' : gNetwork.id === network.id, '__img_button' : gNetwork.id !== network.id }"
                  @click="selectNetwork(network)" 
                  >
                  <img :src="network.icon" height="40" width="40" :alt="network.id">
                  <div class="mt-1" v-if="gBreakPoint('sm', 'gte')">{{network.name}}</div>
                </div> 
              </div>
            </div>
            
            <UserProfileMenu/>
              
          </b-col>
        </b-row>        
      </b-container>  
    </nav>
    <Notification/>
  </header>  
</template>

<style lang="scss" scoped>  
  @import '@/assets/css/variables.scss';
  header{
    position: fixed;
    top: 0;
    z-index: 1000;
    width: 100%;
    .navbar{
      border-bottom: 1px solid #e0e0e0;
      .__strong-text{
        font-weight: 700;
        font-size: 1.15rem;      
      }
      .__currency_select_block {
        .__img_button {
          filter: opacity(60%) saturate(0%);
          &.__selected, &:hover {
            filter: opacity(100%) saturate(100%);
          }          
        }
      }      
    }    
  }
</style>

<script>
  import UserProfileMenu from '@/components/UserProfileMenu.vue';
  import Notification from '@/components/Notification.vue';
  //import LocaleChange from '@/components/LocaleChange.vue';

  export default {
    name: 'Header',
    components: {
      UserProfileMenu,
      Notification,
      //LocaleChange,
    },
    data: () => ({      
    }),    
    mounted () {
      //setInterval(() => { this.detectHeight() }, 100)
      setTimeout(() => { this.detectHeight() }, 10)
      window.addEventListener("resize", this.detectHeight);
    },
    beforeDestroy () {      
      window.removeEventListener("resize", this.detectHeight);
    },  
    computed: {        
      
    },
    methods: {      
      detectHeight: function () { 
        if (this.$refs?.header?.clientHeight) {
          this.$store.dispatch('UI_HEADER_HEIGHT_SET', this.$refs.header.clientHeight) 
        }
      },
      selectNetwork(network) {
        this.$log.debug(network.id)

        if (network.id === "ETH") { //  && currentNetwork !== "ETH"
          this.$store.dispatch('notification/OPEN', {
            id: 'ERROR',
            data: `Please select Ethereum Mainnet in MetaMask`,
            //delay: 5
          }, {
            root: true
          })
        } else if (network.id === "BSC") { //  && currentNetwork !== "BSC"
          this.$store.dispatch('notification/OPEN', {
            id: 'ERROR',
            data: `Please select Binance Smart Chain in MetaMask`,
            //delay: 5
          }, {
            root: true
          })
        }
        //<!-- TODO : click on inactive network notification -->
      }
    },
    i18n: {
      messages: {
        en: {
          contact_us: 'Contact us:',
          choose_crypto: 'Choose crypto:',
        },          
      }      
    }
  }  
</script>

