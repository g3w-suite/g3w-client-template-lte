<template functional>
  <div id="offline" data-placement="right" v-if="!online"
       title="OFFLINE"
       class="skin-tooltip-right"
       style="position:absolute;
       top: 55px; background-color: rgba(255,255,255,0.9);
       padding: 5px; border-radius: 3px; color :red; left: 0;
        z-index: 100; font-size: 25px;">
    <i :class="g3wtemplate.getFontClass('wifi')"></i>
  </div>
</template>

<script>
  export default {
    name: 'online-status',
    props: ['online'],
    mounted() {
      $('#offline').tooltip();
    }
  }

</script>

<style>

</style>
