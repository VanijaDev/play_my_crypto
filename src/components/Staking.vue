<template>
  <div class="__content-block __cb_white h-100">
    <h3>Staking</h3>
    <!-- Available to stake -->
    <div class="__text_line">
      <span>Available to stake:</span>
      <div class="__img_value_block">
        <img src="/img/logo.svg" height="30"  width="30" alt="ETH">
        <span id="staking_1">{{user.balance.PMC | formatBalanceShort}}</span>
        <b-tooltip target="staking_1" custom-class="__tooltip" >{{user.balance.PMC | formatBalance}}</b-tooltip>  
      </div>              
    </div>
    <!-- Add stake -->
    <div class="__text_line">
      <span>Add stake:</span>
      <input type="text" class="form-control w-25"  placeholder="0.12345">

      <button type="button" class="btn btn-primary __orange_outline_button">MAX</button> 
      <button type="button" class="btn btn-primary __blue_button">Add</button>                    
    </div>  
    <!-- Available to withdraw -->
    <div class="__text_line">
      <span>Available to withdraw:</span>
      <div class="__img_value_block">
        <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
        <span id="staking_2">{{user.stakingToWithdraw | formatBalanceShort}}</span>
        <b-tooltip target="staking_2" custom-class="__tooltip" >{{user.stakingToWithdraw | formatBalance}}</b-tooltip>  
      </div>
      <button type="button" class="btn btn-primary __blue_button ml-2">Withdraw</button>
                       
    </div>               
  </div>
</template>

<script>
  export default {
    name: 'Staking',  
  }
</script>

<style lang="scss" scoped>  
  
</style>