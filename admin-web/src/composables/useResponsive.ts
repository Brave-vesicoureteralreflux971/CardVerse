import { computed, onMounted, onUnmounted, ref } from 'vue';

const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1440);

function updateWidth() {
  width.value = window.innerWidth;
}

export function useResponsive() {
  onMounted(() => window.addEventListener('resize', updateWidth));
  onUnmounted(() => window.removeEventListener('resize', updateWidth));

  const isMobile = computed(() => width.value < 1024);

  return {
    width,
    isMobile,
  };
}
