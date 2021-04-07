<template>
  <div class="__content-block __cb_white h-100 d-flex flex-column justify-content-between">
    <div>
      <h3>{{ $t('stats') }}</h3>
      <!-- Total staken -->
      <div class="__text_line">
        <span class="__stats_col_1">{{ $t('total_staken') }}:</span>       
        <span class="__stats_col_2"></span>
        <div class="__img_value_block __stats_col_3">
          <img src="/img/logo.svg" height="25"  width="25" alt="ETH">
          <span id="stats_1">{{gUser.stakingData.tokensStaked | formatBalanceShort}}</span>
          <b-tooltip target="stats_1" custom-class="__tooltip" >{{gUser.stakingData.tokensStaked | formatBalance}}</b-tooltip>  
        </div>  
        <div class="ml-2 __stats_col_4"></div>         
                   
      </div>
      <!-- Your stake -->
      <div class="__text_line">
        <span class="__stats_col_1">{{ $t('your_stake') }}:</span>
        <!-- Percent -->
        <span class="__stats_col_2"><span v-if="gUser.stakingData.stakePercentShort >= 0">{{gUser.stakingData.stakePercentShort}}%</span></span>
        <div class="__img_value_block __stats_col_3">
          <img src="/img/logo.svg" height="25"  width="25" alt="ETH">
          <span id="stats_2">{{gUser.stakingData.stake | formatBalanceShort}}</span>
          <b-tooltip target="stats_2" custom-class="__tooltip" >{{gUser.stakingData.stake | formatBalance}}</b-tooltip>  
        </div> 
        <!-- Unstake -->
        <button type="button" class="btn btn-primary __blue_button ml-2 __stats_col_4" :disabled="unStakeDisabled">{{ $t('unstake') }}</button>        
      </div>
    </div>
    
    <!-- Info -->
    <div class="__text_line mt-2">
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('how-to-stake-modal::open')">{{ $t('how_to_stake') }}</a>
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('game-faq-stats-modal::open')">{{ $t('game_faq') }}</a>
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
    computed: {
      unStakeDisabled() { 
        if (!this.gUser.stakingData.stake) return true
        if (this.gUser.stakingData.stake.lte(0)) return true
        return false  
      },       
    },
    methods: {
      unStake() {
        this.$store.dispatch('user/UNSTAKE')  
      },      
    },
    i18n: {
      messages: {
        en: {
          stats: 'Stats',
          total_staken: 'Total staken',
          your_stake: 'Your stake',
          unstake: 'Unstake',
          how_to_stake: 'How to stake?',
          game_faq: 'Game FAQ',
        },          
      }      
    }
  }
</script>

<style lang="scss" scoped>
  .__stats_col_1 {
    width: 95px;
  }
  .__stats_col_2 {
    width: 85px;
  }
  .__stats_col_3 {
    max-width: 110px;
  }
  .__stats_col_4 {
    min-width: 110px;
  }
</style>