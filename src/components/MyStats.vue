<template>
  <div class="__content-block __cb_white h-100">
    <b-row class="h-100">      
      <b-col xs="12" sm="6">
        <h3>My stats</h3>
        <!-- My in -->
        <div class="__text_line">
          <span>My in:</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_1">???????</span>
            <b-tooltip target="my_stat_1" custom-class="__tooltip" >0.123456789012345678</b-tooltip>  
          </div>              
        </div>
        <!-- My out -->
        <div class="__text_line">
          <span>My out:</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_2">???????</span>
            <b-tooltip target="my_stat_2" custom-class="__tooltip" >0.123456789012345678</b-tooltip>  
          </div>              
        </div>
      </b-col>
      <b-col xs="12" sm="6" class="mt-3 mt-sm-0">
        <h3>Ongoing raffle</h3>
        <!-- Jackpot -->
        <div class="__text_line">
          <span>Jackpot:</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_3">???????</span>
            <b-tooltip target="my_stat_3" custom-class="__tooltip" >0.123456789012345678</b-tooltip>  
          </div>              
        </div>
        <!-- Participants -->
        <div class="__text_line">
          <span>Participants:</span>
          <span class="text-monospace">{{currentGame.participants}}</span>                
        </div>
      </b-col>
      <b-col cols="12" class="mt-5">
        <h3>Pending withdrawal</h3>
        <!-- Gameplay -->
        <div class="__text_line mb-3">
          <span class="w-25">Gameplay:</span>
          
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_4">???????</span>
            <b-tooltip target="my_stat_4" custom-class="__tooltip" >???????</b-tooltip>  
          </div>

          <button type="button" class="btn btn-primary __blue_button ml-1">Withdraw</button> 

        </div>
        <!-- Gameplay -->
        <div class="__text_line mb-3">
          <span class="w-25">Gameplay:</span>          
          
          <div class="__img_value_block">
            <img src="/img/logo.svg" height="30"  width="30" alt="ETH">
            <span id="my_stat_7">???????</span>
            <b-tooltip target="my_stat_7" custom-class="__tooltip" >???????</b-tooltip>  
          </div>
          <button type="button" class="btn btn-primary __blue_button ml-1">Withdraw</button> 

        </div>
        <!-- Referral -->
        <div class="__text_line mb-3">
          <span class="w-25">Referral:</span>
          
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_5">{{user.pendingReferral | formatBalanceShort}}</span>
            <b-tooltip target="my_stat_5" custom-class="__tooltip" >{{user.pendingReferral | formatBalance}}</b-tooltip>  
          </div>
                     
          <button type="button" class="btn btn-primary __blue_button ml-1">Withdraw</button>  
        </div>
        <!-- Raffle -->
        <div class="__text_line mb-3">
          <span class="w-25">Raffle:</span>
          
            <div class="__img_value_block">
              <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
              <span id="my_stat_6">{{user.pendingRaffle | formatBalanceShort}}</span>
              <b-tooltip target="my_stat_6" custom-class="__tooltip" >{{user.pendingRaffle | formatBalance}}</b-tooltip>  
            </div>
          
          <button type="button" class="btn btn-primary __blue_button ml-1">Withdraw</button>  
        </div>

        <!-- Info -->
        <div class="__text_line mt-2">
          <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('how-to-play-modal::open')">How to play?</a>
          <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('game-faq-my-stats-modal::open')">Game FAQ</a>
        </div>  
        
      </b-col>
    </b-row>
    
    <HowToPlayModal/>
    <GameFAQMyStatsModal/>
  </div>
</template>

<style lang="scss" scoped>  
  //@import '@/assets/css/variables.scss';
</style>

<script>
  import HowToPlayModal from '@/components/modals/HowToPlayModal.vue';
  import GameFAQMyStatsModal from '@/components/modals/GameFAQMyStatsModal.vue';

  export default {
    name: 'MyStats',  
    components: { HowToPlayModal, GameFAQMyStatsModal }, 
  }
</script>

