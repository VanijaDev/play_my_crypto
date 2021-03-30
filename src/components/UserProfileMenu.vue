<template>
  <div class="__user_profile_dd d-flex align-items-center">
    <b-dropdown toggle-tag="div" variant="link"  right toggle-class="text-decoration-none p-0 __up_dd_toggle" no-caret menu-class="__up_dd_menu shadow" :disabled="!gUser.accountAddress">
      <template #button-content>
        <div class="d-flex align-items-center __user_profile">
          <div class="d-flex flex-column __up_text mr-2">
            <span class="__strong-text __blue_text">{{ $t('profile') }}</span>
            <span class="__strong-text text-monospace">{{gUser.accountAddress | addressShort}}</span>              
          </div> 
          <div class="d-flex align-items-center">              
            <a class="d-flex flex-column justify-content-center align-items-center" href="#">
              <img src="/img/user_profile_icon.svg"  width="55" alt="Telegram logo" >                
            </a>              
          </div> 
        </div>
      </template>
      <div class="__drop_down_menu">
        <ul class="list-group __list_group">
          <li class="list-group-item d-flex justify-content-between align-items-center __list_item">
            <div class="__blue_text">{{ $t('balance') }}</div>
            <div class="d-flex align-items-center text-monospace">
              
              <img class="__currency_img" :src="gCurrentNetworkIcon" height="30" alt="Telegram logo">              
              
              <span id="up_1" class="mr-2">{{gUser.balanceETH | formatBalanceShort}}</span>
              
              <b-tooltip target="up_1" custom-class="__tooltip" >{{gUser.balanceETH | formatBalance}}</b-tooltip>
                            
              <img class="__currency_img" src="/img/logo.svg" height="30" alt="Logo">
              <span id="up_2">{{gUser.balancePMC | formatBalanceShort}}</span>
              <b-tooltip target="up_2" custom-class="__tooltip" >{{gUser.balancePMC | formatBalance}}</b-tooltip>
            </div>
          </li>      
        </ul>
        <ul class="list-group __list_group">
          <li class="list-group-item __list_item">
            <div class="d-flex justify-content-between"><span class="__blue_text">{{ $t('playing_now') }}</span> <span class="text-monospace" v-if="!gamesStarted.length">{{ $t('no_games_playing') }}</span></div>
            <div class="__card_list d-flex justify-content-end" v-if="gamesStarted.length">              
              <div v-for="(gameId, $index) in gamesStarted" :key="'gs_'+$index"
                class="__card_block __img_button __shadow_filter" 
                @click="gSelectGame(getGameById(gameId))"
                >
                <img :src="'/img/'+ getGameById(gameId).image" height="30" alt="Game image">
              </div>
                          
            </div>
          </li>      
        </ul>
        
        <ul class="list-group __list_group">
          <li class="list-group-item __list_item d-flex justify-content-between align-items-center ">
            <div class="__blue_text">{{ $t('total_in') }}</div>
            <div class="d-flex align-items-center text-monospace">
              <img class="__currency_img" :src="gCurrentNetworkIcon" height="30" alt="Telegram logo">              
              <span id="up_3" >{{gGameData.playerStakeTotal | formatBalanceShort}}</span>              
              <b-tooltip target="up_3" custom-class="__tooltip" >{{gGameData.playerStakeTotal | formatBalance}}</b-tooltip>
            </div>
          </li>     
          <li class="list-group-item __list_item ">
            <div class=" d-flex justify-content-between align-items-center mb-2">
              <div class="__blue_text">{{ $t('total_out') }}</div>
              <div class="d-flex align-items-center text-monospace">
                <img class="__currency_img" :src="gCurrentNetworkIcon" height="30" alt="Telegram logo">                
                <span id="up_4" :class="{'__price_change_down' : totalOutChange === 'down', '__price_change_up' : totalOutChange === 'up' }">
                  {{gGameData.playerWithdrawedTotal | formatBalanceShort}}
                </span>
                <PriceUpDownArrowIcon class="__price_change_icon" v-if="totalOutChange" :direction="totalOutChange"/>
                <b-tooltip target="up_4" custom-class="__tooltip" >{{gGameData.playerWithdrawedTotal | formatBalance}}</b-tooltip>
              </div>
            </div>            
            <div class="pl-3">
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>{{ $t('gameplay') }}</span>
                <span id="up_5">{{gGameData.pendingPrizeToWithdrawPrize | formatBalanceShort}}</span>
                <b-tooltip target="up_5" custom-class="__tooltip" >{{gGameData.pendingPrizeToWithdrawPrize | formatBalance}}</b-tooltip>
              </div>  
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>{{ $t('referral') }}</span>
                <span id="up_6">{{gGameData.referralFeeWithdrawn | formatBalanceShort}}</span>
                <b-tooltip target="up_6" custom-class="__tooltip" >{{gGameData.referralFeeWithdrawn | formatBalance}}</b-tooltip>
              </div>
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>{{ $t('raffle') }}</span>
                <span id="up_7">{{gGameData.raffleJackpotPending | formatBalanceShort}}</span>
                <b-tooltip target="up_7" custom-class="__tooltip" >{{gGameData.raffleJackpotPending | formatBalance}}</b-tooltip>
              </div>
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>{{ $t('staking') }}</span>
                <span id="up_8">{{gUser.stakingData.stakingRewardWithdrawn | formatBalanceShort}}</span>
                <b-tooltip target="up_8" custom-class="__tooltip" >{{gUser.stakingData.stakingRewardWithdrawn | formatBalance}}</b-tooltip>
              </div>
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>{{ $t('partnership') }}</span>
                <span id="up_9">{{gGameData.partnerFeeWithdrawn | formatBalanceShort}}</span>
                <b-tooltip target="up_9" custom-class="__tooltip" >{{gGameData.partnerFeeWithdrawn | formatBalance}}</b-tooltip>                
              </div>
            </div>
          </li>  
        </ul>  
        <ul class="list-group __list_group">          
          <li class="list-group-item __list_item">
            <div class="d-flex justify-content-between"><span class="__blue_text">{{ $t('pending_withdrawal') }}</span> <span class="text-monospace" v-if="!userGameplayOrPartnerPendingWithdrawal">{{ $t('not_available') }}</span></div>
            
            <div class="__card_list d-flex justify-content-end" v-if="userGameplayOrPartnerPendingWithdrawal">    
              <template  v-for="(game, index) in listOfGames">     
                <div class="__card_block  __img_button __shadow_filter" :key="'pwlist_' + index" v-if="userGameplayPendingWithdrawal(game)">
                  <img :src="game.image" height="30" alt="Gameplay">
                </div> 
                <div class="__card_block  __img_button __shadow_filter" :key="'pwlist_' + index" v-if="userPartnerPendingWithdrawal(game)">
                  <img :src="game.imagePartner" height="30" alt="Partner">
                </div> 
              </template>                                      
            </div> 
          </li>  
        </ul>
      </div>
    </b-dropdown>
  </div>  
