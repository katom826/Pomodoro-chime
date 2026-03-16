<template>
  <svg width="min(84vw, 620px)" height="min(84vw, 620px)" viewBox="0 0 100 100" class="clock">
    <defs>
      <filter id="clockShadow" x="-25%" y="-25%" width="150%" height="160%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#08162b" flood-opacity="0.28" />
      </filter>
      <filter id="handShadow" x="-60%" y="-60%" width="220%" height="220%" filterUnits="objectBoundingBox">
        <feDropShadow dx="0" dy="0" stdDeviation="0.6" flood-color="#ffffff" flood-opacity="0.9" />
      </filter>
      <filter id="textShadow" x="-60%" y="-60%" width="220%" height="220%" filterUnits="objectBoundingBox">
        <feDropShadow dx="0" dy="0" stdDeviation="0.6" flood-color="#ffffff" flood-opacity="1" />
      </filter>
      <linearGradient id="workSectorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f89f94" />
        <stop offset="100%" stop-color="#ec7078" />
      </linearGradient>
      <linearGradient id="restSectorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#86b3ea" />
        <stop offset="100%" stop-color="#4f7fd1" />
      </linearGradient>
      <linearGradient id="clockRingGradient" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="98" y2="98">
        <stop offset="0%" stop-color="var(--clock-ring-start, #2e4864)" />
        <stop offset="100%" stop-color="var(--clock-ring-end, #1b334c)" />
      </linearGradient>
      <linearGradient id="clockIndexGradient" gradientUnits="userSpaceOnUse" x1="50" y1="5" x2="50" y2="12">
        <stop offset="0%" stop-color="var(--clock-index-start, #3f6282)" />
        <stop offset="100%" stop-color="var(--clock-index-end, #1f3852)" />
      </linearGradient>
      <linearGradient id="clockHandGradient" gradientUnits="userSpaceOnUse" x1="0" y1="-45" x2="0" y2="0">
        <stop offset="0%" stop-color="var(--clock-hand-start, #456683)" />
        <stop offset="100%" stop-color="var(--clock-hand-end, #1f3852)" />
      </linearGradient>
    </defs>

    <g filter="url(#clockShadow)">
      <path v-for="(sector, i) in clockSectors" :key="i" :d="sector.path" :fill="sector.fill" class="clockSector" />

      <circle
        cx="50"
        cy="50"
        r="48"
        fill="#ffffff08"
        stroke="url(#clockRingGradient)"
        stroke-width="1.3"
        class="clockCircle"
      />

      <g :transform="`translate(${minuteHand.x} ${minuteHand.y}) rotate(${minuteAngle})`">
        <polygon :points="minuteHandPoints" class="clockLongHand" filter="url(#handShadow)" />
      </g>

      <g :transform="`translate(${hourHand.x} ${hourHand.y}) rotate(${hourAngle})`">
        <polygon :points="hourHandPoints" class="clockShortHand" />
      </g>

      <circle cx="50" cy="50" r="1.9" class="clockPin" />

      <line
        v-for="i in 60"
        :key="i"
        x1="50"
        y1="5"
        x2="50"
        :y2="(i - 1) % 5 === 0 ? 11.5 : 7"
        stroke="url(#clockIndexGradient)"
        :stroke-width="(i - 1) % 5 === 0 ? 1 : 0.75"
        :transform="`rotate(${(i - 1) * 6} 50 50)`"
        pathLength="1"
        class="clockIndex"
      />

      <text
        x="50"
        y="69.8"
        text-anchor="middle"
        dominant-baseline="middle"
        class="clockTextMain"
        filter="url(#textShadow)"
      >
        {{ remainLabel }}
      </text>
    </g>
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
  now: Date | null
  workTime: number
  remainingSeconds: number
}>()

const CLOCK_CENTER = 50
const CLOCK_RADIUS = 48

const formatMmSs = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const polarToCartesian = (angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CLOCK_CENTER + CLOCK_RADIUS * Math.cos(rad),
    y: CLOCK_CENTER + CLOCK_RADIUS * Math.sin(rad)
  }
}

const createSectorPath = (startDeg: number, endDeg: number) => {
  const start = polarToCartesian(startDeg)
  const end = polarToCartesian(endDeg)
  const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0
  return `
    M ${CLOCK_CENTER} ${CLOCK_CENTER}
    L ${start.x} ${start.y}
    A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
    Z
  `
}

