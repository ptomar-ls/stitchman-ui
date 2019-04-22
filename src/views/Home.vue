<template>
  <div class="home">
    <h3>{{kaptivoId}}</h3>
    <control-pad></control-pad>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import ControlPad from '../components/ControlPad.vue'

  export default {
    mounted() {
      if (!this.isPaired) {
        this.$router.push('pair');
      }
    },
    computed: {
      ...mapGetters([
        'kaptivoId',
        'isPaired'
      ]),
    },
    methods: {
      ...mapActions([
        'setMessage',
      ]),
    },
    components: {
      ControlPad,
    },
  }
</script>


<style>
  .home {
    height: 100%;
  }
</style>