<!-- Game FAQ Stats Modal -->
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
        title: 'Game FAQ Stats',
        info: 'This is Game FAQ Stats',
        qa: [
          {
            q: 'How does it work?',
            a: 'But I really must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.',
          },
          {
            q: 'Can I stake?',
            a: 'Lorem ipsum is a pseudo-Latin text used in web design, typography, layout, and printing in place of English to emphasise design elements over content. It`s also called placeholder (or filler) text.',
          },
          {
            q: 'How does it work?',
            a: 'But I really must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.',
          },          
          {
            q: 'Can I stake?',
            a: 'Lorem ipsum is a pseudo-Latin text used in web design, typography, layout, and printing in place of English to emphasise design elements over content. It`s also called placeholder (or filler) text.',
          },
          {
            q: 'How does it work?',
            a: 'But I really must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.',
          },
          {
            q: 'Can I stake?',
            a: 'Lorem ipsum is a pseudo-Latin text used in web design, typography, layout, and printing in place of English to emphasise design elements over content. It`s also called placeholder (or filler) text.',
          },
          {
            q: 'How does it work?',
            a: 'But I really must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.',
          },
        ]
      },        
    }      
  }  
};

</script>