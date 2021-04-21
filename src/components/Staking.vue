<template>
  <div class="__content-block __cb_white h-100">
    <h3>{{ $t('staking') }}</h3>
    <!-- Available to stake -->
    <div class="__text_line">
      <span>{{ $t('available_to_stake') }}</span>
      <div class="__img_value_block">
        <img src="/img/logo.svg" height="25"  width="25" alt="ETH">
        <span id="staking_1">{{gUser.balancePMC | formatBalanceShort}}</span>
        <b-tooltip target="staking_1" custom-class="__tooltip" >{{gUser.balancePMC | formatBalance}}</b-tooltip>
      </div>
    </div>
    <!-- Add stake -->
    <div class="__text_line">
      <span>{{ $t('add_stake') }}</span>
      <input type="number" min="0" step="0.01"  class="form-control w-25" v-model="addStakeAmount" placeholder="0.12345">
      <button type="button" class="btn btn-primary __orange_outline_button" :disabled="maxStakeDisabled" @click="setMaxPMCStake()">{{ $t('max') }}</button> 
      <button type="button" class="btn btn-primary __blue_button" v-if="addStakeAllowed" :disabled="addStakeDisabled" @click="addStake()">{{ $t('add') }}</button>
      <button type="button" class="btn btn-primary __blue_button" v-if="!addStakeAllowed" :disabled="approvePMCDisabled" @click="approvePMC()">{{ $t('approve') }}</button>
    </div>
    <!-- Available to withdraw -->
    <div class="__text_line">
      <span>{{ $t('available_to_withdraw') }}</span>
      <div class="__img_value_block">
        <img :src="gCurrentNetworkIcon" height="25"  width="25" alt="ETH">
        <span id="staking_2">{{gUser.stakingData.calculateRewardAndStartReplenishmentIdxReward | formatBalanceShort}}</span>
        <b-tooltip target="staking_2" custom-class="__tooltip" >{{gUser.stakingData.calculateRewardAndStartReplenishmentIdxReward | formatBalance}}</b-tooltip>  
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
    watch: {
      userAccount() {
        this.addStakeAmount = null
      }
    },
    computed: {
      userAccount() { return this.gUser.accountAddress },
      addStakeAllowed() { 
        if (!this.gUser.pmcAllowance ) return false
        if (this.gUser.pmcAllowance.eq(0) ) return false
        // if (this.addStakeAmount && ethers.utils.parseEther(this.addStakeAmount).lte(0) && this.gUser.pmcAllowance.gte(ethers.utils.parseEther(this.addStakeAmount)) ) return false   
        return true  
      },
      addStakeDisabled() { 
        try {
          if (!this.addStakeAmount) return true
          if (ethers.utils.parseEther(this.addStakeAmount).lte(0)) return true
          if (this.gUser.balancePMC.lt(ethers.utils.parseEther(this.addStakeAmount))) return true
          return false 
        } catch (error) {
          return true;
        }
      },
      approvePMCDisabled() {
        if (!this.addStakeAllowed) {
          try {
            if (!this.addStakeAmount) return true
            if (ethers.utils.parseEther(this.addStakeAmount).lte(0)) return true
            if (this.gUser.balancePMC.lt(ethers.utils.parseEther(this.addStakeAmount))) return true
            return false 
          } catch (error) {
            return true;
          }
        }

        return true;
      },
      maxStakeDisabled() { 
        if (!this.gUser.balancePMC || this.gUser.balancePMC.eq(0)) return true
        return false  
      },
      withdrawDisabled() { 
        if (!this.gUser.stakingData.calculateRewardAndStartReplenishmentIdxReward ) return true
        if (this.gUser.stakingData.calculateRewardAndStartReplenishmentIdxReward.eq(0) ) return true    
        return false  
      }
    },
    methods: {
      approvePMC() {
        this.$store.dispatch('user/APPROVE_PCM_STAKE')  
      },
      addStake() {
        try {
          this.$store.dispatch('user/ADD_STAKE', ethers.utils.parseEther(this.addStakeAmount));
        } catch(error) {
          this.$store.dispatch('notification/OPEN', {
            id: 'ERROR',
            data: `Error: wrong value to stake.`,
            delay: 5
          }, {
            root: true
          })
        }
      },
      setMaxPMCStake() {
        this.addStakeAmount = ethers.utils.formatEther(this.gUser.balancePMC.toString()).toString();
      },
    },
    i18n: {
      messages: {
        en: {
          staking: 'Staking',
          available_to_stake: 'Available to stake:',
          add_stake: 'Add stake:',
          max: 'MAX',
          add: 'Stake',
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