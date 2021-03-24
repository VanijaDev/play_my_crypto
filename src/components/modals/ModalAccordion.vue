<template>
  <div class="__accordion" role="tablist">
    <div v-for="(qa, i) in list" :key="'acc'+i" class="__accordion_block">
      <button type="button" @click="select(i)" class="btn btn-primary">
        {{qa.q}}
        <svg viewBox="0 0 7.98 7.98" width="18" height="18" >
          <circle  cx="3.99" cy="3.99" r="3.99"/>
          <polygon points="3.63,1.62 4.35,1.62 4.35,6.36 3.63,6.36 "  v-if="i !== selected"/>
          <polygon points="1.62,4.35 1.62,3.63 6.36,3.63 6.36,4.35 "/>
        </svg>
      </button>                
      <b-collapse :id="'ac_'+i" visible accordion="acc">     
        <div class="__accordion_content">
          {{qa.a}}
        </div>
      </b-collapse>
    </div>    
  </div>
</template> 

<style lang="scss" scoped>
  @import '@/assets/css/variables.scss';
  .__accordion {
    font-size: 1.1rem;
    .__accordion_block {
      margin-bottom: 1rem; 
      &:last-child{
        margin-bottom: 0;
      }
      button{
        background: $_violet;
        width: 100%;
        padding: 1.3rem 1.5rem;
        font-size: 1.1rem;
        border: none;
        border-radius: ($_content_block_border_radius - .2) !important;         
        display: flex;
        justify-content: space-between;
        align-items: center;          
        &:hover, &:active {
          background: darken($_violet, 10%) !important;
        }  
        svg {
          circle{
            fill: $_white;
          }
          polygon{
            fill: $_violet;
          }
        }
      }
      .__accordion_content{
        padding:  1rem 1rem 1rem 1rem;
      }
    }          
  }
</style>

<script>
  export default {
    name: "ModalAccordion",
    data () {      
      return {
        selected: 0, 
      };
    }, 
    props: {
      list: {
        type: Array,
        required: true,      
      },     
    },   
    mounted() {
      this.selected = 0
    },     
    methods: { 
      select(i) {
        this.selected === i ? this.selected = null : this.selected = i
        this.$root.$emit('bv::toggle::collapse', 'ac_'+i)
      }        
    }     
  }
</script>



