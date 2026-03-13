<template>
  <article class="manualContainer">
    <h2>{{ title }}</h2>
    <p>
      {{ line1 }}
      <br>
      {{ line2 }}
    </p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  line1: string
  line2: string
}>()
</script>

<style scoped lang="scss">
.manualContainer {
  margin: 0;

  h2 {
    margin: 0;
    font-size: 1.03rem;
  }

  p {
    margin: 0.35rem 0 0;
    line-height: 1.55;
    color: rgb(16 36 59 / 90%);
  }
}
</style>
