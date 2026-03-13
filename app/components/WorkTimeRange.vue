<template>
  <div class="workTimeSettingContainer">
    <label for="work-time-range">{{ `${prefixLabel} ${modelValue}${minutesSuffixLabel}` }}</label>
    <input
      id="work-time-range"
      :value="modelValue"
      type="range"
      name="work-time-range"
      :max="max"
      :min="min"
      list="workTimeSetting"
      :style="{ '--range-percent': `${workTimeRangePercent}%` }"
      @input="handleInput"
    >
    <div class="rangeScale" aria-hidden="true">
      <button
        v-for="mark in marks"
        :key="mark"
        type="button"
        class="rangeMark"
        :style="{
          left: `calc(10px + (100% - 20px) * ${((mark - min) / (max - min)).toFixed(6)})`
        }"
        @click="setMark(mark)"
      >
        {{ mark }}
      </button>
    </div>
    <datalist id="workTimeSetting">
      <option v-for="mark in marks" :key="mark" :value="mark" />
    </datalist>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  min: number
  max: number
  marks: readonly number[]
  prefixLabel: string
  minutesSuffixLabel: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const workTimeRangePercent = computed(
  () => ((props.modelValue - props.min) / (props.max - props.min)) * 100
)

const handleInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).valueAsNumber)
  emit('update:modelValue', value)
}

const setMark = (mark: number) => {
  emit('update:modelValue', mark)
}
</script>

<style scoped lang="scss">
.workTimeSettingContainer {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-weight: 600;
  }

  input[type="range"] {
    appearance: none;
    width: 100%;
    height: 20px;
    padding: 0;
    background: transparent;
    cursor: pointer;

    &::-webkit-slider-runnable-track {
      height: 8px;
      border-radius: 999px;
      background:
        linear-gradient(180deg, rgb(255 255 255 / 18%) 0%, rgb(255 255 255 / 0%) 100%),
        linear-gradient(
          90deg,
          var(--range-track-start) 0%,
          var(--range-track-mid) var(--range-percent, 0%),
          var(--range-track-rest) var(--range-percent, 0%),
          var(--range-track-end) 100%
        );
      box-shadow: inset 0 0 0 1px rgb(16 36 59 / 14%);
    }

    &::-webkit-slider-thumb {
      appearance: none;
      box-sizing: border-box;
      margin-top: -6px;
      width: 20px;
      height: 20px;
      border: 2px solid #fff;
      border-radius: 50%;
      background: #214c95;
      box-shadow: 0 3px 10px rgb(15 34 56 / 28%);
      cursor: grab;
    }

    &::-moz-range-track {
      height: 8px;
      border: none;
      border-radius: 999px;
      background:
        linear-gradient(180deg, rgb(255 255 255 / 18%) 0%, rgb(255 255 255 / 0%) 100%),
        linear-gradient(
          90deg,
          var(--range-track-start) 0%,
          var(--range-track-mid) var(--range-percent, 0%),
          var(--range-track-rest) var(--range-percent, 0%),
          var(--range-track-end) 100%
        );
      box-shadow: inset 0 0 0 1px rgb(16 36 59 / 14%);
    }

    &::-moz-range-thumb {
      box-sizing: border-box;
      width: 20px;
      height: 20px;
      border: 2px solid #fff;
      border-radius: 50%;
      background: #214c95;
      box-shadow: 0 3px 10px rgb(15 34 56 / 28%);
      cursor: grab;
    }

    &:active {
      cursor: pointer;
    }

    &:active::-webkit-slider-thumb {
      cursor: grabbing;
    }

    &:active::-moz-range-thumb {
      cursor: grabbing;
    }

    &:focus-visible {
      outline: 2px solid rgb(45 102 203 / 45%);
      outline-offset: 4px;
    }
  }
}

.rangeScale {
  position: relative;
  height: 1.3rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: rgb(16 36 59 / 72%);
  margin-top: -2px;
  padding-top: 0.35rem;
}

.rangeMark {
  position: absolute;
  top: 0.16rem;
  transform: translateX(-50%);
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: color 140ms ease;

  &:hover {
    color: rgb(16 36 59 / 94%);
  }

  &:focus-visible {
    outline: 2px solid rgb(45 102 203 / 40%);
    outline-offset: 2px;
    border-radius: 4px;
  }
}
</style>
