import { defineStore } from 'pinia'
import { ref /* watch */ } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'system')

  // Watch for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const updateSystemTheme = () => {
    if (theme.value === 'system') {
      document.documentElement.classList.toggle('dark', mediaQuery.matches)
    }
  }

  // Initialize theme
  const initializeTheme = () => {
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme.value === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      updateSystemTheme()
    }
  }

  // Set theme
  const setTheme = newTheme => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      updateSystemTheme()
    }
  }

  // Listen for system theme changes
  mediaQuery.addEventListener('change', updateSystemTheme)

  // Initialize theme on store creation
  initializeTheme()

  return {
    theme,
    setTheme
  }
})
