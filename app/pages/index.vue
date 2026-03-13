<template>
  <div v-if="now" :class="['container', isWorkTime ? 'work' : 'rest']">
    <div
      :key="blinkKey"
      aria-hidden="true"
      :class="['bgBlink', { bgBlinkActive: blinkActive }]"
    />
    <main class="main">
      <button class="menuBtn" :aria-label="OPEN_SETTINGS_LABEL" @click="toggleMenu">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
        </svg>
      </button>

      <PomodoroClock :now="now" :work-time="workTime" :remaining-seconds="remainingSeconds" />
    </main>

    <FooterAd />

    <div aria-hidden="true" :class="['dialogOverlay', { dialogOverlayVisible: isDialogShown }]" />

    <dialog
      ref="menuDialogRef"
      class="menuDialog"
      @close="handleDialogClose"
      @pointerdown="handleDialogPointerDown"
      @click="handleDialogClick"
      @cancel="handleDialogCancel"
    >
      <WorkTimeRange
        v-model="workTime"
        :min="WORK_TIME_MIN"
        :max="WORK_TIME_MAX"
        :marks="RANGE_MARKS"
        :prefix-label="WORK_TIME_PREFIX_LABEL"
        :minutes-suffix-label="MINUTES_SUFFIX_LABEL"
      />

      <hr class="hr">

      <SoundToggle
        :model-value="soundEnabled"
        :label="SOUND_TOGGLE_LABEL"
        :aria-label="SOUND_TOGGLE_ARIA_LABEL"
        @update:modelValue="handleSoundToggleUpdate"
      />

      <hr class="hr">

      <ManualSection :title="MANUAL_TITLE" :line-1="MANUAL_LINE_1" :line-2="MANUAL_LINE_2" />

      <OfficialLink href="https://katom826.github.io/" :label="OFFICIAL_LINK_LABEL" />

      <button ref="menuCloseBtnRef" class="menuCloseBtn" @click="toggleMenu">
        {{ isInitialDialogOpen ? START_LABEL : CLOSE_LABEL }}
      </button>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const WORK_TIME_MIN = 1
const WORK_TIME_MAX = 29
const HALF_HOUR_SECONDS = 30 * 60
const CLOCK_TICK_INTERVAL_MS = 1000
const DIALOG_CLOSE_DURATION_MS = 220
const WORK_TIME_STORAGE_KEY = 'pomodoro-work-time'
const INITIAL_DIALOG_SHOWN_STORAGE_KEY = 'pomodoro-initial-dialog-shown'
const SOUND_ENABLED_STORAGE_KEY = 'pomodoro-sound-enabled'
const RANGE_MARKS = [1, 5, 10, 15, 20, 25, 29] as const
const STATUS_WORK_LABEL = '\u4f5c\u696d'
const STATUS_REST_LABEL = '\u4f11\u61a9'
const OPEN_SETTINGS_LABEL = '\u8a2d\u5b9a\u3092\u958b\u304f'
const WORK_TIME_PREFIX_LABEL = '\u4f5c\u696d\u6642\u9593'
const MINUTES_SUFFIX_LABEL = '\u5206'
const SOUND_TOGGLE_LABEL = '\u4f5c\u696d/\u4f11\u61a9 \u5207\u308a\u66ff\u3048\u30b5\u30a6\u30f3\u30c9'
const SOUND_TOGGLE_ARIA_LABEL = '\u4f5c\u696d/\u4f11\u61a9 \u5207\u308a\u66ff\u3048\u30b5\u30a6\u30f3\u30c9ON/OFF'
const MANUAL_TITLE = '\u6642\u5831\u30dd\u30e2\u30c9\u30fc\u30ed\u30bf\u30a4\u30de\u30fc'
const MANUAL_LINE_1 = '\u6bce\u664200\u5206\u306830\u5206\u306b\u4f5c\u696d\u3092\u958b\u59cb\u3057\u3001'
const MANUAL_LINE_2 = '\u8a2d\u5b9a\u3057\u305f\u4f5c\u696d\u6642\u9593\u306e\u6b8b\u308a\u3092\u4f11\u61a9\u6642\u9593\u306b\u3057\u307e\u3059\u3002'
const OFFICIAL_LINK_LABEL = '\u4f5c\u8005\u516c\u5f0f\u30da\u30fc\u30b8'
const START_LABEL = '\u59cb\u3081\u308b'
const CLOSE_LABEL = '\u9589\u3058\u308b'

