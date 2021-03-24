<template>
  <div class="__content-block __cb_blue h-100 p-4">
    <b-row class="">
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage">
          <span id="percent_1">95%</span>
          <span>of prize goes <br>to winner</span>  
          <b-tooltip target="percent_1" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>                
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage">
          <span id="percent_2">1%</span>
          <span>of prize goes to <br>winner's referral address</span>
          <b-tooltip target="percent_2" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2 mt-sm-0">
          <span id="percent_3">1%</span>
          <span>of prize goes <br>to raffle</span>
          <b-tooltip target="percent_3" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
    
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2">
          <span id="percent_4">1%</span>
          <span>of prize goes to <br>our partner project</span>
          <b-tooltip target="percent_4" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2">
          <span id="percent_5">1%</span>
          <span>of prize goes to <br>staking pool</span>
          <b-tooltip target="percent_5" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2">
          <span id="percent_6">100%</span>
          <span>of fair P2P <br>(player-to-player) gaming</span>
          <b-tooltip target="percent_6" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
    </b-row>
  </div>
</template>

<script>
  export default {
    name: 'PrizePercentage',  
  }
</script>

<style lang="scss" scoped>  
  .__prize-percentage{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    
    span{
      text-align: center;
    }
    span:first-child{
      font-weight: 700;
      font-size: 1.5rem;
      line-height: 1.5rem;
      margin-bottom: .2rem;
    }
  }
</style>