<template>  
  <svg class="__icon_price_change_up_down" width="112" height="100" viewBox="0 0 5.05 4.51" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon v-if="direction === 'up'" class="__up" points="0,4.51 0.88,2.61 1.58,3.09 2.37,1.58 3.07,2.13 3.87,0.71 3.36,0.38 4.88,0 5.05,1.39 4.56,1.12 3.25,3 2.55,2.44 1.77,3.71 0.97,3.14 "/>
    <polygon v-if="direction === 'down'" class="__down" points="0,0 0.88,1.9 1.58,1.42 2.37,2.94 3.07,2.38 3.87,3.81 3.36,4.14 4.88,4.51 5.05,3.12 4.56,3.4 3.25,1.52 2.55,2.07 1.77,0.81 0.97,1.37 "/>  
  </svg>  
  <!--svg class="__icon_price_change_up_down" width="68" height="91" viewBox="0 0 1.86 2.48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon v-if="direction === 'up'" class="__up" points="0.46,2.48 0.56,1.19 0,1.24 0.93,0 1.86,1.24 1.31,1.19 1.41,2.48 "/>
    <polygon v-if="direction === 'down'" class="__down" points="0.46,0 0.56,1.29 0,1.24 0.93,2.48 1.86,1.24 1.31,1.29 1.41,0 "/>
  </svg--> 
</template>

<style lang="scss">  
  @import '@/assets/css/variables.scss';  
  .__icon_price_change_up_down { 
    display: block;
    .__up {
      fill: $_green;      
    }
    .__down {
      fill: $_red;      
    }     
  }   
</style>

<script>
export default {
  name: 'PriceUpDownArrowIcon',
  props: {
    direction: {
      type: String,
      required: true,      
    },   
  }, 
  data () {
    return {  }
  },  
}
</script>