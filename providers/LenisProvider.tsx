'use client'

import { useEffect, useRef, createContext, useContext, ReactNode, useState, useMemo, useCallback } from 'react'
import type Lenis from '@studio-freight/lenis'

// Define context value type - using Lenis type from import
interface LenisContextValue {
  lenis: Lenis | null
  isReady: boolean
  scrollTo: (target: string | HTMLElement | number, options?: { offset?: number; duration?: number }) => void
  enableScroll: () => void
  disableScroll: () => void
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  isReady: false,
  scrollTo: () => {},
  enableScroll: () => {},
  disableScroll: () => {}
})

export function useLenis() {
  return useContext(LenisContext)
}

interface LenisProviderProps {
  children: ReactNode
}

export default function LenisProvider({ children }: LenisProviderProps) {
  // Use state for lenis instance to trigger context updates when it changes
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs for cleanup functions that don't need to trigger re-renders
  const tickerRemoverRef = useRef<(() => void) | null>(null)
  const scrollHandlerRef = useRef<(() => void) | null>(null)
  const isMountedRef = useRef(true)
  // Ref to always have access to the current Lenis instance (avoids stale closures)
  const lenisRef = useRef<Lenis | null>(null)
  // Counter to track initialization attempts (for Strict Mode race condition)
  const initIdRef = useRef(0)

  useEffect(() => {
    isMountedRef.current = true
    // Clear error state on remount
    setError(null)
    // Increment init ID to track this specific initialization
    const currentInitId = ++initIdRef.current

    // Local variables for cleanup closure
    let localLenis: Lenis | null = null
    let localGsap: typeof import('gsap').default | null = null
    let localScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null

    // Dynamically import GSAP and Lenis to avoid SSR issues
    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('@studio-freight/lenis')
    ])
      .then(([gsapMod, scrollTriggerMod, lenisMod]) => {
        // Check if still mounted and this is the current init (Strict Mode race condition fix)
        if (!isMountedRef.current || currentInitId !== initIdRef.current) return

        localGsap = gsapMod.default
        localScrollTrigger = scrollTriggerMod.ScrollTrigger
        const LenisClass = lenisMod.default

        // Register ScrollTrigger plugin
        localGsap.registerPlugin(localScrollTrigger)

        // Initialize Lenis - we'll drive it via GSAP ticker for better sync
        // Note: In Lenis 1.0.x, there's no autoRaf option - we just call raf() manually
        localLenis = new LenisClass({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        })

        // Check again after constructor (both mounted and current init)
        if (!isMountedRef.current || currentInitId !== initIdRef.current) {
          localLenis.destroy()
          return
        }

        // Capture references for use in callbacks
        const gsap = localGsap
        const ScrollTrigger = localScrollTrigger
        const lenis = localLenis

        // Update ScrollTrigger on Lenis scroll
        const scrollHandler = () => {
          if (ScrollTrigger && typeof ScrollTrigger.update === 'function') {
            ScrollTrigger.update()
          }
        }
        scrollHandlerRef.current = scrollHandler
        lenis.on('scroll', scrollHandler)

        // Add Lenis RAF to GSAP ticker
        const tickerUpdate = (time: number) => {
          if (lenis && isMountedRef.current) {
            lenis.raf(time * 1000)
          }
        }

        // Add mounted check before ticker.add
        if (!isMountedRef.current || currentInitId !== initIdRef.current) {
          lenis.destroy()
          return
        }

        gsap.ticker.add(tickerUpdate)
        gsap.ticker.lagSmoothing(0)

        // Store the remover function
        tickerRemoverRef.current = () => {
          gsap.ticker.remove(tickerUpdate)
        }

        // Start with scrolling disabled - will be enabled after hero animation
        lenis.stop()

        // Store in ref for callbacks to use (avoids stale closures)
        lenisRef.current = lenis

        // Set state to trigger context update - this makes lenis available to consumers
        setLenisInstance(lenis)
        setIsReady(true)

        if (process.env.NODE_ENV === 'development') {
          console.log('Lenis initialized with GSAP ScrollTrigger (scrolling disabled until hero completes)')
        }
      })
      .catch((err) => {
        // Check if still mounted before setting error state
        if (!isMountedRef.current) return
        console.error('Failed to initialize Lenis/GSAP:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
      })

    // Cleanup function
    return () => {
      isMountedRef.current = false

      // Remove GSAP ticker callback first
      if (tickerRemoverRef.current) {
        tickerRemoverRef.current()
        tickerRemoverRef.current = null
      }

      // Remove scroll handler before destroying Lenis
      if (localLenis && scrollHandlerRef.current) {
        localLenis.off('scroll', scrollHandlerRef.current)
        scrollHandlerRef.current = null
      }

      // Destroy Lenis instance
      if (localLenis) {
        localLenis.destroy()
        localLenis = null
      }

      // Clear the ref
      lenisRef.current = null

      // Note: We don't call setIsReady(false) here because component is unmounting
      // and calling setState on unmounted component is unnecessary
    }
  }, [])

  // Memoized scrollTo function that uses lenisRef to avoid stale closures
  const scrollTo = useCallback((
    target: string | HTMLElement | number,
    options?: { offset?: number; duration?: number }
  ) => {
    // Use ref to always get current instance (avoids stale closure issues)
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options)
    }
  }, [])

  // Enable scrolling (call after hero animation completes)
  const enableScroll = useCallback(() => {
    // Use ref to always get current instance (avoids stale closure issues)
    if (lenisRef.current) {
      lenisRef.current.start()
    }
  }, [])

  // Disable scrolling
  const disableScroll = useCallback(() => {
    // Use ref to always get current instance (avoids stale closure issues)
    if (lenisRef.current) {
      lenisRef.current.stop()
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<LenisContextValue>(() => ({
    lenis: lenisInstance,
    isReady,
    scrollTo,
    enableScroll,
    disableScroll
  }), [lenisInstance, isReady, scrollTo, enableScroll, disableScroll])

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-100 text-red-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Initialization Error</h2>
          <p className="text-red-700">{error.message}</p>
          <p className="text-sm text-red-600 mt-2">Please refresh the page</p>
        </div>
      </div>
    )
  }

  return (
    <LenisContext.Provider value={contextValue}>
      {children}
    </LenisContext.Provider>
  )
}
