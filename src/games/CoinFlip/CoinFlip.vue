<template>
  <div class="__content-block __cb_white">
    
    <div class="h-100 d-flex flex-column" v-if="gGame.id">

      <h2 class="__blue_text text-center mb-4">{{viewTitles[gameView]}}</h2>

      <div class="h-100 d-flex flex-column justify-content-between">
        <div class="d-flex flex-column flex-sm-row justify-content-center justify-content-md-between" >
          <!-- Coin -->
          <div class="__cf_coin_block  justify-content-center align-items-center order-1 order-sm-2 mr-sm-3" v-if="gameView !== 'result'"> 
            
            <h4 class="__blue_text text-center mb-4" v-if="view === 4">COIN SIDE</h4>

            <div class="__cf_big_coin_circle_wrapper __shadow " :class="{'__selected_btc' : selectedCoin === 'BTC', '__selected_eth' : selectedCoin === 'ETH',}">
              <div class="__question" v-show="!selectedCoin">?</div>
              <img src="/img/bitcoin_icon.svg" alt="BTC" v-show="selectedCoin === 'BTC'">
              <img :src="gCurrentNetworkIcon" alt="ETH" v-show="selectedCoin === 'ETH'">
            </div>

            <div class="__cf_select_coin d-flex justify-content-between" v-if="view !== 4">
              <div class="__img_button __shadow_filter">
                <div class="__cf_coin  __btc" @click="selectedCoin = 'BTC'" :class="{'__selected' : selectedCoin === 'BTC'}">
                  <img src="/img/bitcoin_icon.svg" height="25"  width="25" alt="BTC">
                </div>
              </div>
              <div class="__img_button __shadow_filter">
                <div class="__cf_coin  __eth " @click="selectedCoin = 'ETH'" :class="{'__selected' : selectedCoin === 'ETH'}">
                  <img :src="gCurrentNetworkIcon" height="25"  width="25" alt="ETH">
                </div>
              </div>  
            </div>
          </div>
          
          <!-- Result -->
          <div class="__cf_result_block  justify-content-center align-items-center order-1 order-sm-2 " v-if="gameView === 'result'">
            
            <div class="d-flex flex-column justify-content-center" v-if="result" @click="result = false">
              <img src="/img/game_result_won.svg" alt="Won" width="100" class="mb-3 align-self-center">
              <h4 class="__blue_text text-center">You won!</h4>
            </div> 
            <div class="d-flex flex-column justify-content-center" v-if="!result" @click="result = true">
              <img src="/img/game_result_loose.svg" alt="Won" width="100" class="mb-3 align-self-center">
              <h4 class="__blue_text text-center">You lost...</h4>
            </div>
            
          </div>

          <div class="__cf_view_block mr-0 mr-sm-4 order-2 order-sm-1" :class="{'w-100' : gBreakPoint('xs')}">
            
            <!-- Start -->
            <div class="__cf_view" v-if="gameView === 'start'">
              
              <div class="__cf_line">Enter referral address (optional):</div>
              <input type="text" class="form-control w-100 mb-3" v-model="gameplay.start.referalAddress"  placeholder="0x313745d2A7A7dD88c76cd4Aee6C25">

              <div class="__cf_line mb-1">Enter seed phrase</div>
              <div class="__cf_line __red_text">(IMPORTANT to remember it):</div>
              <input type="text" class="form-control w-100 mb-3" v-model="gameplay.start.seedPhrase" placeholder="Hello World">

              <div class="__cf_line">Game bet:</div>
              <input type="text" class="form-control w-50 mb-3" v-model="gameplay.start.bet" placeholder="1.2345">

            </div> 

            <!-- playingCreator -->
            <div class="__cf_view" v-if="gameView === 'playingCreator'">
              
              <div class="__cf_line">Referral address:</div>
              <div class="__cf_line text-monospace text-truncate mb-4">0xt84u8r0394urwklnedlkfjojdut7e458737w</div>
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span class="ml-3 text-monospace">1.2345</span>
              </div>

              <div class="__cf_line mb-2">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">97</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-2">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">67</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-2">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">24</span>
              </div>

              <div class="__cf_line mb-2  d-flex align-items-center __text_grow_1">
                <span class="mr-2 __blue_text">Current profit:</span>
                <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">    
                <span class="ml-3 text-monospace __blue_text">2.1234</span>
              </div>

              <div class="__timer d-flex mb-3">
                <div>{{timeLeft.hours}} h</div>
                <div>{{timeLeft.minutes}} min</div>
                <div>{{timeLeft.seconds}} sec</div>
              </div>

            </div> 

            <!-- Join -->
            <div class="__cf_view" v-if="gameView === 'join'">
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span class="ml-3 text-monospace">1.2345</span>
              </div>
              
              <div class="__cf_line mb-2">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">97</span>
              </div>
              
              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">67</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">24</span>
              </div>
              
              <div class="__cf_line">Enter referral address (optional):</div>
              <input type="text" class="form-control w-100 mb-3"  placeholder="0x313745d2A7A7dD88c76cd4Aee6C25">
              
              <div class="__timer d-flex mb-3">
                <div>23 h</div>
                <div>01 min</div>
                <div>45 sec</div>
              </div>

            </div>

            <!-- playingOponent -->
            <div class="__cf_view" v-if="gameView === 'playingOponent'">

              <div class="__cf_line">Referral address:</div>
              <div class="__cf_line text-monospace text-truncate mb-4">0xt84u8r0394urwklnedlkfjojdut7e458737w</div>
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span class="ml-3 text-monospace">1.2345</span>
              </div>
              
              <div class="__cf_line mb-2">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">97</span>
              </div>
              
              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">67</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">24</span>
              </div>
              
              <div class="__cf_line mb-2  d-flex align-items-center __text_grow_1">
                <span class="mr-2 __blue_text">Current profit:</span>
                <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">    
                <span class="ml-3 text-monospace __blue_text">2.1234</span>
              </div>
              
              <div class="__timer d-flex mb-3">
                <div>{{timeLeft.hours}} h</div>
                <div>{{timeLeft.minutes}} min</div>
                <div>{{timeLeft.seconds}} sec</div>
              </div>

            </div>

            <!-- View 4 -->
            <div class="__cf_view" v-if="view === 4">
              
              <div class="__cf_line">Referral address:</div>
              <div class="__cf_line text-monospace text-truncate mb-4">0xt84u8r0394urwklnedlkfjojdut7e458737w</div>
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span class="ml-3 text-monospace">1.2345</span>
              </div>

              <div class="__cf_line mb-3">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">97</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-2">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">67</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-4">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">            
                </div>
                <span class="ml-3 text-monospace">24</span>
              </div>

              <div class="__timer d-flex mb-3">
                <div>23 h</div>
                <div>01 min</div>
                <div>45 sec</div>
              </div>

            </div> 

            <!-- View 5 -->
            <div class="__cf_view" v-if="view === 5">
              
              <div class="__cf_line">Enter referral address (optional):</div>
              <input type="text" class="form-control w-100 mb-3"  placeholder="0x313745d2A7A7dD88c76cd4Aee6C25">

              <div class="__cf_line mb-1">Enter seed phrase</div>
              <div class="__cf_line __red_text">(IMPORTANT to remember it):</div>
              <input type="text" class="form-control w-100 mb-3"  placeholder="Hello World">

              <div class="__cf_line">Game bet:</div>
              <input type="text" class="form-control w-50 mb-3"  placeholder="1.2345">

              <div class="__timer d-flex mb-3">
                <div>00 h</div>
                <div>00 min</div>
                <div>00 sec</div>
              </div>

            </div>

          </div>        
        </div>    
      
        <div class="d-flex justify-content-center" v-if="gameView === 'start'">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" @click="view = 1" :disabled="!startActive">START</button>
        </div>

        <div class="d-flex  flex-column flex-sm-row  justify-content-center justify-content-sm-between" v-if="gameView === 'playingCreator'">
          <div class="flex-grow-1 mr-0 mr-sm-3  mb-3 mb-sm-0 ">
            <div class="__cf_line">Enter seed phrase:</div>
            <input type="text" class="form-control w-100"  placeholder="Phrase used  to start game">
          </div>      
          <button type="button" class="btn btn-primary btn-lg __blue_button align-self-center h-100" @click="view = 2">FINISH GAME</button>
        </div>

        <div class="d-flex justify-content-center" v-if="gameView === 'join'">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" @click="view = 3">JOIN</button>
        </div>

        <div class="d-flex justify-content-center" v-if="gameView === 'playingOponent'">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" @click="view = 4">OK</button>
        </div>

        <div class="d-flex justify-content-center" v-if="view === 4">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" @click="view = 5">>>></button>
        </div>

        <div class="d-flex justify-content-center" v-if="view === 5">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" @click="view = 0">FINISH AND START NEW GAME</button>
        </div>

      </div>
    </div>   
  </div>  
