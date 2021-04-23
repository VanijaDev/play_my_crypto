<!-- How To Govern Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')">
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
        <span class="paragraph_padding">{{ $t('p1') }}</span><br>
        <span class="paragraph_padding">{{ $t('p2') }}</span><br>
        <span class="paragraph_padding">{{ $t('p3') }}</span><br>
        <span class="paragraph_padding">{{ $t('p4') }}</span><br>
    </template>
  </Modal>
</template>

<script>
  import Modal from './Modal';
  //import ModalAccordion from './ModalAccordion';
  export default {
    name: "HowToGovernModal",
    //computed: { accordionList() { return this.$i18n.messages[this.$i18n.locale].qa } },
    components: { Modal },  //, ModalAccordion
    data () { return { modalId: 'HowToGovernModal' } },    
    mounted () { this.$eventBus.$on('how-to-govern-modal::open', this.open) },
    beforeDestroy () { this.$eventBus.$off('how-to-govern-modal::open') },
    methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
    i18n: {
      messages: {
        en: {
          title: 'How to govern?',
          info: ' ',
          p1: 'Play My Crypto is a community - driven platform. Players owning PMC tokens can participate in updating some of the properties of the games on the platform. There are three variables that can be changed by the governance community.',
          p2: 'First one is game duration. Initially maximum game duration is set to 24 hours. If community decides for more appropriate duration, let it be so.',
          p3: 'Second variable is a minimum crypto amount to start or participate in the game. Crypto price may change, so community has ability to update this crypto amount variable if needed.',
          p4: 'Thirdly, other tokens can be used to play with. Play My Crypto is launched with support of two Blockchains and respectful crypto: Ethereum (ETH), Binance Smart Chain (BNB). Player can vote to add more tokens to be used for game play.'
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