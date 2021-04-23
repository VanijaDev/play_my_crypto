<!-- Partnership Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')"> 
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
        <span class="paragraph_padding">{{ $t('p1') }}</span><br>
        <span class="paragraph_padding">{{ $t('p2') }}</span>
    </template>
  </Modal> 
</template> 

<script>
  import Modal from './Modal';
  //import ModalAccordion from './ModalAccordion';
  export default {
    name: "PartnershipModal",
    components: { Modal },
    data () { return { modalId: 'PartnershipModal' } },
    mounted () { this.$eventBus.$on('partnership-modal::open', this.open) },
    beforeDestroy () { this.$eventBus.$off('partnership-modal::open') },
    methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
    i18n: {
      messages: {
        en: {
          title: 'Partnership',
          info: ' ',
          p1: 'Anyone can became a partner of Play My Crypto and get benefit from collaboration. This can be blogger making a review of the project. This may be a website placing link to Play My Crypto. Advisor, reviewer, marketer or anyone who wants to assist with Play My Crypto mass adoption is able to use “THE MORE YOU PLAY THE MORE YOU WIN” block on Play My Crypto web site while partnership continues.',
          p2: 'The reward for our partner would be 1% of each gameplay withdrawal. Contact development team via Telegram or email.'
        },
      }
    }
  }
</script>

<style lang="scss" scoped>
  //@import '@/assets/css/variables.scss';
  .paragraph_padding {
    padding-left: 1em;
  }
</style>