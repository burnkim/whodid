import { useEffect } from 'react'

// Applies data-theme on <html>. 'system' resolves via prefers-color-scheme and
// keeps following the OS while selected.
export function useTheme(theme) {
  useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-color-scheme: dark)')

    function apply() {
      const resolved = theme === 'system' ? (mql.matches ? 'dark' : 'light') : theme
      root.setAttribute('data-theme', resolved)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', resolved === 'dark' ? '#14171A' : '#FAF7F2')
    }

    apply()
    if (theme === 'system') {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
  }, [theme])
}
