import { computed, ref } from 'vue';
import { darkTheme } from 'naive-ui';
import { STORAGE_KEYS, getStorage, setStorage } from '../utils/storage';

const mode = ref<'light' | 'dark'>((getStorage(STORAGE_KEYS.theme) as 'light' | 'dark' | null) ?? 'light');

export function useTheme() {
  const isDark = computed(() => mode.value === 'dark');
  const naiveTheme = computed(() => (isDark.value ? darkTheme : null));

  function setMode(next: 'light' | 'dark') {
    mode.value = next;
    setStorage(STORAGE_KEYS.theme, next);
  }

  function toggleTheme() {
    setMode(isDark.value ? 'light' : 'dark');
  }

  return {
    mode,
    isDark,
    naiveTheme,
    setMode,
    toggleTheme,
  };
}
