<template>
  <div class="__content-block __cb_white">
    <div class="h-100 d-flex flex-column" v-if="currentGame.id">
      <h2 class="__blue_text text-center mb-4">{{game.title}}</h2>
    </div>
  </div>  
</template>

<style lang="scss" scoped> 
  @import '@/assets/css/variables.scss';  
</style>

<script>
  export default {
    name: 'StonePaperScissorsGame', 
    data: () => ({
      id: 'SPS',
      ready: false
    }),
    computed: {
      
    },
    beforeDestroy() {
      this.$store.dispatch('games/SET_CURRENT_GAME', null)
    },
    async created() {
      if (Object.prototype.hasOwnProperty.call(this.$store.state, 'game')) this.$store.unregisterModule('game')
      let store = (await import(/* webpackChunkName: "RockPaperScissors.store" */ "./RockPaperScissors.store")).default
      this.$store.registerModule("game", store)
      this.$store.dispatch('games/SET_CURRENT_GAME', this.id)   
    }
  }
  
</script>