const parseStoredWorkTime = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= WORK_TIME_MIN && parsed <= WORK_TIME_MAX) {
    return parsed
  }
  return null
}

const parseStoredBool = (value: string | null, fallback: boolean) => {
  if (value === '1') return true
  if (value === '0') return false
  return fallback
}

const formatMmSs = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const now = ref<Date | null>(null)
const workTime = ref(25)
const soundEnabled = ref(false)
const shouldAutoOpenDialog = ref(false)
const isDialogShown = ref(false)
const isInitialDialogOpen = ref(false)
const isDialogClosing = ref(false)
const menuDialogRef = ref<HTMLDialogElement | null>(null)
const menuCloseBtnRef = ref<HTMLButtonElement | null>(null)
const dialogCloseAnimationRef = ref<Animation | null>(null)
const pointerDownStartedInsideDialogRef = ref(false)
const audioContextRef = ref<AudioContext | null>(null)
const prevIsWorkTimeRef = ref<boolean | null>(null)

let intervalId: ReturnType<typeof setInterval> | null = null

const ensureAudioContext = () => {
  if (audioContextRef.value) return audioContextRef.value
  if (!import.meta.client) return null

  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextClass) return null

  const context = new AudioContextClass()
  audioContextRef.value = context
  return context
}

const playSwitchChime = async () => {
  const context = ensureAudioContext()
  if (!context) return
  if (context.state !== 'running') {
    await context.resume()
  }
  if (context.state !== 'running') return

  const nowAt = context.currentTime
  const scheduleTone = (frequency: number, start: number, duration: number) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }

  scheduleTone(660, nowAt, 0.34)
  scheduleTone(880, nowAt + 0.22, 0.46)
}

const workDurationSeconds = computed(() => workTime.value * 60)
const elapsedSecondsInBlock = computed(() =>
  now.value ? (now.value.getMinutes() % 30) * 60 + now.value.getSeconds() : 0
)

const isWorkTime = computed(() =>
  now.value ? elapsedSecondsInBlock.value < workDurationSeconds.value : false
)

const remainingSeconds = computed(() => {
  if (!now.value) return 0
  return isWorkTime.value
    ? workDurationSeconds.value - elapsedSecondsInBlock.value
    : HALF_HOUR_SECONDS - elapsedSecondsInBlock.value
})

const remainLabel = computed(() => (now.value ? formatMmSs(remainingSeconds.value) : '--:--'))
const tabStatusLabel = computed(() => (isWorkTime.value ? STATUS_WORK_LABEL : STATUS_REST_LABEL))
const blinkActive = ref(false)
const blinkKey = ref(0)
let blinkTimeoutId: ReturnType<typeof setTimeout> | null = null

useHead(() => ({
  title: now.value ? `${tabStatusLabel.value}\uff1a${remainLabel.value}` : 'Pomodoro Chime'
}))

const closeMenuWithAnimation = () => {
  if (!menuDialogRef.value?.open || isDialogClosing.value) return

  isDialogClosing.value = true
  isDialogShown.value = false
  dialogCloseAnimationRef.value?.cancel()

  const closeAnimation = menuDialogRef.value.animate(
    [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(10px) scale(0.985)' }
    ],
    { duration: DIALOG_CLOSE_DURATION_MS, easing: 'ease' }
  )

  dialogCloseAnimationRef.value = closeAnimation
  closeAnimation.onfinish = () => {
    dialogCloseAnimationRef.value = null
    menuDialogRef.value?.close()
    isDialogClosing.value = false
    isInitialDialogOpen.value = false
  }
  closeAnimation.oncancel = () => {
    dialogCloseAnimationRef.value = null
  }
}

const toggleMenu = async () => {
  if (!menuDialogRef.value) return
  if (menuDialogRef.value.open) {
    closeMenuWithAnimation()
    return
  }

  isDialogShown.value = true
  menuDialogRef.value.showModal()
  await nextTick()
  menuCloseBtnRef.value?.focus()
}

