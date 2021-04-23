<!-- How To Stake Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')"> 
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
        <span class="paragraph_padding">{{ $t('p1') }}</span>
    </template>
  </Modal> 
</template> 

<style lang="scss" scoped>
  //@import '@/assets/css/variables.scss';   
</style>

<script>
import Modal from './Modal';
//import ModalAccordion from './ModalAccordion';
export default {
  name: "HowToStakeModal",
  //computed: { accordionList() { return this.$i18n.messages[this.$i18n.locale].qa } },
  components: { Modal },  //, ModalAccordion
  data () { return { modalId: 'HowToStakeModal' } },    
  mounted () { this.$eventBus.$on('how-to-stake-modal::open', this.open) },  
  beforeDestroy () { this.$eventBus.$off('how-to-stake-modal::open') },
  methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
  i18n: {
    messages: {
      en: {
        title: 'How to stake?',
        info: ' ',
        p1: ' Players receive PMC tokens as bonuses under certain conditions. They can stake PMC tokens to receive additional rewards. Tokens should be approved before they can be staken (corresponding button will be shown). After stake is made, total staken amount and player’s stake values are updated instantly. Player can unstake  his tokens or withdraw pending reward anytime. Read more about staking in Staking FAQ.'
      },
    }
  }
};

</script>

<style lang="scss" scoped>
  //@import '@/assets/css/variables.scss';
  .paragraph_padding {
    padding-left: 1em;
  }
</style>