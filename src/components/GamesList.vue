<template>
  <div class="h-100 __games_list">
    <h2>Games</h2>

    <div class="w-100 __list d-flex">      
      
      
      <div class="__game_card __selected __img_button __shadow_filter">
        <div class="__game_image __gradient_violet">
          <img src="/img/game_coin_flip.svg" height="110" alt="Game image">
        </div>
        <div class="__info">
          <div class="__participiants">
            <div>Participants:</div>
            <div class="text-monospace"> 98</div>  
          </div>
          <div class="__in">
            <img src="/img/ethereum_icon.svg" height="20" alt="ETH">
            <div>
              <div>In:</div>
              <div class="text-monospace">0.12345</div>  
            </div>              
          </div> 
        </div>
      </div>

      <div class="__game_card">
        <div class="__game_image">
          <img src="/img/no_game.png" alt="Game image">
        </div>  
        <div class="__info">
          <span class="__orange_text">NEW GAME</span>
          <span class="text-truncate">Coming soon...</span>          
        </div>
        <div class="__corner"></div>
      </div>

      <div class="__game_card"  v-if="!breakPoint('xs')">
        <div class="__game_image">
          <img src="/img/no_game.png" alt="Game image">
        </div>  
        <div class="__info">
          <span class="__orange_text">NEW GAME</span>
          <span class="text-truncate">Coming soon...</span>          
        </div>
        <div class="__corner"></div>
      </div>

      <div class="__game_card" v-if="breakPoint('xl', 'gte')">
        <div class="__game_image">
          <img src="/img/no_game.png" alt="Game image">
        </div>  
        <div class="__info">
          <span class="__orange_text">NEW GAME</span>
          <span class="text-truncate">Coming soon...</span>          
        </div>
        <div class="__corner"></div>
      </div>      
    </div>
      
  </div>
</template>

<style lang="scss" scoped>  
  @import '@/assets/css/variables.scss';
  .__games_list {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    h2{
      text-align: center;
      line-height: 1;
      font-weight: 700;
    }
    .__list {
      //overflow-y: auto;
      //&::-webkit-scrollbar { 
      //  height: 10px;         
      //}
      //&::-webkit-scrollbar-track { 
      //  background: #2e458229; 
      //  border: 0px solid transparent;
      //  border-radius: 4px;
      //}
      //&::-webkit-scrollbar-thumb { 
      //  background: #466ac5; 
      //  border: 0px solid transparent;
      //  border-radius: 4px;        
      //}
      //&::-webkit-scrollbar-thumb:hover { background: #304886; }         
      .__game_card {
        margin-right: 1rem;
        &:last-child{
          margin-right: 0;
        }
        box-sizing: border-box;
        position: relative;
        height: 160px;
        width: 100%;        
        background-color: $_white;
        padding: .4em;
        padding-bottom: 0;
        border-radius: $_content_block_border_radius;
        overflow: hidden;
        .__corner {
          position: absolute;          
          bottom: 0;
          left: 0;
          width :0px;
          height:0px;
          border-left: 0px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 10px solid $_orange;
          border-top: 10px solid transparent;
          overflow: hidden;          
        }
        .__game_image {
          border-radius: ($_content_block_border_radius - .2);          
          width: 100%;
          height: 118px;
          overflow: hidden;
          img{
            border-radius: ($_content_block_border_radius - .2);  
          }  
        }        
        &:not(.__selected) {
          .__game_image {            
            img{              
              object-fit: cover;
              overflow: hidden;   
              width: 100%;           
            }  
          }
        }        
        &.__selected {          
          .__game_image {
             
            img {
              padding: .5rem;
              width: 100%;
              height: 100%;
            }       
          }
          .__corner {            
            border-bottom: 10px solid $_blue;            
          }
        } 
        .__info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: .75rem;
          height: 2.5rem;
          white-space: nowrap;
          .__participiants, .__in {
            line-height: .9rem;
            font-weight: 700;
            div:first-child {
              color: $_blue;
            }            
          }
          .__participiants{
            padding-left: .1rem;
          }
          .__in {
            display: flex;
            align-items: center;
            img {
              margin-right: .3rem;
            }
          }
        }        
      }  
    }    
  }
</style>

<script>
  export default {
    name: 'GamesList',  
  }
</script>