const handleDialogClick = (event: MouseEvent) => {
  if (!menuDialogRef.value) return
  const rect = menuDialogRef.value.getBoundingClientRect()
  const clickedOutside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom

  if (clickedOutside && !pointerDownStartedInsideDialogRef.value) {
    closeMenuWithAnimation()
  }

  pointerDownStartedInsideDialogRef.value = false
}

const handleDialogPointerDown = (event: PointerEvent) => {
  if (!menuDialogRef.value) return
  const rect = menuDialogRef.value.getBoundingClientRect()
  pointerDownStartedInsideDialogRef.value =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
}

const handleDialogCancel = (event: Event) => {
  event.preventDefault()
  closeMenuWithAnimation()
}

const handleDialogClose = () => {
  dialogCloseAnimationRef.value = null
  isDialogShown.value = false
  isDialogClosing.value = false
  isInitialDialogOpen.value = false
}

const updateCurrentTime = () => {
  now.value = new Date()
}

const handleSoundToggleUpdate = async (enabled: boolean) => {
  soundEnabled.value = enabled
  if (enabled) {
    await playSwitchChime()
  }
}

const unlockAudio = () => {
  const context = ensureAudioContext()
  if (context && context.state === 'suspended') {
    void context.resume()
  }
}

watch(workTime, (value) => {
  if (!import.meta.client) return
  window.localStorage.setItem(WORK_TIME_STORAGE_KEY, String(value))
})

watch(soundEnabled, (value) => {
  if (!import.meta.client) return
  window.localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, value ? '1' : '0')
})

watch([now, shouldAutoOpenDialog], async ([currentNow, shouldOpen]) => {
  if (!currentNow || !shouldOpen || !menuDialogRef.value || menuDialogRef.value.open) return

  isDialogShown.value = true
  menuDialogRef.value.showModal()
  await nextTick()
  menuCloseBtnRef.value?.focus()
  shouldAutoOpenDialog.value = false
})

watch([isWorkTime, now, soundEnabled], async ([currentIsWorkTime, currentNow, currentSoundEnabled]) => {
  if (!currentNow) return

  if (prevIsWorkTimeRef.value === null) {
    prevIsWorkTimeRef.value = currentIsWorkTime
    return
  }

  if (prevIsWorkTimeRef.value !== currentIsWorkTime && currentSoundEnabled) {
    await playSwitchChime()
  }

  prevIsWorkTimeRef.value = currentIsWorkTime
})

watch(remainingSeconds, (value, previous) => {
  if (!import.meta.client) return
  if (previous !== undefined && previous <= 3) return
  if (value > 0 && value <= 3) {
    blinkActive.value = false
    blinkKey.value += 1
    requestAnimationFrame(() => {
      blinkActive.value = true
    })
    if (blinkTimeoutId) {
      clearTimeout(blinkTimeoutId)
    }
    blinkTimeoutId = window.setTimeout(() => {
      blinkActive.value = false
      blinkTimeoutId = null
    }, 3300)
  }
})

