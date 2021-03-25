<template>
  <div id="app" :style="{ 'padding-top': `${headerHeight}px` }">
    
    <Header/>

    <div class="__content_container w-100">
      <b-container class="pt-3" loading-container >       
        <b-row class="__content_row">
          

          <b-col md="12" lg="8" class="__content_col">
            <PrizePercentage/>                    
          </b-col>  
          <b-col md="12" lg="4" class="__content_col">
            <GamepagTmypTmyw/>                    
          </b-col>  
          <b-col md="12" lg="8" class="__content_col">
            <GamesList/>                    
          </b-col>  
          <b-col md="12" lg="4" class="__content_col">
            <PlatformStats/>  
          </b-col>     
          <b-col  md="12" lg="6" class="__content_col">
            <transition name="fade" mode="out-in">
              <router-view></router-view>
            </transition>
          </b-col>   
          <b-col  md="12" lg="6" class="__content_col">
            <MyStats/>  
          </b-col> 
          <b-col md="12" lg="6" class="__content_col">
            <Staking/>  
          </b-col>
          <b-col md="12" lg="6" class="__content_col">
            <Stats/>  
          </b-col>
          <b-col md="12" lg="6" class="__content_col">
            <Governance/>  
          </b-col>
          <b-col md="12" lg="6" class="__content_col">
            <GovernanceStats/>  
          </b-col>
        </b-row>
      </b-container>
      
      <div class="__blocked_content" v-if="!blockchain.chainId"></div>
      
      <Footer/>    
    </div>   
    <BreakPoint/>
  </div>
</template>

<style lang="scss">   
  .__content_container {
    position: relative;
    .__content_row {        
      .__content_col{
        margin-bottom: 2rem;
      }
    }
    .__blocked_content{
      position: absolute;    
      top: 0;
      right: 0;  
      width: 100%;
      height: 100%;
      background-color: #FFF;
      opacity: .8;
    }    
  }
  // --------------
    .fade-enter-active,
    .fade-leave-active {
      transition-duration: 0.1s;
      transition-property: opacity;
      transition-timing-function: ease;
    }
    .fade-enter,
    .fade-leave-active {
      opacity: 0
    }
</style>

<script>
  import Header from '@/components/Header.vue';
    
  import Footer from '@/components/Footer.vue';
  import BreakPoint from '@/components/BreakPoint.vue';
  
  import PrizePercentage from '@/components/PrizePercentage.vue';
  import GamepagTmypTmyw from '@/components/GamepagTmypTmyw.vue';
  import PlatformStats from '@/components/PlatformStats.vue';
  import GamesList from '@/components/GamesList.vue';
  import MyStats from '@/components/MyStats.vue';
  import Staking from '@/components/Staking.vue';
  import Stats from '@/components/Stats.vue';
  import Governance from '@/components/Governance.vue';
  import GovernanceStats from '@/components/GovernanceStats.vue';

  import MetaMaskManager from '@/managers/metamaskManager.js';
 
  export default {
    name: 'App',
    components: {
      Header,       
      PrizePercentage,
      GamepagTmypTmyw,
      PlatformStats,
      GamesList,
      MyStats,
      Staking,
      Stats,
      Footer,
      BreakPoint,
      Governance,
      GovernanceStats
    },
    methods: {
      load: async function () {        
        console.log('page is fully loaded');

        if (!MetaMaskManager.isEthereum()) {
          this.$store.dispatch('blockchain/SET_CHAIN_ID', null)   
          return;
        }

        const accountAddress = await MetaMaskManager.getAccount()
        if (!accountAddress.length) {
          this.$store.dispatch('blockchain/SET_CHAIN_ID', null)  
          this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', null)  
          return;
        } 

        if (!MetaMaskManager.isChainIDValid(window.ethereum.chainId)) {
          this.$store.dispatch('blockchain/SET_CHAIN_ID', null)   
          return;
        }

        if (!MetaMaskManager.init(window.ethereum.chainId)) {
          this.$store.dispatch('blockchain/SET_CHAIN_ID', null)   
          return;
        }
        
        this.$store.dispatch('blockchain/SET_CHAIN_ID', window.ethereum.chainId) 
        this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', accountAddress) 
      },

      chainChanged: async function (chainId) {
         
        console.log('chainChanged: ', chainId);
        this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', null) 

        if (!MetaMaskManager.isChainIDValid(chainId)) {
          MetaMaskManager.deinit();
          this.$store.dispatch('blockchain/SET_CHAIN_ID', null)   
          return;
        }

        if (!MetaMaskManager.init(chainId)) {
          this.$store.dispatch('blockchain/SET_CHAIN_ID', null)   
          return;
        }
        
        this.$store.dispatch('blockchain/SET_CHAIN_ID', chainId)   
        const accountAddress = await MetaMaskManager.getAccount() 
        this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', accountAddress) 
        
      },
      
      accountsChanged: async function (accounts) {
        console.log('accountsChanged: ', accounts);

        if (accounts.length == 0) {
          this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', null)    
          MetaMaskManager.deinit();
          return;
        }

        if (!MetaMaskManager.isChainIDValid(window.ethereum.chainId)) {
          this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', null)          
          MetaMaskManager.deinit();
          return;
        }

        if (!MetaMaskManager.init(window.ethereum.chainId)) {
          this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', null)       
          return;
        }

        this.$store.dispatch('user/SET_ACCOUNT_ADDRESS', accounts[0])  
      },
      
  
    },

    created() {
      if (window.ethereum) {
        window.addEventListener('load', this.load)   
        window.ethereum.on('chainChanged', this.chainChanged)    
        window.ethereum.on('accountsChanged', this.accountsChanged)     
      }  
    }, 
  }
</script>