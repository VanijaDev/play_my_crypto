<!-- Privacy Policy Modal -->
<template>
  <Modal size="lg" :id="modalId" :title="$t('title')"> 
    <template v-slot:content>
      <p class="__info">{{ $t('info') }}</p>
      <p>{{ $t('p1') }}</p>            
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
          info: 'This is Privacy Policy',  
          p1: 'Lorem ipsum is a pseudo-Latin text used in web design, typography, layout, and printing in place of English to emphasise design elements over content. It`s also called placeholder (or filler) text. It`s a convenient tool for mock-ups. It helps to outline the visual elements of a document or presentation, eg typography, font, or layout. Lorem ipsum is mostly a part of a Latin text by the classical author and philosopher Cicero. Its words and letters have been changed by addition or removal, so to deliberately render its content nonsensical; it`s not genuine, correct, or comprehensible Latin anymore. While lorem ipsum`s still resembles classical Latin, it actually has no meaning whatsoever. As Cicero`s text doesn`t contain the letters K, W, or Z, alien to latin, these, and others are often inserted randomly to mimic the typographic appearence of European languages, as are digraphs not to be found in the original.'      
        },         
      }      
    } 
  }
</script>

<style lang="scss" scoped>
  //@import '@/assets/css/variables.scss';   
</style>