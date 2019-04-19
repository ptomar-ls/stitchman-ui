<template>
  <div class="footer">
    <transition name="slide-fade">
      <p class="message" v-show="!!message">{{message}}</p>
    </transition>
    <p class="message" v-show="!message">&nbsp;</p>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  export default {
    computed: {
      ...mapGetters([
        'message',
      ]),
    },
  }
</script>

<style scoped>
  .message {
    margin: 0.5em;
    padding: 0;
    font-size: large;
    /*background-color: lime;*/
  }

</style>
