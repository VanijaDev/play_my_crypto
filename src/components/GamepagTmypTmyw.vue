<template>
  <div class="__content-block __cb_blue __reverse h-100">
    <div class="d-flex flex-column justify-content-center align-items-center h-100 __myp-myw">
      <img src="/img/gamepad_myp_myw.svg"  width="92" alt="Gamepad" class="mb-2">
      <div>{{ $t('tmyp') }}</div>
      <div>{{ $t('tmyw') }}</div>
    </div>            
  </div>
</template>

<style lang="scss" scoped>  
  @import '@/assets/css/variables.scss';
  .__myp-myw{
    div{
      font-size: 26px;
      font-weight: 800;
      text-align: center;      
    }
  }

</style>

<script>
  export default {
    name: 'GamepagTmypTmyw',
    i18n: {
      messages: {
        en: {
          tmyp: 'THE MORE YOU PLAY',
          tmyw: 'THE MORE YOU WIN',
        },
        ch: {
          tmyp: '您玩的更多',
          tmyw: '您贏了更多',
        },  
      }      
    } 
  }
</script>

