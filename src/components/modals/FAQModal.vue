<!-- FAQ Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')"> 
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
      <ModalAccordion :list="accordionList"/>
    </template>
  </Modal> 
</template>

<script>
  import Modal from './Modal';
  import ModalAccordion from './ModalAccordion';
  export default {
    name: "FAQModal",
    computed: { accordionList() { return this.$i18n.messages[this.$i18n.locale].qa } },
    components: { Modal, ModalAccordion },
    data () { return { modalId: 'FAQModal' } },
    mounted () { this.$eventBus.$on('faq-modal::open', this.open) },
    beforeDestroy () { this.$eventBus.$off('faq-modal::open') },
    methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
    i18n: {
      messages: {
        en: {
          title: 'FAQ',
          info: ' ',
          qa: [
            {
              q: 'What crypto can be used to play?',
              a: 'We start with ETH and BSC. More crypto and Blockchains are coming in future.',
            },
            {
              q: 'What is PMC token?',
              a: 'PMC tokens are used for governance and staking. Play My Crypto is a community-driven platform and community can update critical parameters (e.g. maximum game duration, minimum crypto amount to participate in game, add more tokens to use for playing). Also players can transfer their tokens to the staking pool and receive rewards based on staking share. Staking pool is replenished every time the game is finished by the creator.',
            },
            {
              q: 'How to get PMC tokens?',
              a: 'Players can get PMC tokens as bonus only. If player creates game and finishes it as a winner, then 1% of his winner’s reward for that game is added as PMC token bonus. Also if game is finished by timeout, creator’s crypto is distributed among the participants. In this case each of the participants additionally receives 1% of reward in PMC tokens. ',
            },
            {
              q: 'How staking pool is replenished?',
              a: '1% of every gameplay reward withdrawal is used for staking pool replenishment. Staking pool is replenished with that amount every time the game is finished by creator.',
            },
            {
              q: 'What happens if game is out of time?',
              a: 'If there are no participants, then crypto sent by creator is added to the next created game. In case there are participants, creator’s crypto will be equally distributed among them.',
            },
            {
              q: 'How gameplay reward is distributed?',
              a: 'Imagine player won a reward which is 100%.<br>   &nbsp;&nbsp;&nbsp;95% goes to the player as a winner.<br>   &nbsp;&nbsp;&nbsp;1% goes to referral address used by the player when joining the game. Development team’s address is used if referral address is not provided.<br>   &nbsp;&nbsp;&nbsp;1% goes to the raffle pool. Raffle is being run every time the game is finished by creator.<br>   &nbsp;&nbsp;&nbsp;1% goes to Play My Crypto partner. Read more in “Partnership”. It is not deducted if there is no partner at the time when user withdraws.<br>   &nbsp;&nbsp;&nbsp;1% goes to the staking pool.<br>   &nbsp;&nbsp;&nbsp;1% goes to the development team.',
            },
            {
              q: 'What are the six ways to get reward on Play My Crypto?',
              a: 'There are active and passive rewards on Play My Crypto platform.<br>   &nbsp;&nbsp;&nbsp;1. Play games and become winner. Winner receives 95% of his reward and 5% are distributed for other rewards (active reward).<br>   &nbsp;&nbsp;&nbsp;2. Get reward when your address is used as referral. Your address can be used as “referral address” by the other player. If that player wins, 1% of his reward goes to you (passive reward).<br>   &nbsp;&nbsp;&nbsp;3. Every time when the game is finished by creator, raffle runs and winner gets jackpot. User becomes raffle participant after he withdraws his gameplay reward. Raffle is being run every time the game is finished by creator (passive reward).<br>   &nbsp;&nbsp;&nbsp;4. Become our partner to receive 1% of every gameplay reward withdrawal (active reward).<br>   &nbsp;&nbsp;&nbsp;5. Stake PMC tokens to get rewards. When withdrawing gameplay reward another 1% is sent to staking pool. The more PMC tokens you stake, the more pool share you get (passive reward).<br>   &nbsp;&nbsp;&nbsp;6. Player receives PMC tokens as bonus in two cases. First one is when player creates game and wins reward. Second one when player joins ongoing game, but it was finished by timeout. During gameplay withdrawal player receives 1/4 of that PMC tokens. Other 3/4 are distributed among three random raffle participants. In case there are less than 3 players, unused PMC tokens are not minted (passive reward).',
            }, {
              q: 'What are the Smart Contract addresses?',
              a: 'PMC Token<br>   &nbsp;&nbsp;&nbsp;ETH: <br>   &nbsp;&nbsp;&nbsp;BSC:<br>   CoinFlip<br>   &nbsp;&nbsp;&nbsp;ETH:<br>   &nbsp;&nbsp;&nbsp;BSC:',
            },
          ]
        },
      }
    }
  }
</script>

<style lang="scss" scoped>
  //@import '@/assets/css/variables.scss';
</style>