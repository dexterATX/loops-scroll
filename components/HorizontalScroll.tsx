'use client'

import { useEffect, useRef, ReactNode, useCallback } from 'react'
import { useLenis } from '@/providers/LenisProvider'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface HorizontalScrollProps {
  children: ReactNode
}

// Register plugin on client side only
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function HorizontalScroll({ children }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
  const ctxRef = useRef<gsap.Context | null>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const { isReady: lenisReady } = useLenis()

  // Memoized resize handler to avoid recreating on each render
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        ScrollTrigger.refresh()
      }
    }, 250)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current

    // Reset mounted flag
    isMountedRef.current = true

    if (!container || !inner || !lenisReady) {
      return () => {
        isMountedRef.current = false
      }
    }

    // Initialize ScrollTrigger with proper cleanup
    const initScrollTrigger = () => {
      // Guard against unmounted component
      if (!isMountedRef.current || !inner || !container) return

      // Get all direct children sections
      const sections = Array.from(inner.children) as HTMLElement[]

      if (sections.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('HorizontalScroll: No sections found')
        }
        return
      }

      // Calculate total width
      let totalWidth = 0
      sections.forEach((section) => {
        totalWidth += section.offsetWidth
      })

      const scrollDistance = totalWidth - window.innerWidth

      if (scrollDistance <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('HorizontalScroll: Content is narrower than viewport, no scroll needed')
        }
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('HorizontalScroll init:', {
          sectionsCount: sections.length,
          totalWidth,
          windowWidth: window.innerWidth,
          scrollDistance
        })
      }

      try {
        // Create GSAP context for proper cleanup - store in ref immediately
        ctxRef.current = gsap.context(() => {
          // Double check mount status inside context callback
          if (!isMountedRef.current) return

          const tween = gsap.to(inner, {
            x: -scrollDistance,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              pin: true,
              scrub: 1,
              start: 'top top',
              end: `+=${scrollDistance}`,
              invalidateOnRefresh: true,
              refreshPriority: 10,
              id: 'horizontalScrollTween',
              // Add markers in development for debugging
              ...(process.env.NODE_ENV === 'development' && {
                markers: { startColor: 'green', endColor: 'red', fontSize: '12px' }
              })
            },
          })

          // Store reference for cleanup
          scrollTriggerRef.current = tween.scrollTrigger || null

          if (process.env.NODE_ENV === 'development') {
            console.log('GSAP ScrollTrigger created for horizontal scroll')
          }
        }, container)

        // Add resize handler
        window.addEventListener('resize', handleResize)

      } catch (error) {
        console.error('HorizontalScroll: Failed to create ScrollTrigger', error)
      }
    }

    // Use requestAnimationFrame for proper timing
    const rafId = requestAnimationFrame(() => {
      // Check if still mounted before initializing
      if (isMountedRef.current) {
        initScrollTrigger()
      }
    })

    // Cleanup function
    return () => {
      // Mark as unmounted first to prevent any async operations
      isMountedRef.current = false

      // Cancel pending RAF
      cancelAnimationFrame(rafId)

      // Clear resize timeout - CRITICAL: prevents timeout from firing after unmount
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
        resizeTimeoutRef.current = null
      }

      // Remove resize listener
      window.removeEventListener('resize', handleResize)

      // Kill specific ScrollTrigger
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill()
        scrollTriggerRef.current = null
      }

      // Revert GSAP context - use ref to ensure we have the correct reference
      if (ctxRef.current) {
        ctxRef.current.revert()
        ctxRef.current = null
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('HorizontalScroll: Cleanup complete')
      }
    }
  }, [lenisReady, handleResize])

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      <div
        ref={innerRef}
        className="flex h-full"
        style={{ width: 'max-content' }}
      >
        {children}
      </div>
    </div>
  )
}
