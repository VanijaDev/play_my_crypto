<!-- Order Modal  -->
<template>
  <b-modal 
    :id="id"
    :size="size"
    v-model="modalShow"
    header-class="__modal__header" 
    title-class="__modal__title"   
    :body-class="`__modal__body __bp_${breakPoint()}`"    
    content-class="__modal__content"    
    scrollable 
    :hide-footer="true"
    :no-enforce-focus="true" 
    :no-close-on-backdrop="true"
    :title="title"
    > 
    <template v-slot:default>
      <slot name="content"></slot>
    </template>    
  </b-modal> 
</template> 

<style lang="scss">
@import '@/assets/css/variables.scss';
  .__modal__content {
    border-radius: $_content_block_border_radius !important;
    border: none !important;
    font-size: 1.1rem;
    .__info{
      color: $_blue;
      text-align: center;
      font-size: 1rem;
    }       
  }
  .__modal__body{
    padding: 4rem !important;
    padding-top: .5rem !important;
    &.__bp_sm {
      padding: 2rem !important;
    }
    &.__bp_xs {
      padding: 1rem !important;
    }   
  }
  .__modal__header {
    border-bottom: 0 !important;
    button.close {
      padding: .5rem .8rem 0 .5rem;
      background-color: transparent;
      border: 0;
    }
    .close {
      float: right;
      font-size: 2rem;
      font-weight: 600;
      line-height: 1;
      color: $_blue;
      text-shadow: 0 1px 0 $_white;  
      position: absolute; 
      right: 1rem;   
    }
  }
  .__modal__title{
    color: $_blue;
    font-size: 1.7rem;
    font-weight: 700;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.2rem;
    width: 100%;
  }
</style>

<script>
  export default {
    name: "Modal",
    data () {      
      return {
        modalShow: false,       
      };
    }, 
    props: {
      id: {
        type: String,
        required: true,      
      },    
      size: {
        type: String,
        default: 'xl'
      }, 
      title: {
        type: String,
        default: ''
      }      
    },   
    mounted() {
      this.$eventBus.$on('modal::' + this.id + '::open', this.openModal)
      this.$eventBus.$on('modal::' + this.id + '::close', this.closeModal)
    },
    beforeDestroy () {      
      this.$eventBus.$off('modal::' + this.id + '::open') 
      this.$eventBus.$off('modal::' + this.id + '::close')    
    },
    watch: {
      modalShow: function (newVal) { if (!newVal) this.closeModal() },
    },  
    methods: { 
      openModal() { this.modalShow = true },
      closeModal() { this.modalShow = false },     
    }     
  }
</script>