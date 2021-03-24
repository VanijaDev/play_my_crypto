<template>
  <div class="__content-block __cb_white h-100 d-flex flex-column justify-content-between">
    <div>
      <h3>Stats</h3>
      <!-- Total staken -->
      <div class="__text_line">
        <span>Total staken:</span>
        <div class="__img_value_block">
          <img src="/img/logo.svg" height="30"  width="30" alt="ETH">
          <span id="stats_1">3.12345</span>
          <b-tooltip target="stats_1" custom-class="__tooltip" >0.123456789012345678</b-tooltip>  
        </div>              
      </div>
      <!-- Your stake -->
      <div class="__text_line">
        <span>Your stake:</span>
        <span>(0.31%)</span>
        <div class="__img_value_block">
          <img src="/img/logo.svg" height="30"  width="30" alt="ETH">
          <span id="stats_2">3.12345</span>
          <b-tooltip target="stats_2" custom-class="__tooltip" >0.123456789012345678</b-tooltip>  
        </div> 
        <button type="button" class="btn btn-primary __blue_button ml-2">Unstake</button>        
      </div>
    </div>
    
    <!-- Info -->
    <div class="__text_line mt-2">
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('how-to-stake-modal::open')">How to stake?</a>
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('game-faq-stats-modal::open')">Game FAQ</a>
    </div>

    <HowToStakeModal/>
    <GameFAQStatsModal/>
  </div> 
</template>

<script>  
  import HowToStakeModal from '@/components/modals/HowToStakeModal.vue';
  import GameFAQStatsModal from '@/components/modals/GameFAQStatsModal.vue';
  export default {
    name: 'Stats', 
    components: {
      HowToStakeModal, 
      GameFAQStatsModal
    }, 
  }
</script>

<style lang="scss" scoped>  
  
</style>