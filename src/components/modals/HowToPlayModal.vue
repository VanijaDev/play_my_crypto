<!-- How To Play Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')">
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
        <span class="paragraph_padding">{{ $t('p1') }}</span><br>
        <span class="paragraph_padding">{{ $t('p2') }}</span><br>
        <span class="paragraph_padding">{{ $t('p3') }}</span><br>
        <span class="paragraph_padding">{{ $t('p4') }}</span><br>
        <span class="paragraph_padding">{{ $t('p5') }}</span><br>
        <span class="paragraph_padding">{{ $t('p6') }}</span><br>
        <span class="paragraph_padding">{{ $t('p7') }}</span><br>
        <span class="paragraph_padding">{{ $t('p8') }}</span><br>

      <!--ModalAccordion :list="accordionList"/-->
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
  name: "HowToPlayModal",
  //computed: { accordionList() { return this.$i18n.messages[this.$i18n.locale].qa } },
  components: { Modal},  //, ModalAccordion
  data () { return { modalId: 'HowToPlayModal' } },
  mounted () { this.$eventBus.$on('how-to-play-modal::open', this.open) },
  beforeDestroy () { this.$eventBus.$off('how-to-play-modal::open') },
  methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
  i18n: {
    messages: {
      en: {
        title: 'How to play?',
        info: ' ',
        p1: 'To Start a new game user must:',
        p2: '1. select coin side',
        p3: '2. set crypto amount',
        p4: '3. input random string that will be used for hashing coin side prediction; optionally user can set referral address that will receive 1% of user’s reward in case of winning',
        p5: 'If user wants to Join ongoing game, he must have corresponding amount of crypto on his balance and select the coin side. The same rules apply to optional referral address.',
        p6: 'When participating in ongoing game users can see selected values and game statistics.',
        p7: 'Game creator must Finish ongoing game within 24h period after the game was started. Result screen will be shown to all of the participants.',
        p8: 'In case ongoing game is not finished by creator within 24h it is impossible to join or finish it. A new game should be created. In case there are players who joined that game, they become winners and game creator loses. Creator’s crypto amount is distributed equally among winners as a reward. If there are no players except game creator, anyone can start new game and crypto amount from the timeout game will be added to the next game’s crypto amount.'
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