</template>

<style lang="scss" scoped> 
  @import '@/assets/css/variables.scss';
  
  .__cf_view_block {
    width: calc(100% - 11em);    
  }
  
  .__cf_line {
    margin-bottom: .5rem;
    .__cf_coin {
      height: 2em;
      width: 2em;
    }
  }
  .__text_grow_1 {
    font-size: 1.2rem;
  }
  .__timer {
    div{
      padding: .3rem .8rem;
      background: rgba(247, 147, 26, 0.2);
      border-radius: .2rem;
      margin-right: .5rem;
    }
  }

  .__cf_result_block{
    margin-bottom: 1.5rem;
    width: 8em;
    align-self: center;
  }

  .__cf_coin_block {
    margin-bottom: 1.5rem;
    width: 11em;
    align-self: center;
    
    .__cf_big_coin_circle_wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 9em;
      width: 9em;
      border-radius: 5em;
      border: 3px solid $_violet;
      margin: auto;
      margin-bottom: 1rem;
      
      &.__selected_btc { 
        background-color: $_btc_color;
        border: 3px solid $_btc_color;      
      }
      &.__selected_eth { 
        background-color: $_eth_color;
        border: 3px solid $_eth_color;      
      }
      .__question{
        font-size: 5rem;
        font-weight: 700;
        color: $_violet;
      }
      
      img {
        height: 6em;
        width: 6em;
      }      
    }    
  }
  .__cf_coin {
    height: 3em;
    width: 3em;
    border-radius: 1.5em;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #858585;  
    cursor: pointer;      
    filter: saturate(0) contrast(50%) brightness(130%); 
    &:hover {
      filter: saturate(1) contrast(100%) brightness(100%);
    }
    &.__selected {
      filter: saturate(1) contrast(100%) brightness(100%);
    }        
    &.__btc{
      background-color: $_btc_color;
    }        
    &.__eth{
      background-color: $_eth_color;
    }        
  }  
