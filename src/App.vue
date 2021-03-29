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
      
      <div class="__blocked_content" v-if="!gNetwork.id"></div>
      
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
    data: () => ({ 
            
    }),
    computed: {
      headerHeight() { return this.$store.getters.uiHeaderHeight },
    },
    mounted() {
      let self = this
      setTimeout(function(){ window.addEventListener('load', function() { self.$store.dispatch('blockchain/ON_LOAD') } )}, 100)  
    },
    
    methods: {
    },

    
     
  }
</script>