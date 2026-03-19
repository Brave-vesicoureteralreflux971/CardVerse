import { computed, ref } from 'vue';
import { darkTheme } from 'naive-ui';

const STORAGE_KEY = 'storefront-theme-mode';
const isDark = ref(false);

function initializeTheme() {
  if (typeof window === 'undefined') {
    return;
  }

  const cached = window.localStorage.getItem(STORAGE_KEY);
  if (cached === 'dark') {
    isDark.value = true;
    return;
  }

  if (cached === 'light') {
    isDark.value = false;
    return;
  }

  isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function persistTheme() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light');
}

initializeTheme();

export function useTheme() {
  const naiveTheme = computed(() => (isDark.value ? darkTheme : null));

  function toggleTheme() {
    isDark.value = !isDark.value;
    persistTheme();
  }

  return {
    isDark,
    naiveTheme,
    toggleTheme,
  };
}