</template>

<style lang="scss" scoped>  
  @import '@/assets/css/variables.scss';
  .__user_profile_dd {
    margin-right: -2px;
    .__user_profile{               
      .__up_text{
        span:first-child{
          text-align: right;
        }
        span:last-child{
          color: black !important;
        }
      }
      .__strong-text{
        font-weight: 700;
        font-size: 1.1rem;      
      }
    }  
    .__drop_down_menu {
      font-weight: 700;
      font-size: 1.1rem;
      min-width: 360px;
      padding: .5rem  .5rem;
      .__list_group {
        margin-bottom: .5rem;
        &:last-child {
          margin-bottom: 0;
        }
        .__list_item {
          &:first-child {
            border-top-left-radius: ($_content_block_border_radius - .2);
            border-top-right-radius: ($_content_block_border_radius - .2);
          }
          &:last-child {
            border-bottom-left-radius: ($_content_block_border_radius - .2);
            border-bottom-right-radius: ($_content_block_border_radius - .2);
          }
          .__currency_img {
            margin-right: .5rem;
          }
          .__price_change_down {
            color: $_red;
          }
          .__price_change_up {
            color: $_green;
          }
          .__price_change_icon {
            position: absolute;
            right: 4px;
            height: 14px;
            width: 14px;            
          }
          .__card_list {
            padding: 0.5rem 0;
            .__card_block {
              border-radius: ($_content_block_border_radius - .2);
              padding: .5rem .5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 50px;
              background: $_violet;
              margin-right: 1rem;
              transition: background ease 0.2s; 
              &:last-child {
                margin-right: 0;
              }
              &:hover {
                background: darken($_violet, 10%);
              }
            }
          }
        }  
      }
    }        
  }
</style>
<style lang="scss">  
  @import '@/assets/css/variables.scss';
  .__up_dd_toggle {
    box-shadow: none !important;
  }    
  .__up_dd_menu {
    padding: 0 !important;   
    border-radius: $_content_block_border_radius !important;
  }  
</style>

<script>
  import PriceUpDownArrowIcon from '@/components/icons/PriceUpDownArrowIcon.vue';

  export default {
    name: 'UserProfileMenu', 
    components: { PriceUpDownArrowIcon },
    data: () => ({      
    }),
    computed: {
      totalOutChange() { 
        if (this.gGameData && this.gGameData.totalIn && this.gGameData.playerWithdrawedTotal) {
          if (this.gGameData.totalIn.eq(this.gGameData.playerWithdrawedTotal)) return null
          return this.gGameData.totalIn.gt(this.gGameData.playerWithdrawedTotal) ? 'down' : 'up'
        }
        return null
      },
      gamesStarted() {  
        return this.$store.state['games/started'] ? this.$store.state['games/started'] : []
      },
      listOfGames() {         
        return this.$store.getters['games/listOfGames']
      },
      userGameplayPendingWithdrawal() { return function(game) {
        if (!game.data) return false
        if ( (game.data.pendingPrizeToWithdrawPrize && game.data.pendingPrizeToWithdrawPrize.gt(0)) 
          || (game.data.referralFeePending && game.data.referralFeePending.gt(0))
          || (game.data.raffleJackpotPending && game.data.raffleJackpotPending.gt(0))
        ) return true
        return false
      }},
      userPartnerPendingWithdrawal() { return function(game) {
        if (!game.data) return false
        if (game.data.partnerFeePending && game.data.partnerFeePending.gt(0)) return true
        return false
      }},
      userGameplayOrPartnerPendingWithdrawal() {
        return this.listOfGames.find(game => {
          return this.userGameplayPendingWithdrawal(game) || this.userPartnerPendingWithdrawal(game)
        })
      }
    },
    i18n: {
      messages: {
        en: {
          profile: 'Profile:',
          balance: 'Balance:',
          playing_now: 'Playing now:',
          total_in: 'Total in:',
          total_out: 'Total out:',
          gameplay: 'Gameplay:',
          referral: 'Referral:',
          raffle: 'Raffle:',
          staking: 'Staking:',
          partnership: 'Partnership:',
          pending_withdrawal: 'Pending withdrawal:',
          no_games_playing: 'no games playing',     
          not_available: 'not available',     
        },          
      }      
    } 
  }
</script>

