<!-- Governance FAQ Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')"> 
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
      <ModalAccordion :list="accordionList"/>       
    </template>    
  </Modal> 
</template> 

<style lang="scss" scoped>
  //@import '@/assets/css/variables.scss';   
</style>

<script>
import Modal from './Modal';
import ModalAccordion from './ModalAccordion';
export default {
  name: "GovernanceFAQModal",
  computed: { accordionList() { return this.$i18n.messages[this.$i18n.locale].qa } },
  components: { Modal, ModalAccordion },  
  data () { return { modalId: 'GovernanceFAQModal' } },    
  mounted () { this.$eventBus.$on('governance-faq-modal::open', this.open) },  
  beforeDestroy () { this.$eventBus.$off('governance-faq-modal::open') },
  methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
  i18n: {
    messages: {
      en: {
        title: 'Governance FAQ',
        info: ' ',
        qa: [
          {
            q: 'Why should I participate in governance?',
            a: ' Play My Crypto is a community - driven platform, so community may update it to fit their needs. If you think that you as creator can get more rewards increasing or decreasing your game duration, please make proposal to update this property. In case of crypto price changes drastically and it is uncomfortable for you, create a proposal to update it. Maybe you want to play for some mass adopted token? Go on and suggest to add it.',
          },
          {
            q: 'How can vote for proposals?',
            a: 'Anyone who owns PMC tokens can stake them for proposal.',
          },
          {
            q: 'How can I create a proposal?',
            a: ' Users are able to select one of the predefined proposals and update values.',
          },
          {
            q: 'How proposal gets accepted?',
            a: 'PMC tokens are being used for voting. As soon as there is enough PMC tokens for particular proposal it gets automatically applied by the Smart Contract.',
          },
          {
            q: 'What happens to PMC tokens after they are staken on proposal?',
            a: 'Smart Contract keeps PMC tokens for each proposal. User can unstake his tokens whenever he wants. Tokens can be withdrawn by owners after proposal is accepted.',
          }
        ]
      },
    }
  }
};

</script>