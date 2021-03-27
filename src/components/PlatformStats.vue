<template>
  <div class="__content-block __cb_white h-100">
    <b-row>      
      <b-col md="6" lg="12" class="">
        <h3>Platform stats</h3>
        <!-- Jackpots won -->
        <div class="__text_line">
          <span>Jackpots won:</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="p_stat_1">???????</span>
            <b-tooltip target="p_stat_1" custom-class="__tooltip" >0.123456789012345678</b-tooltip>  
          </div>              
        </div>
        <!-- Total in -->
        <div class="__text_line">
          <span>Total in:</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="p_stat_2">???????</span>  
            <b-tooltip target="p_stat_2" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
          </div>              
        </div>
      </b-col>
      <b-col md="6" lg="12" class="mt-3 mt-sm-3 mt-md-0 mt-lg-3">
        <h3>Ongoing raffles</h3>
        <!-- Jackpots -->
        <div class="__text_line">
          <span>Jackpots:</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="p_stat_3">???????</span>  
            <b-tooltip target="p_stat_3" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
          </div>              
        </div>
        <!-- Participants -->
        <div class="__text_line">
          <span>Participants:</span>
          <span class="text-monospace">{{currentGame.participants}}</span>              
        </div>              
      
      </b-col>
    </b-row>
  </div>
</template>

<script>
  export default {
    name: 'PlatformStats',  
  }
</script>

<style lang="scss" scoped>  
  
</style>