const hourAngle = computed(() =>
  props.now
    ? ((props.now.getHours() % 12) + props.now.getMinutes() / 60 + props.now.getSeconds() / 3600) * 30
    : 0
)

const minuteAngle = computed(() =>
  props.now ? (props.now.getMinutes() + props.now.getSeconds() / 60) * 6 : 0
)

const hourRad = computed(() => ((hourAngle.value - 90) * Math.PI) / 180)
const minuteRad = computed(() => ((minuteAngle.value - 90) * Math.PI) / 180)

const hourHand = computed(() => ({
  x: 50 - 3 * Math.cos(hourRad.value),
  y: 50 - 3 * Math.sin(hourRad.value),
  length: 35
}))

const minuteHand = computed(() => ({
  x: 50 - 3 * Math.cos(minuteRad.value),
  y: 50 - 3 * Math.sin(minuteRad.value),
  length: 45
}))

const createHandPoints = (length: number, tailWidth: number, tipWidth: number, tipLength: number) => {
  const tipBaseY = -(length - tipLength)
  return `${-tailWidth},0 ${-tipWidth},${tipBaseY} ${tipWidth},${tipBaseY} ${tailWidth},0`
}

const hourHandPoints = computed(() => createHandPoints(hourHand.value.length, 1.0, 0.42, 2.2))
const minuteHandPoints = computed(() => createHandPoints(minuteHand.value.length, 0.8, 0.32, 2.6))

const restTime = computed(() => 30 - props.workTime)

const clockSectors = computed(() => {
  const segmentMinutes = [props.workTime, restTime.value, props.workTime, restTime.value]
  let passedMinutes = 0

  return segmentMinutes.map((minutes, index) => {
    const startDeg = passedMinutes * 6
    passedMinutes += minutes
    const endDeg = passedMinutes * 6

    return {
      path: createSectorPath(startDeg, endDeg),
      fill: index % 2 === 0 ? 'url(#workSectorGradient)' : 'url(#restSectorGradient)'
    }
  })
})

const remainLabel = computed(() => (props.now ? formatMmSs(props.remainingSeconds) : '--:--'))
</script>

<style scoped lang="scss">
.clock {
  width: min(84vw, 620px);
  height: min(84vw, 620px);
  overflow: visible;
}

.clockSector {
  transform-origin: 50px 50px;
  transform: scale(0);
  animation: sector-grow var(--clock-grow-duration, 1.4s) var(--clock-grow-ease, ease) forwards;
}

.clockTextMain {
  font-family: Menlo, "SFMono-Regular", Consolas, monospace;
  font-size: 5.9px;
  font-weight: 700;
  letter-spacing: 0.45px;
  fill: var(--clock-text, #112031);
  opacity: 0;
  animation: fade-in-text calc(var(--clock-grow-duration, 1.4s) * 0.72) ease-out forwards;
  animation-delay: calc(var(--clock-grow-duration, 1.4s) * 0.3);
}

.clockCircle {
  transform-origin: 50% 50%;
  transform: scale(0);
  animation: draw-circle var(--clock-grow-duration, 1.4s) var(--clock-grow-ease, ease) forwards;
}

@keyframes draw-circle {
  to {
    transform: scale(1);
  }
}

@keyframes sector-grow {
  to {
    transform: scale(1);
  }
}

@keyframes fade-in-text {
  from {
    opacity: 0;
    transform: translateY(1px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.clockLongHand {
  fill: url(#clockHandGradient);
  transform-origin: 50% 100%;
  transform-box: fill-box;
  transform: scaleY(0);
  animation: hand-grow 920ms cubic-bezier(0.18, 0.82, 0.24, 1) forwards;
  animation-delay: 40ms;
}

.clockShortHand {
  fill: url(#clockHandGradient);
  transform-origin: 50% 100%;
  transform-box: fill-box;
  transform: scaleY(0);
  animation: hand-grow 920ms cubic-bezier(0.18, 0.82, 0.24, 1) forwards;
}

.clockPin {
  fill: #1a334d;
}

.clockIndex {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw-line 0.8s ease-out forwards 0.9s;
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes hand-grow {
  to {
    transform: scaleY(1);
  }
}
</style>
