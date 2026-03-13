<template>
  <div class="soundToggleContainer">
    <label for="sound-toggle">{{ label }}</label>
    <label class="switch" :aria-label="ariaLabel">
      <input
        id="sound-toggle"
        :checked="modelValue"
        type="checkbox"
        name="sound-toggle"
        @change="handleChange"
      >
      <span class="switchSlider" />
    </label>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  label: string
  ariaLabel: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const handleChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<style scoped lang="scss">
.soundToggleContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 30px;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .switchSlider {
      background: linear-gradient(180deg, #70cd93, #3da46a);
    }

    &:checked + .switchSlider::before {
      transform: translateX(20px);
    }

    &:focus-visible + .switchSlider {
      outline: 2px solid rgb(45 102 203 / 50%);
      outline-offset: 2px;
    }
  }

  .switchSlider {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: linear-gradient(180deg, rgb(128 145 168 / 62%), rgb(106 125 150 / 82%));
    transition: background 220ms ease;
    box-shadow: inset 0 0 0 1px rgb(16 36 59 / 14%);

    &::before {
      content: "";
      position: absolute;
      left: 4px;
      top: 4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 2px 8px rgb(0 0 0 / 25%);
      transition: transform 220ms ease;
    }
  }
}
</style>
