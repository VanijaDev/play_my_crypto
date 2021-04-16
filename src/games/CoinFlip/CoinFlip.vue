<template>
  <div class="__content-block __cb_white">
    
    <div class="h-100 d-flex flex-column" v-if="gGame.id">
      <!-- Title -->
      <h2 class="__blue_text text-center mb-4">{{ $t(mode) }}</h2>

      <!-- Body -->
      <div class="h-100 d-flex flex-column justify-content-between">
        <div class="d-flex flex-column flex-sm-row justify-content-center justify-content-md-between" >
          
          <!-- Coin -->
          <!-- TODO BNC selected coin -->
          <div class="__cf_coin_block  justify-content-center align-items-center order-1 order-sm-2 mr-sm-3" v-if="mode !== this.MODE_RESULT"> 
            
           <!--  <h4 class="__blue_text text-center mb-4" v-if="mode === MODE_RESULT">COIN SIDE</h4> -->

            <div class="__cf_big_coin_circle_wrapper __shadow " :class="{'__selected_btc' : selectedCoin === COIN_SIDE_HEADS, '__selected_eth' : selectedCoin === COIN_SIDE_TAILS,}">
              <div class="__question" v-show="!selectedCoin">?</div>
              <img src="/img/bitcoin_icon.svg" alt="BTC" v-show="selectedCoin === COIN_SIDE_HEADS">
              <img :src="gCurrentNetworkIcon" alt="ETH" v-show="selectedCoin === COIN_SIDE_TAILS">
            </div>

            <div class="__cf_select_coin d-flex justify-content-between"
              v-if="mode === this.MODE_START || 
                    mode === this.MODE_JOIN || 
                    mode === this.MODE_PLAYING_CREATOR || 
                    mode === this.MODE_FINISH_TIMEOUT_START">
              <div class="__img_button __shadow_filter">
                <div class="__cf_coin  __btc" @click="selectedCoin = COIN_SIDE_HEADS" :class="{'__selected' : selectedCoin === COIN_SIDE_HEADS}">
                  <img src="/img/bitcoin_icon.svg" height="25"  width="25" alt="BTC">
                </div>
              </div>
              <div class="__img_button __shadow_filter">
                <div class="__cf_coin  __eth " @click="selectedCoin = COIN_SIDE_TAILS" :class="{'__selected' : selectedCoin === COIN_SIDE_TAILS}">
                  <img :src="gCurrentNetworkIcon" height="25"  width="25" alt="ETH">
                </div>
              </div>  
            </div>
          </div>
          
          <!-- Result -->
          <div class="__cf_result_block  justify-content-center align-items-center order-1 order-sm-2 " v-if="mode === this.MODE_RESULT">
            
            <div class="d-flex flex-column justify-content-center" v-if="isWinner">
              <img src="/img/game_result_won.svg" alt="Won" width="100" class="mb-3 align-self-center">
              <h4 class="__blue_text text-center">You won!</h4>
            </div> 
            <div class="d-flex flex-column justify-content-center" v-if="!isWinner">
              <img src="/img/game_result_loose.svg" alt="Won" width="100" class="mb-3 align-self-center">
              <h4 class="__blue_text text-center">You lost...</h4>
            </div>
            
          </div>

          <!-- Views -->
          <div class="__cf_view_block mr-0 mr-sm-4 order-2 order-sm-1" :class="{'w-100' : gBreakPoint('xs')}">
            
            <!-- start -->
            <div class="__cf_view" v-if="mode === this.MODE_START">
              
              <div class="__cf_line">Enter referral address (optional):</div>
              <input type="text" class="form-control w-100 mb-3" v-model="gameplay.start.referralAddress" placeholder="0x313745d2A7A7dD88c76cd4Aee6C25">

              <div class="__cf_line mb-1">Enter seed phrase</div>
              <div class="__cf_line __red_text">(IMPORTANT to remember it):</div>
              <input type="text" class="form-control w-100 mb-3" v-model="gameplay.start.seedPhrase" placeholder="Hello World">

              <div class="__cf_line">Game bet:</div>
              <input type="number" class="form-control w-50 mb-3" v-model="gameplay.start.bet" placeholder="1.2345" step="0.1">

            </div> 

            <!-- join -->
            <div class="__cf_view" v-if="mode === this.MODE_JOIN">
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span id="join_bet" class="ml-3 text-monospace" >{{gGame.info.stake | formatBalanceShort}}</span>
                <b-tooltip target="join_bet" custom-class="__tooltip" >{{gGame.info.stake | formatBalance}}</b-tooltip>
              </div>
              
              <div class="__cf_line mb-2">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">{{joinParticipiantsSum | anyBNValue}}</span>
              </div>
              
              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.heads | anyBNValue}}</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.tails | anyBNValue}}</span>
              </div>
              
              <div class="__cf_line">Enter referral address (optional):</div>
              <input type="text" class="form-control w-100 mb-3" v-model="gameplay.join.referralAddress" placeholder="0x313745d2A7A7dD88c76cd4Aee6C25">
              
              <div class="__timer d-flex mb-3">
                <div>{{timeLeft.hours}} h</div>
                <div>{{timeLeft.minutes}} min</div>
                <div>{{timeLeft.seconds}} sec</div>
              </div>

            </div>

            <!-- playing_creator -->
            <div class="__cf_view" v-if="mode === this.MODE_PLAYING_CREATOR">
              
              <div class="__cf_line">Referral address:</div>
              <div class="__cf_line text-monospace text-truncate mb-4">{{myReferralAddressForGame}}</div>
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span id="playing_creator_bet" class="ml-3 text-monospace" >{{gGame.info.stake | formatBalanceShort}}</span>
                <b-tooltip target="playing_creator_bet" custom-class="__tooltip" >{{gGame.info.stake | formatBalance}}</b-tooltip>
              </div>

              <div class="__cf_line mb-2">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">{{joinParticipiantsSum | anyBNValue}}</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-2">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.heads | anyBNValue}}</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-2">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.tails | anyBNValue}}</span>
              </div>

              <div class="__cf_line mb-2  d-flex align-items-center __text_grow_1">
                <span class="mr-2 __blue_text">Approximate profit:</span>
                <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">
                <span id="playing_creator_potential_profit" class="ml-3 text-monospace __blue_text">{{calculatePotentialProfit | formatBalanceShort}}</span>
                <b-tooltip target="playing_creator_potential_profit" custom-class="__tooltip" >{{calculatePotentialProfit | formatBalance}}</b-tooltip>
              </div>

              <div class="__timer d-flex mb-3">
                <div>{{timeLeft.hours}} h</div>
                <div>{{timeLeft.minutes}} min</div>
                <div>{{timeLeft.seconds}} sec</div>
              </div>

            </div>

            <!-- playing_opponent -->
            <div class="__cf_view" v-if="mode === this.MODE_PLAYING_OPPONENT">

              <div class="__cf_line">Referral address:</div>
              <div class="__cf_line text-monospace text-truncate mb-4">{{myReferralAddressForGame}}</div>
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span id="playing_creator_opponent" class="ml-3 text-monospace" >{{gGame.info.stake | formatBalanceShort}}</span>
                <b-tooltip target="playing_creator_opponent" custom-class="__tooltip" >{{gGame.info.stake | formatBalance}}</b-tooltip>
              </div>
              
              <div class="__cf_line mb-2">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">{{joinParticipiantsSum | anyBNValue}}</span>
              </div>
              
              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.heads | anyBNValue}}</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-3">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.tails | anyBNValue}}</span>
              </div>
              
              <div style="visibility: hidden" class="__cf_line mb-2  d-flex align-items-center __text_grow_1">
                <span class="mr-2 __blue_text">Current profit:</span>
                <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">
                <span class="ml-3 text-monospace __blue_text">0.00000</span>
              </div>
              
              <div class="__timer d-flex mb-3">
                <div>{{timeLeft.hours}} h</div>
                <div>{{timeLeft.minutes}} min</div>
                <div>{{timeLeft.seconds}} sec</div>
              </div>

            </div>

            <!-- result -->
            <div class="__cf_view" v-if="mode === this.MODE_RESULT">
              
              <div class="__cf_line">Referral address:</div>
              <div class="__cf_line text-monospace text-truncate mb-4">{{myReferralAddressForGame}}</div>
              
              <div class="__cf_line">
                <span>Game bet:</span>
                <span id="id_4_bet" class="ml-3 text-monospace" >{{gGame.info.stake | formatBalanceShort}}</span>
                <b-tooltip target="id_4_bet" custom-class="__tooltip" >{{gGame.info.stake | formatBalance}}</b-tooltip>
              </div>

              <div class="__cf_line mb-3">
                <span>Participants:</span>
                <span class="ml-3 text-monospace">{{joinParticipiantsSum | anyBNValue}}</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-2">
                <div class="__cf_coin __shadow __btc __selected">
                  <img src="/img/bitcoin_icon.svg" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.heads | anyBNValue}}</span>
              </div>

              <div class="__cf_line d-flex align-items-center mb-4">
                <div class="__cf_coin __shadow __eth __selected">
                  <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">
                </div>
                <span class="ml-3 text-monospace">{{gGame.info.tails | anyBNValue}}</span>
              </div>
              
              <div class="__cf_line mb-2  d-flex align-items-center __text_grow_1">
                <span class="mr-2 __blue_text">Approximate profit:</span>
                <img :src="gCurrentNetworkIcon" height="20"  width="20" alt="BTC">
                <span id="result_potential_profit" class="ml-3 text-monospace __blue_text">{{calculatePotentialProfit | formatBalanceShort}}</span>
                <b-tooltip target="result_potential_profit" custom-class="__tooltip" >{{calculatePotentialProfit | formatBalance}}</b-tooltip>
              </div>

              <div class="__timer d-flex mb-3">
                <div>00 h</div>
                <div>00 min</div>
                <div>00 sec</div>
              </div>

            </div>

            <!-- finish_timeout_start -->
            <div class="__cf_view" v-if="mode === this.MODE_FINISH_TIMEOUT_START">
              
              <div class="__cf_line">Enter referral address (optional):</div>
              <input type="text" class="form-control w-100 mb-3" v-model="gameplay.start.referralAddress" placeholder="0x313745d2A7A7dD88c76cd4Aee6C25">

              <div class="__cf_line mb-1">Enter seed phrase</div>
              <div class="__cf_line __red_text">(IMPORTANT to remember it):</div>
              <input type="text" class="form-control w-100 mb-3" v-model="gameplay.start.seedPhrase" placeholder="Hello World">

              <div class="__cf_line">Game bet:</div>
              <input id="id_5_bet" type="text" class="form-control w-50 mb-3" v-model="gameplay.start.bet" placeholder="1.2345">
                <!-- <b-tooltip target="id_4_bet" custom-class="__tooltip" >{{gGame.info.stake | formatBalance}}</b-tooltip> -->

              <div class="__timer d-flex mb-3">
                <div>00 h</div>
                <div>00 min</div>
                <div>00 sec</div>
              </div>

            </div>

          </div>
        </div> 

        <!-- Footer -->
        <div class="d-flex justify-content-center" v-if="mode === this.MODE_START">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" :disabled="startDisabled" @click="startGameClicked()">START</button>
        </div>

        <div class="d-flex  flex-column flex-sm-row  justify-content-center justify-content-sm-between" v-if="mode === this.MODE_PLAYING_CREATOR">
          <div class="flex-grow-1 mr-0 mr-sm-3  mb-3 mb-sm-0 ">
            <div class="__cf_line">Enter seed phrase:</div>
            <input type="text" class="form-control w-100"  placeholder="Phrase used  to start game" v-model="gameplay.finish_timeout_start.seedPhrase">
          </div>
          <button type="button" class="btn btn-primary btn-lg __blue_button align-self-center h-100" :disabled="finishDisabled" @click="playGameClicked()" >FINISH GAME</button>
        </div>

        <div class="d-flex justify-content-center" v-if="mode === this.MODE_JOIN">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" :disabled="joinDisabled" @click="joinGameClicked()">JOIN</button>
        </div>

        
        <div class="d-flex justify-content-center" v-if="mode === this.MODE_PLAYING_OPPONENT">
          <button style="visibility: hidden" type="button" class="btn btn-primary btn-lg __blue_button px-5" >OK</button>
        </div>

        <div class="d-flex justify-content-center" v-if="mode === this.MODE_RESULT">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" @click="resultOKClicked()" >OK</button>
        </div>

        <div class="d-flex justify-content-center" v-if="mode === this.MODE_FINISH_TIMEOUT_START">
          <button type="button" class="btn btn-primary btn-lg __blue_button px-5" :disabled="startDisabled" @click="startGameClicked()">FINISH AND START NEW GAME</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
  import { ethers, BigNumber } from "ethers";
  import constants from "../../utils/constants";
  import { mapState } from 'vuex';
  
  export default {
    name: 'CoinFlipGame',
    data: () => ({
      COIN_SIDE_HEADS: constants.COIN_SIDE_HEADS,
      COIN_SIDE_TAILS: constants.COIN_SIDE_TAILS,
      MODE_START: "MODE_START",
      MODE_JOIN: "MODE_JOIN",
      MODE_PLAYING_CREATOR: "MODE_PLAYING_CREATOR",
      MODE_PLAYING_OPPONENT: "MODE_PLAYING_OPPONENT",
      MODE_FINISH_TIMEOUT_START: "MODE_FINISH_TIMEOUT_START",
      MODE_RESULT: "MODE_RESULT",
      isWinner: false,
      isShowResult: false,
      id: 'CF',
      selectedCoin: null,
      result: true,
      gameplay: {
        start: {
          referralAddress: null,
          seedPhrase: null,
          bet: null
        },
        join: {
          referralAddress: null
        },
        finish_timeout_start: {
          seedPhrase: null,
        }
      },
      timeLeft: { 
        total: 0,
        hours: '00',
        minutes: '00',
        seconds: '00'
      },
      timerId: null
    }),

    computed: {
      mode() {
        // start 
        if ((!this.gGame.gameplay) || (!this.gGame.info) || (!this.gGame.gameplay.gamesStarted && !this.gGame.gameplay.gamesFinished )) {
          return this.MODE_START;
        }

        //  start / result
        if (this.gGame.gameplay.gamesStarted.eq(this.gGame.gameplay.gamesFinished)) {
          return (this.isShowResult) ? this.MODE_RESULT : this.MODE_START;
        }
         
        // ongoing game
        if (this.gGame.gameplay.gamesStarted.gt(this.gGame.gameplay.gamesFinished)) {
            // playing_creator
            if (this.gUser.accountAddress
              && this.gGame.info.creator 
              && this.gGame.info.creator.toLowerCase() === this.gUser.accountAddress.toLowerCase()) {
                if (new Date((this.gGame.info.startTime.toString() * 1000) + constants.MAX_GAME_DURATION_MILLISECONDS) > new Date(Date.now())) {
                  return this.MODE_PLAYING_CREATOR;
                } else {
                  return this.MODE_FINISH_TIMEOUT_START;
                }
            }
            
            // playing_opponent
            if (this.gGame.gameplay.gamesParticipatedToCheckPrize
              && this.gGame.gameplay.gamesParticipatedToCheckPrize.length > 0
              && this.gGame.gameplay.gamesStarted.sub(1).eq(this.gGame.gameplay.gamesParticipatedToCheckPrize[this.gGame.gameplay.gamesParticipatedToCheckPrize.length - 1])) {
                if (new Date((this.gGame.info.startTime.toString() * 1000) + constants.MAX_GAME_DURATION_MILLISECONDS) > new Date(Date.now())) {
                  return this.MODE_PLAYING_OPPONENT;
                } else {
                  return this.MODE_FINISH_TIMEOUT_START;
                }
            }

            // join
            return this.MODE_JOIN;
        }

        // TODO next game modes
        return null;
      },

      startDisabled() {
        if (this.gUser.txGameplayInProgress || !this.selectedCoin || !this.gameplay.start.seedPhrase || !this.gameplay.start.bet) {
          return true;
        }

        try {
          if (ethers.utils.parseEther(this.gameplay.start.bet).lt(ethers.utils.parseEther(constants.MIN_STAKE_ETH))) {
            return true;
          }

            if (this.gUser.balanceETH.lt(ethers.utils.parseEther(this.gameplay.start.bet))) {
            return true;
          }

          return false;
        } catch (error) {
          return true;
        }

        return true;
      },

      joinDisabled() {
        if (this.gUser.txGameplayInProgress || !this.selectedCoin || !this.gUser.balanceETH || this.gUser.balanceETH.lt(this.gGame.info.stake)) {
          return true;
        }

        return false;
      },

      finishDisabled() {
        if (this.gUser.txGameplayInProgress || !this.selectedCoin || !this.gameplay.finish_timeout_start.seedPhrase) {
          return true;
        }

        if (this.joinParticipiantsSum.lt(BigNumber.from(2))) {
          return true;
        }

        return false;
      },

      joinParticipiantsSum() {
        return (this.gGame.info && this.gGame.info.heads && this.gGame.info.tails) ? this.gGame.info.heads.add(this.gGame.info.tails).add(1) : BigNumber.from(0);
      },

      myReferralAddressForGame() {
        return (this.gGame.data) ? this.gGame.data.referralInGame : ".....";
      },

      running() {
        return (this.gGame.info && this.gGame.info.running)
      },

      coinSideForOpponent() {
        return (this.gGameData && this.gGameData.coinSideForOpponent);
      },

      calculatePotentialProfit() {
        let res = BigNumber.from(0);

        if (this.gGame.info) {
          if (this.selectedCoin == constants.COIN_SIDE_HEADS) {
            if (this.gGame.info.tails.gt(0)) {
              res = this.gGame.info.stake.add(this.gGame.info.tails.mul(this.gGame.info.stake).div(this.gGame.info.heads.add(1))).mul(95).div(100);
            }
          } else if (this.selectedCoin == constants.COIN_SIDE_TAILS) {
            if (this.gGame.info.heads.gt(0)) {
              res = this.gGame.info.stake.add(this.gGame.info.heads.mul(this.gGame.info.stake).div(this.gGame.info.tails.add(1))).mul(95).div(100);
            }
          }
        }

        return res;
      },

      ...mapState({
        txGameplayInProgress: state => state.user.txGameplayInProgress
      })
    },

    beforeDestroy() {
      this.$store.dispatch('games/SET_CURRENT_GAME', null)
    },
    created() {
      // // connection of game store (if need it)
      // if (Object.prototype.hasOwnProperty.call(this.$store.state, 'game')) this.$store.unregisterModule('game');
      // let store = (await import(/* webpackChunkName: "CoinFlip.store" */ "./CoinFlip.store")).default;
      // this.$store.registerModule("game", store);

      this.$store.dispatch('games/SET_CURRENT_GAME', this.id);
    },
    watch: {
      txGameplayInProgress(_oldValue, _newValue) {
        // this.resetData();
      },

      running() {
        setTimeout(this.startCountdown, 1);
      },

      coinSideForOpponent() {
        if (this.gGameData.coinSideForOpponent > 0) {
          this.selectedCoin = this.gGameData.coinSideForOpponent.toString();
        } else {
          this.selectedCoin = null;
        }
      }
    },
    methods: {
      resetData() {
        // this.gameplay.start.referralAddress = null;
        // TODO
      },

      startCountdown() {
        let t = 0
        if (this.running 
          && BigNumber.isBigNumber(this.gGame.info.startTime)
          && this.gGame.info.startTime.gt(0)) {
            t = new Date((this.gGame.info.startTime.toString() * 1000) + constants.MAX_GAME_DURATION_MILLISECONDS) - new Date(Date.now())
        }

        this.timeLeft = {
          total:    t,
          hours:    t > 0 ? ('0' + Math.floor((t / (1000 * 60 * 60)) % 24)).slice(-2) : '00',
          minutes:  t > 0 ? ('0' + Math.floor((t / 1000 / 60) % 60)).slice(-2) : '00',
          seconds:  t > 0 ? ('0' + Math.floor((t / 1000) % 60)).slice(-2) : '00', 
        }; 
        if (t > 0) setTimeout(this.startCountdown, 1000);
      },

      startGameClicked() {
        this.$store.dispatch('coinflip/START_GAME',
          { _selectedCoinSide: this.selectedCoin,
            _referralAddress: this.gameplay.start.referralAddress,
            _seedPhrase: this.gameplay.start.seedPhrase,
            _bet: this.gameplay.start.bet
          });
      },

      joinGameClicked() {
        this.isShowResult = true;

        this.$store.dispatch('coinflip/JOIN_GAME',
          { _selectedCoinSide: this.selectedCoin,
            _referralAddress: this.gameplay.join.referralAddress,
            _bet: this.gGame.info.stake
          });
      },

      playGameClicked() {
        this.isShowResult = true;

        this.$store.dispatch('coinflip/PLAY_GAME',
          { _selectedCoinSide: this.selectedCoin,
            _seedPhrase: this.gameplay.finish_timeout_start.seedPhrase,
          });
      },

      resultOKClicked() {
        this.isShowResult = false;
        //  TODO: GET_GAMES & other
      },
    },
    i18n: {
      messages: {
        en: {
          MODE_START: 'START NEW GAME',
          MODE_JOIN: 'JOIN GAME',
          MODE_PLAYING_CREATOR: 'PLAYING GAME',
          MODE_PLAYING_OPPONENT: 'PLAYING GAME',
          MODE_FINISH_TIMEOUT_START: 'TIME’S UP FOR THE ONGOING GAME',
          MODE_RESULT: 'RESULT',
          // TODO add rest of texts to translation
        },
      }
    }
  }
</script>

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