<template>
  <div class="__content-block __cb_white h-100">
    <h3>Staking</h3>
    <!-- Available to stake -->
    <div class="__text_line">
      <span>Available to stake:</span>
      <div class="__img_value_block">
        <img src="/img/logo.svg" height="30"  width="30" alt="ETH">
        <span id="staking_1">{{user.balancePMC | formatBalanceShort}}</span>
        <b-tooltip target="staking_1" custom-class="__tooltip" >{{user.balancePMC | formatBalance}}</b-tooltip>  
      </div>              
    </div>
    <!-- Add stake -->
    <div class="__text_line">
      <span>Add stake:</span>
      <input type="number" min="0" :max="user.balancePMC | formatBalance" class="form-control w-25" v-model="addStakeAmount" placeholder="0.12345">

      <button type="button" class="btn btn-primary __orange_outline_button" :disabled="maxStakeDisabled">MAX</button> 
      <button type="button" class="btn btn-primary __blue_button" v-if="addStakeAllowed" @click="addStake()" :disabled="addStakeDisabled">Add</button>     
      <button type="button" class="btn btn-primary __blue_button" v-if="!addStakeAllowed" @click="approvePcm()">Approve</button>                
    </div>  
    <!-- Available to withdraw -->
    <div class="__text_line">
      <span>Available to withdraw:</span>
      <div class="__img_value_block">
        <img :src="currentNetworkIcon" height="30"  width="30" alt="ETH">
        <span id="staking_2">{{user.stakingData.calculateRewardAndStartIncomeIdxReward | formatBalanceShort}}</span>
        <b-tooltip target="staking_2" custom-class="__tooltip" >{{user.stakingData.calculateRewardAndStartIncomeIdxReward | formatBalance}}</b-tooltip>  
      </div>
      <button type="button" class="btn btn-primary __blue_button ml-2" :disabled="withdrawDisabled">Withdraw</button>
                       
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
        if (!this.user.pmcAllowance ) return false        
        if (this.user.pmcAllowance.eq(0) ) return false
        if (this.addStakeAmount && ethers.utils.parseEther(this.addStakeAmount).lte(0) && this.user.pmcAllowance.gte(ethers.utils.parseEther(this.addStakeAmount)) ) return false   
        return true  
      },
      addStakeDisabled() { 
        if (!this.addStakeAmount) return true
        if (ethers.utils.parseEther(this.addStakeAmount).lte(0)) return true
        if (this.user.balancePMC.lt(ethers.utils.parseEther(this.addStakeAmount))) return true        
        return false  
      },
      maxStakeDisabled() { 
        if (!this.addStakeAmount) return true
        //console.log('addStakeAmount', ethers.utils.parseEther(this.addStakeAmount).toString()) 
        //console.log('pmcAllowance  ', this.user.pmcAllowance.toString())
        if (!this.user.balancePMC) return true
        if (this.user.balancePMC.eq(0)) return true
        return false  
      },
      withdrawDisabled() { 
        if (!this.user.stakingData.calculateRewardAndStartIncomeIdxReward ) return true
        if (this.user.stakingData.calculateRewardAndStartIncomeIdxReward.eq(0) ) return true    
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
        this.addStakeAmount = this.user.balancePMC
      },
    }
  }
</script>

<style lang="scss" scoped>  
  
</style>