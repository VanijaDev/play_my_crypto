<template>
  <div class="__content-block __cb_white  h-100 d-flex flex-column justify-content-between __cb_inactive">
    <div>
      <h3>{{ $t('stats') }}</h3>
      <!-- Active proposals -->
      <div class="__text_line">
        <span>{{ $t('active_proposals') }}</span>                    
      </div>
      <!-- Update min stake -->
      <div class="__text_line">
        <span>{{ $t('update_min_stake') }}</span>                    
      </div>
      <!-- Update max duration -->
      <div class="__text_line">
        <span>{{ $t('update_max_duration') }}</span>                    
      </div>
      <!-- Add token to play -->
      <div class="__text_line">
        <span>{{ $t('add_token_to_play') }}</span>                    
      </div>
    </div>

    <!-- Info -->
    <div class="__text_line mt-2">
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('how-to-govern-modal::open')">{{ $t('how_to_govern') }}</a>
      <a href="" class="h3 __info_link" @click.prevent="$eventBus.$emit('governance-faq-modal::open')">{{ $t('governance_faq') }}</a>      
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
    i18n: {
      messages: {
        en: {
          stats: 'Stats',
          active_proposals: 'Active proposals:',
          update_min_stake: 'Update min stake:',          
          update_max_duration: 'Update max duration:',
          add_token_to_play: 'Add token to play:',          
          how_to_govern: 'How to Govern?',
          governance_faq: 'Governance FAQ',
        },          
      }      
    }
  }
</script>

<style lang="scss" scoped>  
  
</style>