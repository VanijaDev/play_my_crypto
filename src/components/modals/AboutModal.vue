<!-- AboutModal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')"> 
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
      <p>
        <span class="paragraph_padding">{{ $t('p1') }}</span><br>
        <span class="paragraph_padding">{{ $t('p2') }}</span><br>
        <span class="paragraph_padding">{{ $t('p3') }}</span><br>
        <span class="paragraph_padding">{{ $t('p4') }}</span><br>
        <span class="paragraph_padding">{{ $t('p5') }}</span><br>
        <span class="paragraph_padding">{{ $t('p6') }}</span><br>
        <span class="paragraph_padding">{{ $t('p7') }}</span><br>
        <span class="paragraph_padding">{{ $t('p8') }}</span><br>
        <span class="paragraph_padding">{{ $t('p9') }}</span><br>
        <span class="paragraph_padding">{{ $t('p10') }}</span><br>
        <span class="paragraph_padding">{{ $t('p11') }}</span><br>
      </p>
    </template>
  </Modal> 
</template> 

<script>
  import Modal from './Modal';
  //import ModalAccordion from './ModalAccordion';
  export default {
    name: "AboutModal",
    components: { Modal },
    data () { return { modalId: 'AboutModal' } },
    mounted () { this.$eventBus.$on('about-modal::open', this.open) },
    beforeDestroy () { this.$eventBus.$off('about-modal::open') },
    methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
    i18n: {
      messages: {
        en: {
          title: 'About',
          info: ' ',
          p1: 'Play My Crypto is a community - driven platform for playing peer-to-peer games (p2p), having fun and getting rewards. Players play directly with each other through Smart Contracts. As everything is build on Blockchain, there is no middleman, no server, no third party service, no oracles or any other service that can be used for manipulation.',
          p2: 'Source code is public and verifiable via the Smart Contracts:',
          p3: 'Ethereum:',
          p4: 'BSC:',
          p5: 'Play My Crypto is fun, easy and effective way of spending time while getting rewards. There are 6 ways to be rewarded as platform participant:',
          p6: '1. Play games and become winner. Winner receives 95% of his reward and 5% are distributed for other rewards (active reward).',
          p7: '2. Get reward when your address is used as referral. Your address can be used as “referral address” by the other player. If that player wins, 1% of his reward goes to you (passive reward).',
          p8: '3. Every time when the game is finished by creator, raffle runs and winner gets jackpot. User becomes raffle participant after he withdraws his gameplay reward. Raffle is being run every time the game is finished by creator (passive reward).',
          p9: '4. Become our partner to receive 1% of every gameplay reward withdrawal (active reward).',
          p10: '5. Stake PMC tokens to get rewards. When withdrawing gameplay reward another 1% is sent to staking pool. The more PMC tokens you stake, the more pool share you get (passive reward).',
          p11: '6. Player receives PMC tokens as bonus in two cases. First one is when player creates game and wins reward. Second one when player joins ongoing game, but it was finished by timeout. During gameplay withdrawal player receives 1/4 of that PMC tokens. Other 3/4 are distributed among three random raffle participants. In case there are less than 3 players, unused PMC tokens are not minted.'
        },
      }
    } 
  }
</script>

<style lang="scss" scoped>
  .paragraph_padding {
    padding-left: 1em;
  }
  //@import '@/assets/css/variables.scss';
</style>