<template>
  <!-- BreakPoint-->
  <div id="bootstrap-display-breakpoint-marker">
    <div id="xs-marker" class="d-block d-sm-none"></div>
    <div id="sm-marker" class="d-none d-sm-block d-md-none"></div>
    <div id="md-marker" class="d-none d-md-block d-lg-none"></div>
    <div id="lg-marker" class="d-none d-lg-block d-xl-none"></div>
    <div id="xl-marker" class="d-none d-xl-block"></div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';
  
  export default {
    name: 'BreakPoint',
    data () {      
      return {        
      };
    },    
    mounted () {      
      this.detectScreenBreakpoint();      
      window.addEventListener("resize", this.detectScreenBreakpoint);
    },
    beforeDestroy () {      
      window.removeEventListener("resize", this.detectScreenBreakpoint);
    },  
    computed: {        
      ...mapState({
        breakPointList: state => state.uiBreakPoint.breakPointList,
      })
    },
    methods: {      
      detectScreenBreakpoint: function () {        
        const currentBreakpoint = this.breakPointList.find((breakpoint) => {
          const el = document.getElementById(breakpoint+'-marker');
          if (el) return getComputedStyle(el, null).display === 'block';          
        });        
        this.$store.dispatch('UI_BREAKPOINT_SET', currentBreakpoint)        
      }
    },
    
  };
</script>
