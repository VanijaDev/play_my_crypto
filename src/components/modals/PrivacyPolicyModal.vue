<!-- Privacy Policy Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')"> 
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
        <span class="bold">{{ $t('p1') }}</span><br>
        <span class="paragraph_padding">{{ $t('p2') }}</span><br>
        <span class="bold">{{ $t('p3') }}</span><br>
        <span class="paragraph_padding">{{ $t('p4') }}</span><br>
        <span class="bold">{{ $t('p5') }}</span><br>
        <span class="paragraph_padding">{{ $t('p6') }}</span><br>
        <span class="bold">{{ $t('p7') }}</span><br>
        <span class="paragraph_padding">{{ $t('p8') }}</span><br>
        <span class="paragraph_padding">{{ $t('p9') }}</span><br>
        <span class="paragraph_padding">{{ $t('p10') }}</span><br>
        <span class="paragraph_padding">{{ $t('p11') }}</span><br>
        <span class="paragraph_padding">{{ $t('p12') }}</span><br>
    </template>
  </Modal>
</template>

<script>
  import Modal from './Modal';
  //import ModalAccordion from './ModalAccordion';
  export default {
    name: "PrivacyPolicyModal",
    components: { Modal },
    data () { return { modalId: 'PrivacyPolicyModal' } },
    mounted () { this.$eventBus.$on('privacy-policy-modal::open', this.open) },
    beforeDestroy () { this.$eventBus.$off('privacy-policy-modal::open') },
    methods: { open() { this.$eventBus.$emit('modal::' + this.modalId + '::open') } },
    i18n: {
      messages: {
        en: {
          title: 'Privacy Policy',
          info: ' ',
          p1: 'Personal information',
          p2: 'We do not collect or share any of the player’s details. Players play directly with other players via Smart Contract without server interaction or any middleman.',
          p3: 'Internet Cookies & Statistics',
          p4: 'We do not store any cookies or make any tracking.',
          p5: 'Privacy Policy Modifications',
          p6: 'Play My Crypto is and will remain a peer-to-peer gaming platform.',
          p7: 'Use of site by children',
          p8: 'We do not provide services or market to children.',
          p9: 'The Service is not directed to persons under the age of 18. Users declare themselves to be adult according to their applicable legislation.',
          p10: 'We do not collect or analyze any data, thus we can not make any restrictions.',
          p11: 'We assume that all Visitors and Users have carefully read this privacy policy page, understand its contents and agree to the terms and conditions stated in the Privacy Policy above. If one does not agree with this Privacy Policy, they should refrain from using our website.',
          p12: 'Participating in playing games may be considered as online gambling and illegal in some jurisdictions. playmycrypto.com will not be held liable or responsible for any incurred financial loss as a result of any actions by users on our platform. By choosing to participate in playing games, you take sole responsibility to make sure that such activities or gambling is legal in your jurisdiction. We do not take responsibility for any of your actions. Participating in the activities on our platform should be a fun and safe but to do so you will need to set financial limits you can afford along with stay within these limits. Before you participate in such activities decide the amount of crypto along with the time scale you going to wait before you participate in playing games again. Most people can stay within these boundaries but some may find this problematic. If you feel your actions are getting out of control make sure to exclude yourself from using our help and seek professional help. The best way to deal with gaming or gambling problems is by talking to a friend or professional help association such as www.begambleaware.org which is a free resource to assist with addiction problems. You can do so by free phone call or by meeting with a professional face-to-face.'
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

  .bold {
    font-weight: bold;
  }
</style>