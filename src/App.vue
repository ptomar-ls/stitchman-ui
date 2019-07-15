<template>
  <div id="app">
    <Header id="header"></Header>
    <router-view id="content"/>
    <Footer id="footer"></Footer>
  </div>
</template>

<script>
  // @ is an alias to /src
  import Header from '@/components/Header.vue'
  import Footer from '@/components/Footer.vue'

  export default {
    components: {
      Header,
      Footer,
    }
  }
</script>

<style>
  html, body {
    height: 100%;
    overflow: hidden;
    /*background-color: magenta;*/
  }

  .slide-fade-enter-active {
    transition: all 0.3s ease;
  }
  .slide-fade-leave-active {
    transition: all 1.5s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  .slide-fade-enter, .slide-fade-leave-to
    /* .slide-fade-leave-active below version 2.1.8 */ {
    transform: translateY(30px);
    opacity: 0;
  }

</style>

<style>

  *{
    box-sizing: border-box;
    padding:0;
  }
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;

    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
  }

  #header {
    width: 100%;
    flex: 0 0 auto;
    box-shadow: 5px 5px 10px #0003;
    transition: box-shadow 0.3s;
    /*background-color: lime;*/
  }

  #content {
    width: 100%;
    padding: 10px;
    flex: 1 1 auto;
    overflow:auto;
    /*background-color: grey;*/
  }

  #footer {
    width: 100%;
    flex: 0 0 auto;
    /*background-color: orange;*/
  }
</style>

