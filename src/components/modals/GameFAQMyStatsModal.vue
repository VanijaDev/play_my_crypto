<!-- Gameplay FAQ Gameplay Stats Modal -->
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
  name: "GameFAQMyStatsModal",
  computed: { accordionList() { return this.$i18n.messages[this.$i18n.locale].qa } },
  components: { Modal, ModalAccordion },  
  data () { return { modalId: 'GameFAQMyStatsModal' } },    
  mounted () { this.$eventBus.$on('game-faq-my-stats-modal::open', this.open) },  
  beforeDestroy () { this.$eventBus.$off('game-faq-my-stats-modal::open') },
  methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
  i18n: {
    messages: {
      en: {
        title: 'Gameplay FAQ',
        info: ' ',
        qa: [
          {
            q: 'Why should I play?',
            a: ' Spending time with Play My Crypto platform you have a chance to get 6 (six) sources of reward. Some of them requires your activity (like playing games), other are passive. Read FAQ in footer for more details.',
          },
          {
            q: 'What is the gameplay flow?',
            a: '1. Creator creates game with hashed coin side, crypto amount and referral address. <br> 2. Opponents can join ongoing game by selecting coin side and having enough crypto on account. <br> 3. Creator can finish game at any point of time within 24h period from the game start. For this creator must provide string used for hashing coin side when creating the game. Additionally he receives 1% of the reward in PMC tokens. <br> 4. In case creator does not finish game in time and there are no opponents joined, crypto amount from this game will be added to the next one. If there are opponents, they become winners and creator’s crypto amount is distributed among them. Additionally they receive 1% of the reward in PMC tokens.',
          },
          {
            q: 'How winners are determined?',
            a: 'Game creator selects coin side when creating the game. Opponents join this game and send their guesses of creator’s coin side. Creator becomes winner if there is at least one opponent who did not guess his coin side. Opponent becomes a winner if he guesses coin side the creator selected.',
          },
          {
            q: 'What is referral address?',
            a: 'In case a player wins game, 1% of his crypto reward goes to this address balance. The idea behind this is to popularize Play My Crypto platform, invite more users & make more wealth for our community members. You can ask other players to use your address as referral or put it on personal website, social media platform, etc. Developer’s team address will be used if player leaves it empty.',
          },
          {
            q: 'What is seed phrase?',
            a: 'Blockchain is public but coin side used by game creator must remain unknown until he finishes the game. Random string should be used for hashing coin side value before sending it to the Smart Contract. It is important to remember this string as it is used by creator when finishing ongoing game. You want to use random strings to prevent them from being guessed by other players.',
          },
          {
            q: 'What is Gameplay stats -  My in?',
            a: 'This is crypto amount sent by the player to start or join games.',
          },
          {
            q: 'What is Gameplay stats - My out?',
            a: 'This is crypto amount withdrawn by the player as rewards for the win.',
          },
          {
            q: 'What is Ongoing raffle - Jackpot?',
            a: 'This is crypto amount placed in the ongoing raffle. Read FAQ in footer for more details.',
          },
          {
            q: 'What is Ongoing raffle - Participants?',
            a: 'Participants count taking part in the ongoing raffle. Read FAQ in footer for more details.',
          },
          {
            q: 'What is Pending withdrawal - Pending PMC?',
            a: 'This is PMC token amount available for withdrawal after tokens are randomly distributed. Read more in Staking FAQ and footer FAQ.',
          },
          {
            q: 'What is Pending withdrawal - Gameplay?',
            a: 'This is crypto amount available for withdrawal as rewards for the win.',
          },
          {
            q: 'What is Pending withdrawal - Referral?',
            a: 'This is crypto amount that player can withdraw if his address is used as referral address by other player who won the game.',
          },
          {
            q: 'What is Pending withdrawal - Raffle?',
            a: 'This is crypto amount won by the player in raffles. Raffle runs after game creator finishes the game. Read FAQ in footer for more details.',
          },
        ]
      },
    }
  }
};

</script>