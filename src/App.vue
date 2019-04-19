<template>
  <div id="app">
    <div id="header">
      <p>Header</p>
    </div>
    <router-view id="content"/>
    <div id="footer">
      <p>Footer</p>
    </div>
  </div>
</template>

<style>
  html, body {
    height: 100%;
    overflow: hidden;
    /*background-color: magenta;*/
  }
</style>

<style scoped>

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
    padding: 10px;
    width: 100%;
    flex: 0 0 auto;
    /*background-color: lime;*/
  }

  #content {
    width: 100%;
    padding: 10px;
    flex: 1 1 auto;
    /*background-color: grey;*/
  }

  #footer {
    width: 100%;
    padding: 10px;
    flex: 0 0 auto;
    /*background-color: orange;*/
  }
</style>

