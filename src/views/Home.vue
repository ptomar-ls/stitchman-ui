<template>
  <div class="home">
    <h1>This is a home page</h1>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  export default {
    mounted() {
      if (!this.isPaired) {
        this.$router.push('pair');
      }
    },
    computed: {
      ...mapGetters([
        'isPaired'
      ]),
    },
    methods: {
      ...mapActions([
        'setMessage',
      ]),
    },
  }
</script>

