<!-- Gameplay FAQ Stats Modal -->
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
  name: "GameFAQStatsModal",
  computed: { accordionList() { return this.$i18n.messages[this.$i18n.locale].qa } },
  components: { Modal, ModalAccordion },
  data () { return { modalId: 'GameFAQStatsModal' } },
  mounted () { this.$eventBus.$on('game-faq-stats-modal::open', this.open) },
  beforeDestroy () { this.$eventBus.$off('game-faq-stats-modal::open') },
  methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
  i18n: {
    messages: {
      en: {
        title: 'Staking FAQ',
        info: ' ',
        qa: [
          {
            q: 'Why should I stake?',
            a: 'When staking PMC tokens you receive rewards from other games being played. Every time the creator finishes game staking pool is replenished and you can withdraw additional crypto amount.  PMC tokens allow user to HODL them or get additional rewards.',
          },
          {
            q: 'What is PMC token?',
            a: 'PMC token is ERC-20 token (or respectful standard on other Blockchain) that was developed for tracking user’s portion in staking pool. It has no financial value and does not suppose to be security token.',
          },
          {
            q: 'How to get PMC tokens?',
            a: 'PMC tokens are distributed as bonuses only. The first way to receive them is to become game creator and finish game as a winner. Second way is to be game participant when game is finished by timeout. The third way is to be lucky enough to get tokens when they are randomly distributed when game creator withdraws his PMC tokens. Read more about PMC tokens in footer FAQ.',
          },
          {
            q: 'How to stake PMC tokens?',
            a: 'After user receives PMC tokens he can use them to get rewards from other players. User should set amount of PMC tokens he wants to stake and stake them. Tokens should be approved for staking Smart Contract (corresponding button will be shown).',
          },
          {
            q: 'When can I withdraw my pending reward?',
            a: 'Anytime.',
          },
          {
            q: 'When can I unstake PMC tokens?',
            a: 'Anytime.',
          },
          {
            q: 'What happens with PMC tokens after they are staken?',
            a: 'Tokens are kept in staking Smart Contract. They are used to determine user’s share of staking pool.',
          },
        ]
      },
    }
  }
};

</script>