onMounted(() => {
  const savedWorkTime = parseStoredWorkTime(window.localStorage.getItem(WORK_TIME_STORAGE_KEY))
  if (savedWorkTime !== null) {
    workTime.value = savedWorkTime
  }

  soundEnabled.value = parseStoredBool(window.localStorage.getItem(SOUND_ENABLED_STORAGE_KEY), false)

  const hasShownInitialDialog = window.localStorage.getItem(INITIAL_DIALOG_SHOWN_STORAGE_KEY)
  if (!hasShownInitialDialog) {
    shouldAutoOpenDialog.value = true
    isInitialDialogOpen.value = true
    window.localStorage.setItem(INITIAL_DIALOG_SHOWN_STORAGE_KEY, '1')
  }

  window.addEventListener('pointerdown', unlockAudio, { once: true })
  window.addEventListener('keydown', unlockAudio, { once: true })

  updateCurrentTime()
  intervalId = window.setInterval(updateCurrentTime, CLOCK_TICK_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  if (blinkTimeoutId) {
    clearTimeout(blinkTimeoutId)
  }
  window.removeEventListener('pointerdown', unlockAudio)
  window.removeEventListener('keydown', unlockAudio)
  dialogCloseAnimationRef.value?.cancel()
  void audioContextRef.value?.close()
})
</script>

<style scoped lang="scss">
.container {
  --ink: #10243b;
  --bg-rest-start: #315c86;
  --bg-rest-mid: #304f75;
  --bg-rest-end: #2b4467;
  --bg-work-start: #f8846b;
  --bg-work-mid: #ee6772;
  --bg-work-end: #df5167;
  --range-track-start: #e17575;
  --range-track-mid: #cf5a5a;
  --range-track-end: #c1c8d3;
  --range-track-rest: #d3d8e0;
  --button-primary: #18365f;
  --button-primary-hover: #1e4477;
  --clock-ring-start: #2e4864;
  --clock-ring-end: #1b334c;
  --clock-index-start: #3f6282;
  --clock-index-end: #1f3852;
  --clock-hand-start: #456683;
  --clock-hand-end: #1f3852;
  --clock-text: #112031;
  --clock-grow-duration: 1.4s;
  --clock-grow-ease: cubic-bezier(0.22, 0.8, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  font-family: "Avenir Next", "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at 30% 20%, rgb(255 255 255 / 12%), transparent 46%),
    linear-gradient(135deg, var(--bg-rest-start) 0%, var(--bg-rest-mid) 52%, var(--bg-rest-end) 100%);

  &::before,
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 700ms ease;
  }

  &::before {
    background:
      radial-gradient(circle at 18% 20%, rgb(168 231 255 / 28%), transparent 42%),
      radial-gradient(circle at 82% 86%, rgb(255 255 255 / 10%), transparent 46%),
      linear-gradient(135deg, #367fca 0%, #2d69c4 48%, #2558af 100%);
  }

  &::after {
    background:
      radial-gradient(circle at 20% 20%, rgb(255 208 173 / 30%), transparent 42%),
      radial-gradient(circle at 80% 85%, rgb(255 255 255 / 12%), transparent 44%),
      linear-gradient(135deg, var(--bg-work-start) 0%, var(--bg-work-mid) 52%, var(--bg-work-end) 100%);
  }

  > * {
    position: relative;
    z-index: 2;
  }
}

.container > .bgBlink {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: rgb(255 255 255 / 85%);
  opacity: 0;
}

.bgBlinkActive {
  animation: bg-blink 3.3s ease-in-out forwards;
}

.work::before {
  opacity: 0;
}

.work::after {
  opacity: 1;
}

.rest::before {
  opacity: 1;
}

.rest::after {
  opacity: 0;
}

.main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 2rem 1.25rem 1rem;
}

.menuBtn {
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgb(255 255 255 / 35%);
  background: rgb(255 255 255 / 18%);
  color: #fff;
  backdrop-filter: blur(8px);
  transition: background 180ms ease;

  &:hover {
    background: rgb(255 255 255 / 28%);
  }
}

.menuDialog[open] {
  width: min(92vw, 380px);
  background-color: rgb(255 255 255 / 97%);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  border: 1px solid rgb(16 36 59 / 20%);
  border-radius: 16px;
  box-shadow: 0 24px 46px rgb(0 0 0 / 32%);
  padding: 1rem;
  opacity: 0;
  transform: translateY(10px) scale(0.985);
  animation: dialog-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

  &::backdrop {
    background: transparent;
    backdrop-filter: none;
  }
}

.dialogOverlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: rgb(10 18 32 / 42%);
  opacity: 0;
  transition: opacity 240ms ease;
}

.dialogOverlayVisible {
  opacity: 1;
}

.hr {
  border: none;
  height: 1px;
  margin: 0.1rem 0;
  background: rgb(16 36 59 / 14%);
}

.menuCloseBtn {
  margin-top: 0.2rem;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  background: var(--button-primary);
  color: #fff;
  cursor: pointer;
  transition: background 180ms ease;

  &:hover {
    background: var(--button-primary-hover);
  }
}

@keyframes dialog-in {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bg-blink {
  0% {
    opacity: 0;
  }

  14% {
    opacity: 0.65;
  }

  30% {
    opacity: 0;
  }

  45% {
    opacity: 0.65;
  }

  60% {
    opacity: 0;
  }

  75% {
    opacity: 0.65;
  }

  91% {
    opacity: 0.65;
  }

  100% {
    opacity: 0;
  }
}

@media (width <= 640px) {
  .main {
    padding: 1.25rem 0.75rem 0.75rem;
  }

  .menuBtn {
    top: 12px;
    right: 12px;
  }
}
</style>
