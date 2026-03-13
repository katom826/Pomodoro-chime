<template>
  <div class="officialLinkContainer">
    <svg
      class="openInNewIcon"
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
    </svg>
    <a :href="href" target="_blank" rel="noreferrer">{{ label }}</a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  href: string
}>()
</script>

<style scoped lang="scss">
.officialLinkContainer {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  justify-content: center;

  a {
    color: #1f56b2;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 2px;
    font-weight: 600;
    transition: color 180ms ease, text-decoration-color 180ms ease;

    &:hover {
      text-decoration-color: currentcolor;
    }
  }
}

.openInNewIcon {
  fill: currentcolor;
}
</style>
