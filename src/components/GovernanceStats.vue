<template>
  <div class="__content-block __cb_white  h-100 d-flex flex-column justify-content-between __cb_inactive">
    <div>
      <h3>Stats</h3>
      <!-- Active proposals -->
      <div class="__text_line">
        <span>Active proposals</span>                    
      </div>
      <!-- Update min stake -->
      <div class="__text_line">
        <span>Update min stake:</span>                    
      </div>
      <!-- Update max duration -->
      <div class="__text_line">
        <span>Update max duration:</span>                    
      </div>
      <!-- Add token to play -->
      <div class="__text_line">
        <span>Add token to play:</span>                    
      </div>
    </div>

    <!-- Info -->
    <div class="__text_line mt-2">
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('how-to-govern-modal::open')">How to Govern?</a>
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('governance-faq-modal::open')">Governance FAQ</a>      
    </div>

    <HowToGovernModal/>
    <GovernanceFAQModal/>
  </div> 
</template>

<script>  
  import HowToGovernModal from '@/components/modals/HowToGovernModal.vue';
  import GovernanceFAQModal from '@/components/modals/GovernanceFAQModal.vue';
  export default {
    name: 'GovernanceStats', 
    components: {
      HowToGovernModal, 
      GovernanceFAQModal
    }, 
  }
</script>

<style lang="scss" scoped>  
  
</style>