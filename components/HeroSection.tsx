'use client'

import { useEffect, useRef, useState } from 'react'
import { useLenis } from '@/providers/LenisProvider'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register plugin on client side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroSectionProps {
  words?: string[]
  subtitle?: string
  author?: string
  onAnimationComplete?: () => void
}

const defaultWords = ['EDUCATOR', 'COACH', 'MENTOR', 'CONSULTANT']

export default function HeroSection({
  words = defaultWords,
  subtitle = 'Design mentorship',
  author = 'by Won J. You',
  onAnimationComplete
}: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wordsContainerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLDivElement | null)[]>([])
  const subtitleRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const revealOverlayRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const containerWidthRef = useRef<number>(0)
  const [animationComplete, setAnimationComplete] = useState(false)
  const { isReady: lenisReady, enableScroll } = useLenis()

  // Handle reduced motion preference for video
  useEffect(() => {
    if (!videoRef.current) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const handleMotionPreference = (e: MediaQueryListEvent | MediaQueryList) => {
      if (videoRef.current) {
        if (e.matches) {
          videoRef.current.pause()
        } else {
          videoRef.current.play()
        }
      }
    }

    // Check initial preference
    handleMotionPreference(mediaQuery)

    // Listen for changes
    mediaQuery.addEventListener('change', handleMotionPreference)
    return () => mediaQuery.removeEventListener('change', handleMotionPreference)
  }, [])

  useEffect(() => {
    if (!lenisReady || !containerRef.current || !wordsContainerRef.current) return

    const ctx = gsap.context(() => {
      // Calculate word height for positioning
      const firstWord = wordRefs.current[0]
      const wordHeight = firstWord?.offsetHeight ?? 150
      const totalWords = wordRefs.current.length
      const totalHeight = wordHeight * totalWords

      // Final position is y=0 (centered by flexbox)
      // We need to push (totalWords - 1) times to get from start to y=0
      // So starting y = (totalWords - 1) * wordHeight
      const pushPerWord = wordHeight
      const totalPushNeeded = (totalWords - 1) * pushPerWord
      const startY = totalPushNeeded

      // Position container so first word will be at bottom of screen when it arrives
      gsap.set(wordsContainerRef.current, {
        y: startY,
        x: 0,
      })

      // All words start below their position in the container
      const validWordRefs = wordRefs.current.filter(Boolean)
      validWordRefs.forEach((word) => {
        gsap.set(word, {
          y: window.innerHeight,
        })
      })

      if (subtitleRef.current) {
        gsap.set(subtitleRef.current, {
          opacity: 0,
        })
      }

      if (scrollIndicatorRef.current) {
        gsap.set(scrollIndicatorRef.current, {
          opacity: 0,
          y: 20,
        })
      }

      // Set reveal overlay to fully opaque (black) initially
      if (revealOverlayRef.current) {
        gsap.set(revealOverlayRef.current, {
          opacity: 1,
        })
      }

      // Create master timeline
      const tl = gsap.timeline({
        onComplete: () => {
          setAnimationComplete(true)
          enableScroll() // Enable scrolling after hero animation completes
          onAnimationComplete?.()
        },
      })

      // Minimal overshoot easing
      const bounceEase = 'back.out(1.1)'
      // Smooth easing for container push
      const pushEase = 'power3.out'

      // First word comes in with subtle overshoot
      if (firstWord) {
        tl.to(firstWord, {
          y: 0,
          duration: 1.8,
          ease: bounceEase,
        })
      }


      // Each subsequent word comes in AND pushes the container up
      for (let i = 1; i < totalWords; i++) {
        const wordRef = wordRefs.current[i]
        if (!wordRef) continue
        // New word slides in with subtle overshoot
        tl.to(wordRef, {
          y: 0,
          duration: 1.8,
          ease: bounceEase,
        })
        // Container moves up as word arrives
        tl.to(wordsContainerRef.current, {
          y: `-=${pushPerWord}`,
          duration: 1,
          ease: pushEase,
        }, '<0.5')
      }

      // Slide words to the left AND transition from centered to left-aligned
      containerWidthRef.current = wordsContainerRef.current?.offsetWidth ?? 0
      const containerWidth = containerWidthRef.current

      // First, slide the container - stop just after navbar (5rem + spacing)
      tl.to(wordsContainerRef.current, {
        x: '-5vw',
        duration: 1.2,
        ease: 'power2.inOut',
      }, '+=0.3')

      // Simultaneously, shift each word to left-align them
      // Each word needs to move left by (containerWidth - wordWidth) / 2
      wordRefs.current.forEach((word) => {
        if (word) {
          const wordWidth = word.offsetWidth
          const shiftAmount = -(containerWidth - wordWidth) / 2
          tl.to(word, {
            x: shiftAmount,
            duration: 1.2,
            ease: 'power2.inOut',
          }, '<') // Same timing as container slide
        }
      })

      // Fade in subtitle as words slide left
      if (subtitleRef.current) {
        tl.to(subtitleRef.current, {
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        }, '<0.2')
      }

      // Fade in scroll indicator
      if (scrollIndicatorRef.current) {
        tl.to(scrollIndicatorRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        }, '-=1')
      }

      // Cinematic reveal overlay - fades out independently (doesn't extend timeline)
      // Smooth, liquid fade that reveals the video background
      if (revealOverlayRef.current) {
        gsap.to(revealOverlayRef.current, {
          opacity: 0,
          duration: tl.duration(), // Match the total animation duration
          ease: 'power1.inOut', // Smooth, liquid easing
        })
      }

      timelineRef.current = tl
    }, containerRef)

    // Handle resize to update containerWidth ref
    const handleResize = () => {
      if (wordsContainerRef.current) {
        containerWidthRef.current = wordsContainerRef.current.offsetWidth
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      ctx.revert()
    }
  }, [lenisReady, enableScroll, onAnimationComplete])

  // Scroll indicator line animation
  useEffect(() => {
    if (!animationComplete || !scrollIndicatorRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 })

      // Draw line from left to right
      tl.to('.arrow-line', {
        scaleX: 1,
        duration: 0.6,
        ease: 'power2.out',
      })
      // Pause briefly
      .to({}, { duration: 0.3 })
      // Retract from left
      .set('.arrow-line', { transformOrigin: 'right' })
      .to('.arrow-line', {
        scaleX: 0,
        duration: 0.6,
        ease: 'power2.in',
      })
      // Reset for next loop
      .set('.arrow-line', { transformOrigin: 'left' })
    }, scrollIndicatorRef)

    return () => ctx.revert()
  }, [animationComplete])

  // Scroll-based exit transition - fades out hero content as user scrolls to next section
  useEffect(() => {
    if (!animationComplete) return

    const updateExitAnimation = () => {
      // Get the horizontal scroll trigger
      const trigger = ScrollTrigger.getById('horizontalScrollTween')
      if (!trigger) return

      // Get progress (0 to 1 across both horizontal sections)
      const progress = trigger.progress

      // Hero exit animation - fade out during first half of scroll
      const exitProgress = Math.min(progress * 2, 1)
      const eased = gsap.parseEase('power2.inOut')(exitProgress)

      // Fade out and move up the words container
      if (wordsContainerRef.current) {
        gsap.set(wordsContainerRef.current, {
          opacity: 1 - eased,
          y: -100 * eased,
          scale: 1 - (0.05 * eased),
        })
      }

      // Fade out subtitle
      if (subtitleRef.current) {
        const subtitleEased = gsap.parseEase('power2.out')(Math.min(progress * 3, 1))
        gsap.set(subtitleRef.current, {
          opacity: 1 - subtitleEased,
          y: -50 * subtitleEased,
        })
      }

      // Fade out scroll indicator (fastest)
      if (scrollIndicatorRef.current) {
        const indicatorEased = gsap.parseEase('power2.out')(Math.min(progress * 5, 1))
        gsap.set(scrollIndicatorRef.current, {
          opacity: 1 - indicatorEased,
        })
      }

      // Parallax zoom on video - creates depth as you scroll away
      if (videoRef.current) {
        gsap.set(videoRef.current, {
          scale: 1 + (0.2 * progress),
          opacity: 1 - (progress * 0.3), // Subtle fade
        })
      }
    }

    // Use GSAP ticker instead of window scroll (works with Lenis smooth scroll)
    gsap.ticker.add(updateExitAnimation)

    // Initial call
    updateExitAnimation()

    return () => {
      gsap.ticker.remove(updateExitAnimation)
    }
  }, [animationComplete])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center overflow-hidden"
    >
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        aria-hidden="true"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50 z-[1]" aria-hidden="true" />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-transparent z-[2]" aria-hidden="true" />

      {/* Right edge transition gradient - fades to dark for smooth section transition */}
      <div
        className="absolute top-0 right-0 w-[30%] h-full bg-gradient-to-l from-zinc-900 via-zinc-900/60 to-transparent z-[3] pointer-events-none"
        aria-hidden="true"
      />

      {/* Sharp red/black border line at section edge */}
      <div
        className="absolute top-0 right-0 h-full w-[6px] z-[5] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #000000 0%, #000000 20%, #ef4444 50%, #000000 80%, #000000 100%)',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)',
        }}
        aria-hidden="true"
      />

      {/* Cinematic reveal overlay - starts black, fades out slowly */}
      <div
        ref={revealOverlayRef}
        className="absolute inset-0 bg-zinc-900 z-[400] pointer-events-none"
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative z-[500] w-full h-full flex flex-col items-center justify-center">
        {/* Subtitle - positioned above words, centered */}
        <div
          ref={subtitleRef}
          className="absolute top-8 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-sm md:text-base text-zinc-400 tracking-wider uppercase">
            {subtitle}
          </p>
          <p className="text-sm md:text-base text-zinc-500 mt-1">
            {author}
          </p>
        </div>

        {/* Words container - centered text */}
        <div
          ref={wordsContainerRef}
          className="flex flex-col items-center gap-0 leading-none"
        >
          {words.map((word, index) => (
            <div
              key={word}
              ref={(el) => { wordRefs.current[index] = el }}
              className="hero-word text-center"
            >
              <span className="hero-text text-[14vw] md:text-[13vw] lg:text-[12vw] font-black text-red-500 tracking-[-0.04em] leading-[0.85] select-none uppercase bg-transparent">
                {word}
              </span>
            </div>
          ))}
        </div>

        {/* Scroll indicator - bottom left, aligned with words */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-12 left-[6.5rem] flex items-center gap-3"
          role="status"
          aria-live="polite"
        >
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            Scroll to discover
          </span>
          <div className="arrow-line w-20 h-[2px] bg-white origin-left scale-x-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
