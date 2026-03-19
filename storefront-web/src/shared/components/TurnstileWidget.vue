<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from '@/shared/composables/useTheme'

const props = defineProps<{
  siteKey: string
}>()

const emit = defineEmits<{
  verify: [token: string]
  expired: []
  error: []
}>()

const theme = useTheme()
const containerRef = ref<HTMLDivElement | null>(null)
const widgetId = ref<string | null>(null)
const widgetTheme = computed(() => (theme.isDark.value ? 'dark' : 'light'))

let scriptPromise: Promise<void> | null = null

function loadScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.turnstile) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]')

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('验证码脚本加载失败')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstileScript = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('验证码脚本加载失败'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

function clearWidget() {
  if (widgetId.value && window.turnstile?.remove) {
    window.turnstile.remove(widgetId.value)
  }
  widgetId.value = null
}

async function renderWidget() {
  if (!props.siteKey || !containerRef.value) {
    return
  }

  clearWidget()
  await loadScript()
  await nextTick()

  if (!containerRef.value || !window.turnstile) {
    return
  }

  widgetId.value = window.turnstile.render(containerRef.value, {
    sitekey: props.siteKey,
    theme: widgetTheme.value,
    callback: (token) => emit('verify', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
  })
}

onMounted(() => {
  renderWidget().catch(() => emit('error'))
})

watch(
  () => [props.siteKey, widgetTheme.value],
  () => {
    renderWidget().catch(() => emit('error'))
  },
)

onBeforeUnmount(() => {
  clearWidget()
})
</script>

<template>
  <div class="turnstile-widget">
    <div ref="containerRef"></div>
  </div>
</template>