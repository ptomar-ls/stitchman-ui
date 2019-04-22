<template>
  <div class="header">
    <router-link class="link" to="/">Home</router-link> |
    <router-link class="link" to="/settings">Settings</router-link>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>

  .header {
    padding: 10px;
    background-color: #46A9DD;
  }

  .link {
    padding: 10px;
    color: white;
  }

</style>
