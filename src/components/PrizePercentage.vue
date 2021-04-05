<template>
  <!-- TODO : data origin -->  
  <div class="__content-block __cb_blue h-100 p-4">
    <b-row class="h-100">
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage">
          <span id="percent_1">95%</span>
          <span v-html="$t('p1')"></span>  
          <b-tooltip target="percent_1" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>                
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage">
          <span id="percent_2">1%</span>
          <span v-html="$t('p2')"></span>
          <b-tooltip target="percent_2" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2 mt-sm-0">
          <span id="percent_3">1%</span>
          <span v-html="$t('p3')"></span>
          <b-tooltip target="percent_3" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
    
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2">
          <span id="percent_4">1%</span>
          <span v-html="$t('p4')"></span>
          <b-tooltip target="percent_4" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2">
          <span id="percent_5">1%</span>
          <span v-html="$t('p5')"></span>
          <b-tooltip target="percent_5" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
      <!-- *** -->
      <b-col cols="6" sm="4">
        <div class="__prize-percentage mt-2">
          <span id="percent_6">100%</span>
          <span v-html="$t('p6')"></span>
          <b-tooltip target="percent_6" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
        </div>  
      </b-col>
    </b-row>
  </div>
</template>

<script>
  export default {
    name: 'PrizePercentage',
    i18n: {
      messages: {
        en: {
          p1: 'of prize goes <br> to winner',
          p2: 'of prize goes to <br> winner`s referral address',
          p3: 'of prize goes <br> to raffle',          
          p4: 'of prize goes to <br>our partner project',
          p5: 'of prize goes to <br>staking pool',
          p6: 'of fair P2P <br> (player-to-player) gaming',            
        },          
      }      
    }  
  }
</script>

<style lang="scss" scoped>  
  .__prize-percentage{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
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