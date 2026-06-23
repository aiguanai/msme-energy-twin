import { useEffect, useRef } from 'react'

/**
 * Adds the `reveal-in` entrance animation the first time the element scrolls
 * into view. Hiding is driven by JS (not CSS), so content is never left
 * permanently invisible if the observer is unsupported or misbehaves: a
 * fallback timer reveals everything regardless.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      el.style.opacity = '1'
      return
    }

    const reveal = () => {
      el.style.opacity = ''
      el.style.animationDelay = `${delayMs}ms`
      el.classList.add('reveal-in')
    }

    // Hide now, then reveal on intersection.
    el.style.opacity = '0'

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal()
            obs.disconnect()
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)

    // Safety net: never leave content hidden.
    const fallback = setTimeout(reveal, 1600)

    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [delayMs])

  return ref
}
