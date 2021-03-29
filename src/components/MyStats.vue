<template>
  <!-- TODO : withdraw click methods -->
  <div class="__content-block __cb_white h-100">
    <b-row class="h-100">      
      <b-col xs="12" sm="6">
        <h3>{{ $t('my_stats') }}</h3>
        <!-- My in -->
        <div class="__text_line">
          <span>{{ $t('my_in') }}</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_1">{{gGameData.playerStakeTotal | formatBalanceShort}}</span>
            <b-tooltip target="my_stat_1" custom-class="__tooltip" >{{gGameData.playerStakeTotal | formatBalance}}</b-tooltip>  
          </div>              
        </div>
        <!-- My out -->
        <div class="__text_line">
          <span>{{ $t('my_out') }}</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_2">{{gGameData.playerWithdrawedTotal | formatBalanceShort}}</span>
            <b-tooltip target="my_stat_2" custom-class="__tooltip" >{{gGameData.playerWithdrawedTotal | formatBalance}}</b-tooltip>  
          </div>              
        </div>
      </b-col>
      <b-col xs="12" sm="6" class="mt-3 mt-sm-0">
        <h3>{{ $t('ongoing_raffle') }}</h3>
        <!-- Jackpot -->
        <div class="__text_line">
          <span>{{ $t('jackpot') }}</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_3">{{gGameData.raffleJackpot | formatBalanceShort}}</span>
            <b-tooltip target="my_stat_3" custom-class="__tooltip" >{{gGameData.raffleJackpot | formatBalance}}</b-tooltip>  
          </div>              
        </div>
        <!-- Participants -->
        <div class="__text_line">
          <span>{{ $t('participants') }}</span>
          <span class="text-monospace">{{gGameData.raffleParticipants}}</span>                
        </div>
      </b-col>
      <b-col cols="12" class="mt-5">
        <h3>{{ $t('pending_withdrawal') }}</h3>
        <!-- Gameplay ETH -->
        <div class="__text_line mb-3">
          <span class="w-25">{{ $t('gameplay_eth') }}</span>          
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_4">{{gGameData.pendingPrizeToWithdrawPrize | formatBalanceShort}}</span>
            <b-tooltip target="my_stat_4" custom-class="__tooltip" >{{gGameData.pendingPrizeToWithdrawPrize | formatBalance}}</b-tooltip>  
          </div>
          <button type="button" class="btn btn-primary __blue_button ml-1">{{ $t('withdraw') }}</button> 
        </div>
        <!-- Gameplay PMC-->
        <div class="__text_line mb-3">
          <span class="w-25">{{ $t('gameplay_pmc') }}</span>          
          
          <div class="__img_value_block">
            <img src="/img/logo.svg" height="30"  width="30" alt="ETH">
            <span id="my_stat_7">{{gGameData.pendingGameplayPmcTokens | formatBalanceShort}}</span>
            <b-tooltip target="my_stat_7" custom-class="__tooltip" >{{gGameData.pendingGameplayPmcTokens | formatBalance}}</b-tooltip>  
          </div>
          <button type="button" class="btn btn-primary __blue_button ml-1">{{ $t('withdraw') }}</button> 

        </div>
        <!-- Referral -->
        <div class="__text_line mb-3">
          <span class="w-25">{{ $t('referral') }}</span>
          
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="my_stat_5">{{gGameData.referralFeePending | formatBalanceShort}}</span>
            <b-tooltip target="my_stat_5" custom-class="__tooltip" >{{gGameData.referralFeePending | formatBalance}}</b-tooltip>  
          </div>
                     
          <button type="button" class="btn btn-primary __blue_button ml-1">{{ $t('withdraw') }}</button>  
        </div>
        <!-- Raffle -->
        <div class="__text_line mb-3">
          <span class="w-25">{{ $t('raffle') }}</span>
          
            <div class="__img_value_block">
              <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
              <span id="my_stat_6">{{gGameData.raffleJackpotPending | formatBalanceShort}}</span>
              <b-tooltip target="my_stat_6" custom-class="__tooltip" >{{gGameData.raffleJackpotPending | formatBalance}}</b-tooltip>  
            </div>
          
          <button type="button" class="btn btn-primary __blue_button ml-1">{{ $t('withdraw') }}</button>  
        </div>

        <!-- Info -->
        <div class="__text_line mt-2">
          <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('how-to-play-modal::open')">{{ $t('how_to_play') }}</a>
          <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('game-faq-my-stats-modal::open')">{{ $t('game_faq') }}</a>
        </div>  
        
      </b-col>
    </b-row>    
    <HowToPlayModal/>
    <GameFAQMyStatsModal/>
  </div>
</template>

<script>
  import HowToPlayModal from '@/components/modals/HowToPlayModal.vue';
  import GameFAQMyStatsModal from '@/components/modals/GameFAQMyStatsModal.vue';

  export default {
    name: 'MyStats',  
    components: { HowToPlayModal, GameFAQMyStatsModal }, 
    i18n: {
      messages: {
        en: {
          my_stats: 'My stats',
          my_in: 'My in:',
          my_out: 'My out:',          
          ongoing_raffle: 'Ongoing raffle',
          jackpot: 'Jackpot:',
          participants: 'Participants:',    
          pending_withdrawal: 'Pending withdrawal',      
          gameplay_eth: 'Gameplay:',  
          gameplay_pmc: 'PMC:',
          referral: 'Referral:',
          raffle: 'Raffle:', 
          withdraw: 'Withdraw',   
          how_to_play: 'How to play?',
          game_faq: 'Game FAQ',
        },          
      }      
    }
  }
</script>

<style lang="scss" scoped>  
  //@import '@/assets/css/variables.scss';
</style>