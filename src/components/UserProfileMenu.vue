<template>
  <div class="__user_profile_dd d-flex align-items-center">
    <b-dropdown toggle-tag="div" variant="link"  right toggle-class="text-decoration-none p-0 __up_dd_toggle" no-caret menu-class="__up_dd_menu shadow">
      <template #button-content>
        <div class="d-flex align-items-center __user_profile">
          <div class="d-flex flex-column __up_text mr-2">
            <span class="__strong-text __blue_text">{{ $t('profile') }}:</span>
            <span class="__strong-text text-monospace">{{user.accountAddress | addressShort}}</span>              
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
            <div class="__blue_text">Balance:</div>
            <div class="d-flex align-items-center text-monospace">
              
              <img class="__currency_img" src="/img/ethereum_icon.svg" height="30" alt="Telegram logo">              
              
              <span id="up_1" class="mr-2">{{user.balance.ETH | formatBalanceShort}}</span>
              
              <b-tooltip target="up_1" custom-class="__tooltip" >{{user.balance.ETH | formatBalance}}</b-tooltip>
                            
              <img class="__currency_img" src="/img/logo.svg" height="30" alt="Logo">
              <span id="up_2">{{user.balance.PMC | formatBalanceShort}}</span>
              <b-tooltip target="up_2" custom-class="__tooltip" >{{user.balance.PMC | formatBalance}}</b-tooltip>
            </div>
          </li>      
        </ul>
        <ul class="list-group __list_group">
          <li class="list-group-item __list_item">
            <div class="__blue_text">Playing now:</div>
            <div class="__card_list d-flex justify-content-end">              
              
              <div class="__card_block __img_button __shadow_filter" v-for="(gameId, $index) in user.gamesStarted" :key="'gs_'+$index">
                <img :src="'/img/'+ getGameById(gameId).image" height="30" alt="Game image">
              </div>
                          
            </div>
          </li>      
        </ul>
        
        <ul class="list-group __list_group">
          <li class="list-group-item __list_item d-flex justify-content-between align-items-center ">
            <div class="__blue_text">Total in:</div>
            <div class="d-flex align-items-center text-monospace">
              <img class="__currency_img" src="/img/binance_icon.svg" height="30" alt="Telegram logo">              
              <span id="up_3" class="__price_change_up">{{user.totalIn | formatBalanceShort}}</span>              
              <b-tooltip target="up_3" custom-class="__tooltip" >{{user.totalIn | formatBalance}}</b-tooltip>
            </div>
          </li>     
          <li class="list-group-item __list_item ">
            <div class=" d-flex justify-content-between align-items-center mb-2">
              <div class="__blue_text">Total out:</div>
              <div class="d-flex align-items-center text-monospace">
                <img class="__currency_img" src="/img/binance_icon.svg" height="30" alt="Telegram logo">                
                <span id="up_4" class="__price_change_down">{{user.totalOut | formatBalanceShort}}</span>
                <PriceUpDownArrowIcon class="__price_change_icon" v-if="totalOutChange" :direction="totalOutChange"/>
                <b-tooltip target="up_4" custom-class="__tooltip" >{{user.totalOut | formatBalance}}</b-tooltip>
              </div>
            </div>            
            <div class="pl-3">
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>Gameplay:</span>
                <span id="up_5">{{user.pendingGameplay | formatBalanceShort}}</span>
                <b-tooltip target="up_5" custom-class="__tooltip" >{{user.pendingGameplay | formatBalance}}</b-tooltip>
              </div>  
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>Referral:</span>
                <span id="up_6">{{user.referral | formatBalanceShort}}</span>
                <b-tooltip target="up_6" custom-class="__tooltip" >{{user.referral | formatBalance}}</b-tooltip>
              </div>
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>Raffle:</span>
                <span id="up_7">{{user.pendingRaffle | formatBalanceShort}}</span>
                <b-tooltip target="up_7" custom-class="__tooltip" >{{user.pendingRaffle | formatBalance}}</b-tooltip>
              </div>
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>Staking:</span>
                <span id="up_8">---</span>
                <b-tooltip target="up_8" custom-class="__tooltip" >0.123456789012345678</b-tooltip>
              </div>
              <div class="d-flex justify-content-between align-items-center text-monospace mb-2">
                <span>Partnership:</span>
                <span id="up_9">{{user.partnership | formatBalanceShort}}</span>
                <b-tooltip target="up_9" custom-class="__tooltip" >{{user.partnership | formatBalance}}</b-tooltip>                
              </div>
            </div>
          </li>  
        </ul>  
        <ul class="list-group __list_group">          
          <li class="list-group-item __list_item">
            <div class="__blue_text">Pending withdrawal:</div>
            <div class="__card_list d-flex justify-content-end">          
              <div class="__card_block  __img_button __shadow_filter ">
                <img src="/img/game_coin_flip.svg" height="30" alt="Game image">
              </div>
              <div class="__card_block  __img_button __shadow_filter ">
                <img src="/img/game_shake_hands.svg" height="30" alt="Game image">
              </div>
              <div class="__card_block  __img_button __shadow_filter ">
                <img src="/img/game_coin_flip.svg" height="30" alt="Game image">
              </div>
              <div class="__card_block  __img_button __shadow_filter ">
                <img src="/img/game_shake_hands.svg" height="30" alt="Game image">
              </div>                           
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
    computed: {
      totalOutChange() { 
        if (this.user && this.user.totalIn && this.user.totalOut) {
          if (this.user.totalIn.eq(this.user.totalOut)) return null
          return this.user.totalIn.gt(this.user.totalOut) ? 'down' : 'up'
        }
        return null
      },
    },
    i18n: {
      messages: {
        en: {
          profile: 'Profile',
        },
        ch: {
          profile: '輪廓',
        },  
      }      
    } 
  }
</script>

