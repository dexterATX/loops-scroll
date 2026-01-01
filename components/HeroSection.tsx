'use client'

import { useEffect, useRef, useState } from 'react'
import { useLenis } from '@/providers/LenisProvider'
import gsap from 'gsap'

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
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const [animationComplete, setAnimationComplete] = useState(false)
  const { isReady: lenisReady, enableScroll } = useLenis()

  useEffect(() => {
    if (!lenisReady || !containerRef.current || !wordsContainerRef.current) return

    const ctx = gsap.context(() => {
      // Calculate word height for positioning
      const wordHeight = wordRefs.current[0]?.offsetHeight || 150
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
      wordRefs.current.forEach((word) => {
        gsap.set(word, {
          y: window.innerHeight,
        })
      })

      gsap.set(subtitleRef.current, {
        opacity: 0,
      })

      gsap.set(scrollIndicatorRef.current, {
        opacity: 0,
        y: 20,
      })

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
      tl.to(wordRefs.current[0], {
        y: 0,
        duration: 1.8,
        ease: bounceEase,
      })

      // Each subsequent word comes in AND pushes the container up
      for (let i = 1; i < totalWords; i++) {
        // New word slides in with subtle overshoot
        tl.to(wordRefs.current[i], {
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
      const containerWidth = wordsContainerRef.current?.offsetWidth || 0

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
      tl.to(subtitleRef.current, {
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
      }, '<0.2')

      // Fade in scroll indicator
      tl.to(scrollIndicatorRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=1')

      timelineRef.current = tl
    }, containerRef)

    return () => {
      ctx.revert()
    }
  }, [lenisReady, enableScroll])

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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center overflow-hidden"
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-transparent z-0" />

      {/* Background image placeholder (right side) */}
      <div className="absolute right-0 top-0 w-1/2 h-full opacity-30 z-0">
        <div className="w-full h-full bg-gradient-to-l from-zinc-800 to-transparent" />
      </div>

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
        >
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            Scroll to discover
          </span>
          <div className="arrow-line w-20 h-[2px] bg-white origin-left scale-x-0" />
        </div>
      </div>
    </div>
  )
}
