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
            <span id="p_stat_1">{{raffleJackpotsWonTotalTotal | formatBalanceShort}}</span>
            <b-tooltip target="p_stat_1" custom-class="__tooltip" >{{raffleJackpotsWonTotalTotal | formatBalance}}</b-tooltip>  
          </div>              
        </div>
        <!-- Total in -->
        <div class="__text_line">
          <span>Total in:</span>
          <div class="__img_value_block">
            <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
            <span id="p_stat_2">{{betsTotalTotal | formatBalanceShort}}</span>  
            <b-tooltip target="p_stat_2" custom-class="__tooltip" >{{betsTotalTotal | formatBalance}}</b-tooltip>
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
            <span id="p_stat_3">{{raffleJackpotTotal | formatBalanceShort}}</span>  
            <b-tooltip target="p_stat_3" custom-class="__tooltip" >{{raffleJackpotTotal | formatBalance}}</b-tooltip>
          </div>              
        </div>
        <!-- Participants -->
        <div class="__text_line">
          <span>Participants:</span>
          <span class="text-monospace">{{raffleParticipantsTotal}}</span>              
        </div> 
      </b-col>
    </b-row>
  </div>
</template>

<script>
  export default {
    name: 'PlatformStats',  
    computed: {
      raffleParticipantsTotal() { 
        return this.$store.getters['games/list'].reduce((total, game) => {
          if (game.id && game.data.raffleParticipants) total += game.data.raffleParticipants
          return total
        }, 0)        
      },
      raffleJackpotTotal() {         
        return this.$store.getters['games/list'].reduce((total, game) => {
          if (game.id && game.data.raffleJackpot) total = game.data.raffleJackpot.add(total)
          return total
        }, 0)
      },     
      raffleJackpotsWonTotalTotal() {         
        return this.$store.getters['games/list'].reduce((total, game) => {
          if (game.id && game.data.raffleJackpotsWonTotal) total = game.data.raffleJackpotsWonTotal.add(total)
          return total
        }, 0)
      }, 
      betsTotalTotal() {         
        return this.$store.getters['games/list'].reduce((total, game) => {
          if (game.id && game.data.betsTotal) total = game.data.betsTotal.add(total)
          return total
        }, 0)
      },
    },
  }
</script>

<style lang="scss" scoped>  
  
</style>