</style>

<script>
  export default {
    name: 'CoinFlipGame', 
    data: () => ({
      id: 'CF',
      ready: false, 
      selectedCoin: null,
      view: 0, 
      result: true,
      viewTitles: {
        start: 'START NEW GAME', 
        join: 'JOIN GAME',
        playingCreator: 'PLAYING GAME',        
        playingOponent: 'PLAYING GAME', 
        // TODO
        result: 'RESULT',        
        timeout: 'TIME’S UP FOR THE ONGOING GAME'
      },
      gameplay: {
        start: {
          referalAddress: null,
          seedPhrase: null,
          bet: null
        }  
      },
      timeLeft: {
        total: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      },
      duration: 24 * 60 * 60 * 1000       
    }),
    computed: {
      gameView() {        
        if (!this.gGame.gameplay || !this.gGame.info) return null        
        
        // start 
        if (this.gGame.gameplay.gamesStarted 
          && this.gGame.gameplay.gamesFinished 
          && this.gGame.gameplay.gamesStarted.eq(this.gGame.gameplay.gamesFinished)) 
          return 'start'
         
        // playingCreator or playingOponent or join
        if (this.gGame.gameplay.gamesStarted 
          && this.gGame.gameplay.gamesFinished 
          && this.gGame.gameplay.gamesStarted.gt(this.gGame.gameplay.gamesFinished)) 
          {
          // playingCreator
          if ( this.gUser.accountAddress
            && this.gGame.info 
            && this.gGame.info.creator 
            && this.gGame.info.creator.toLowerCase() === this.gUser.accountAddress.toLowerCase()
          ) 
          return 'playingCreator'  
          // playingOponent
          if (this.gGame.gameplay.gamesStarted 
            && this.gGame.gameplay.gamesParticipatedToCheckPrize
            && this.gGame.gameplay.gamesParticipatedToCheckPrize.length > 0
            && this.gGame.gameplay.gamesStarted.sub(1).eq(this.gGame.gameplay.gamesParticipatedToCheckPrize[this.gGame.gameplay.gamesParticipatedToCheckPrize.length - 1])
          ) 
          return 'playingOponent' 
          // join
          return 'join'
        }        
        //// join 
        //if (this.gGame.gameplay.gamesStarted && this.gGame.gameplay.gamesFinished && this.gGame.gameplay.gamesStarted.gt(this.gGame.gameplay.gamesFinished)) return 'join'
        return null
      },
      startActive() {
        return (this.selectedCoin && this.gameplay.start.seedPhrase && this.gameplay.start.bet)        
      },  
      running() {
        return (this.gGame.info && this.gGame.info.running)        
      }, 
    },
    beforeDestroy() {
      this.$store.dispatch('games/SET_CURRENT_GAME', null)
    },
    created() {
      //if (Object.prototype.hasOwnProperty.call(this.$store.state, 'game')) this.$store.unregisterModule('game')
      //let store = (await import(/* webpackChunkName: "CoinFlip.store" */ "./CoinFlip.store")).default
      //this.$store.registerModule("game", store)      
      this.$store.dispatch('games/SET_CURRENT_GAME', this.id)  
    },
    mounted() {
      
    },
    watch: {
      running() {
        setTimeout(this.startCountdown, 1);
      }
    },
    methods: {
      startCountdown() {
        // TODO check and format to '00 sec' instead '0 sec'
        let t = 0
        if (this.gGame.info && this.gGame.info.startTime) {
          t = new Date((this.gGame.info.startTime.toString() * 1000) + this.duration) - new Date(Date.now())
        }
        
        if (t > 0 && this.running) { //
          this.timeLeft = {
            total: t,
            hours: Math.floor((t / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((t / 1000 / 60) % 60),
            seconds: Math.floor((t / 1000) % 60)
          };  
          setTimeout(this.startCountdown, 1000);        
        } else {
          this.timeLeft = {
            total: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
          }; 
        }              
      }
    }
  }
</script>