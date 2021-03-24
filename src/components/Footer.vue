<template>
  <footer>
    <b-container class="">
      <b-row class="align-items-center">
        <b-col cols="12" lg="8">
          <div class="d-flex justify-content-between">
            <div class="d-none d-lg-block">
              <img src="/img/logo.svg" height="50" alt="Logo" >
            </div>
            <div class="d-flex flex-column mr-4">
              <a href="" @click.prevent="$eventBus.$emit('about-modal::open')">{{ $t('about') }}</a>  
              <a href="" @click.prevent="$eventBus.$emit('faq-modal::open')">{{ $t('faq') }}</a>  
            </div> 
            <div class="d-flex flex-column mr-4">
              <a href="" @click.prevent="$eventBus.$emit('privacy-policy-modal::open')">{{ $t('privacy_policy') }}</a>  
              <a href="" @click.prevent="$eventBus.$emit('partnership-modal::open')">{{ $t('partnership') }}</a>  
            </div>
            <div class="d-flex align-items-center">
              <div class="__strong-text mr-2 d-none d-md-block">
                {{ $t('contact_us') }}
              </div>
              <div class="__img_button">
                <img src="/img/telegram.svg" height="40" width="40" alt="Telegram logo"  class="__shadow_filter">
              </div>            
            </div>
          </div>
        </b-col>        
        <b-col cols="12" lg="4" class="mt-4 mt-lg-0" >
          <div class="d-flex  align-items-center" :class="breakPoint('lg', 'gte') ? 'justify-content-end': 'justify-content-center'">
            <img src="/img/logo.svg" height="30" alt="Logo" v-if="breakPoint('lg', 'lt')" class="mr-2">
            ©PlayMyCrypto.{{new Date().getFullYear()}}
          </div>
        </b-col>
      </b-row>            
    </b-container> 
    <AboutModal/>
    <FAQModal/>
    <PrivacyPolicyModal/>
    <PartnershipModal/>
  </footer>  
</template>

<style lang="scss" scoped>  
  @import '@/assets/css/variables.scss';
  footer{
    background: white;    
    box-shadow: 0 -0.1rem 0.5rem rgb(0 0 0 / 2%) !important;
    padding: 1rem;    
    font-size: 18px;
    font-weight: 500; 
  }
</style>

<script>
  import AboutModal from '@/components/modals/AboutModal.vue';
  import FAQModal from '@/components/modals/FAQModal.vue';
  import PrivacyPolicyModal from '@/components/modals/PrivacyPolicyModal.vue';
  import PartnershipModal from '@/components/modals/PartnershipModal.vue';
  
  export default {
    name: 'Footer', 
    components: { AboutModal, FAQModal, PrivacyPolicyModal, PartnershipModal }, 
    i18n: {
      messages: {
        en: {
          about: 'About',
          faq: 'FAQ',
          privacy_policy: 'Privacy Policy',
          partnership: 'Partnership',
          contact_us: 'Contact us:',
        },
        ch: {
          about: '關於',
          faq: '常問問題',
          privacy_policy: '隱私政策',
          partnership: '合夥',
          contact_us: '聯繫我們:',
        },  
      }      
    } 
  }
</script>

