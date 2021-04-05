<template>
  <div class="__content-block __cb_white h-100">
    <h3>{{ $t('staking') }}</h3>
    <!-- Available to stake -->
    <div class="__text_line">
      <span>{{ $t('available_to_stake') }}</span>
      <div class="__img_value_block">
        <img src="/img/logo.svg" height="30"  width="30" alt="ETH">
        <span id="staking_1">{{gUser.balancePMC | formatBalanceShort}}</span>
        <b-tooltip target="staking_1" custom-class="__tooltip" >{{gUser.balancePMC | formatBalance}}</b-tooltip>  
      </div>              
    </div>
    <!-- Add stake -->
    <div class="__text_line">
      <span>{{ $t('add_stake') }}</span>
      <input type="number" min="0" :max="gUser.balancePMC | formatBalance" class="form-control w-25" v-model="addStakeAmount" placeholder="0.12345">
      <button type="button" class="btn btn-primary __orange_outline_button" :disabled="maxStakeDisabled">{{ $t('max') }}</button> 
      <button type="button" class="btn btn-primary __blue_button" v-if="addStakeAllowed" @click="addStake()" :disabled="addStakeDisabled">{{ $t('add') }}</button>     
      <button type="button" class="btn btn-primary __blue_button" v-if="!addStakeAllowed" @click="approvePcm()">{{ $t('approve') }}</button>                
    </div>  
    <!-- Available to withdraw -->
    <div class="__text_line">
      <span>{{ $t('available_to_withdraw') }}</span>
      <div class="__img_value_block">
        <img :src="gCurrentNetworkIcon" height="30"  width="30" alt="ETH">
        <span id="staking_2">{{gUser.stakingData.calculateRewardAndStartIncomeIdxReward | formatBalanceShort}}</span>
        <b-tooltip target="staking_2" custom-class="__tooltip" >{{gUser.stakingData.calculateRewardAndStartIncomeIdxReward | formatBalance}}</b-tooltip>  
      </div>
      <button type="button" class="btn btn-primary __blue_button ml-2" :disabled="withdrawDisabled">{{ $t('withdraw') }}</button>
                       
    </div>               
  </div>
</template>

<script>
import { ethers, BigNumber } from "ethers";
  export default {
    name: 'Staking', 
    data: () => ({
      addStakeAmount: null,      
    }), 
    computed: {
      addStakeAllowed() { 
        if (!this.gUser.pmcAllowance ) return false        
        if (this.gUser.pmcAllowance.eq(0) ) return false
        if (this.addStakeAmount && ethers.utils.parseEther(this.addStakeAmount).lte(0) && this.gUser.pmcAllowance.gte(ethers.utils.parseEther(this.addStakeAmount)) ) return false   
        return true  
      },
      addStakeDisabled() { 
        if (!this.addStakeAmount) return true
        if (ethers.utils.parseEther(this.addStakeAmount).lte(0)) return true
        if (this.gUser.balancePMC.lt(ethers.utils.parseEther(this.addStakeAmount))) return true        
        return false  
      },
      maxStakeDisabled() { 
        if (!this.addStakeAmount) return true
        if (!this.gUser.balancePMC) return true
        if (this.gUser.balancePMC.eq(0)) return true
        return false  
      },
      withdrawDisabled() { 
        if (!this.gUser.stakingData.calculateRewardAndStartIncomeIdxReward ) return true
        if (this.gUser.stakingData.calculateRewardAndStartIncomeIdxReward.eq(0) ) return true    
        return false  
      },  
    },
    methods: {
      approvePcm() {
        this.$store.dispatch('user/APPROVE_PCM_STAKE')  
      },
      addStake() {
        this.$store.dispatch('user/ADD_STAKE', this.addStakeAmount)  
      },
      setMaxStake() {
        this.addStakeAmount = this.gUser.balancePMC
      },
    },
    i18n: {
      messages: {
        en: {
          staking: 'Staking',
          available_to_stake: 'Available to stake:',
          add_stake: 'Add stake:',          
          max: 'MAX',
          add: 'Add',
          approve: 'Approve',    
          available_to_withdraw: 'Available to withdraw:',      
          withdraw: 'Withdraw',     
        },          
      }      
    }
  }
</script>

<style lang="scss" scoped>  
  
</style>