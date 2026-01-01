'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ShinyText from './ShinyText'

// Dynamic import for Dither background (client-side only)
const Dither = dynamic(() => import('./Dither'), {
  ssr: false,
  loading: () => null,
})

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Subtle ember spark - tiny glowing point
function createSubtleEmber(container: HTMLElement, index: number) {
  const ember = document.createElement('div')
  ember.className = 'ember-spark'

  // Very small - tiny pinpoints of light (1-3px)
  const size = 1 + Math.random() * 2
  ember.style.width = `${size}px`
  ember.style.height = `${size}px`

  // Spawn across the stat area
  ember.style.left = `${Math.random() * 100}%`
  ember.style.bottom = `${Math.random() * 20}%`

  container.appendChild(ember)

  // Subtle animation parameters
  const lifespan = 3 + Math.random() * 3
  const maxHeight = 60 + Math.random() * 50
  const drift = (Math.random() - 0.5) * 30
  const startDelay = index * 0.2 + Math.random() * 1.5

  // Simple, smooth animation
  const tl = gsap.timeline({
    delay: startDelay,
    repeat: -1,
    repeatDelay: 1 + Math.random() * 2,
    onRepeat: () => {
      gsap.set(ember, {
        left: `${Math.random() * 100}%`,
        bottom: `${Math.random() * 20}%`,
        x: 0,
        y: 0,
      })
    }
  })

  // Fade in
  tl.fromTo(ember,
    { opacity: 0 },
    { opacity: 0.4 + Math.random() * 0.4, duration: 0.5, ease: 'power2.out' }
  )

  // Float up with gentle drift
  tl.to(ember, {
    y: -maxHeight,
    x: drift,
    duration: lifespan,
    ease: 'power1.out',
  }, 0)

  // Gentle sway
  tl.to(ember, {
    x: `+=${(Math.random() - 0.5) * 15}`,
    duration: 1.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: 2,
  }, 0.3)

  // Fade out
  tl.to(ember, {
    opacity: 0,
    duration: lifespan * 0.4,
    ease: 'power2.in',
  }, lifespan * 0.5)

  // Subtle twinkle
  gsap.to(ember, {
    opacity: '+=0.2',
    duration: 0.3 + Math.random() * 0.3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    delay: startDelay + Math.random(),
  })

  return { ember, timeline: tl }
}

// Floating ember component - subtle atmospheric sparks
function FloatingEmbers({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const embersRef = useRef<{ ember: HTMLDivElement; timeline: gsap.core.Timeline }[]>([])

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const emberCount = 15 // Fewer, subtler sparks

    // Clear existing
    embersRef.current.forEach(({ ember, timeline }) => {
      timeline.kill()
      gsap.killTweensOf(ember)
      ember.remove()
    })
    embersRef.current = []

    // Create subtle sparks
    for (let i = 0; i < emberCount; i++) {
      embersRef.current.push(createSubtleEmber(container, i))
    }

    return () => {
      embersRef.current.forEach(({ ember, timeline }) => {
        timeline.kill()
        gsap.killTweensOf(ember)
        ember.remove()
      })
      embersRef.current = []
    }
  }, [active])

  return (
    <div
      ref={containerRef}
      className="absolute -inset-4 overflow-visible pointer-events-none z-10"
      aria-hidden="true"
    />
  )
}

// Glowing stat component with embers
function GlowingStat({
  value,
  suffix,
  label,
  active,
  delay = 0
}: {
  value: string
  suffix: string
  label: string
  active: boolean
  delay?: number
}) {
  const statRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const innerGlowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !statRef.current) return

    const ctx = gsap.context(() => {
      // Outer pulsing glow animation - more dramatic
      if (glowRef.current) {
        gsap.fromTo(glowRef.current,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 0.8,
            scale: 1.4,
            duration: 2.5,
            delay: delay,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }
        )
      }

      // Inner glow pulse - offset timing
      if (innerGlowRef.current) {
        gsap.fromTo(innerGlowRef.current,
          { opacity: 0.3, scale: 1 },
          {
            opacity: 0.7,
            scale: 1.2,
            duration: 1.8,
            delay: delay + 0.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }
        )
      }

      // Much more noticeable floating animation - smooth and fluid
      if (valueRef.current) {
        gsap.fromTo(valueRef.current,
          { y: 0 },
          {
            y: -12, // More pronounced float
            duration: 3,
            delay: delay,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut', // Buttery smooth
          }
        )

        // Add subtle rotation for extra fluidity
        gsap.fromTo(valueRef.current,
          { rotateZ: -0.5 },
          {
            rotateZ: 0.5,
            duration: 4,
            delay: delay + 0.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }
        )

        // Subtle scale breathing
        gsap.fromTo(valueRef.current,
          { scale: 1 },
          {
            scale: 1.02,
            duration: 2.5,
            delay: delay + 0.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }
        )
      }
    }, statRef)

    return () => ctx.revert()
  }, [active, delay])

  return (
    <div ref={statRef} className="stat-item relative py-4">
      {/* Outer background glow - centered on number area, separate from floating */}
      <div
        ref={glowRef}
        className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-20 rounded-full blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, rgba(249,115,22,0.18) 45%, transparent 70%)' }}
      />

      {/* Inner glow - centered on number area */}
      <div
        ref={innerGlowRef}
        className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-16 rounded-full blur-xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(239,68,68,0.18) 50%, transparent 70%)' }}
      />

      {/* Floating embers - outside valueRef */}
      <div className="absolute inset-0">
        <FloatingEmbers active={active} />
      </div>

      {/* Value with floating animation */}
      <div ref={valueRef} className="relative z-10" style={{ willChange: 'transform' }}>
        <div className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-none relative">
          {/* Shadow layer for readability */}
          <span className="absolute inset-0 text-black blur-md opacity-80 select-none pointer-events-none" aria-hidden="true">
            {value}{suffix}
          </span>
          {/* Multi-layer text glow */}
          <span className="absolute inset-0 text-orange-400 blur-lg opacity-40" aria-hidden="true">
            {value}<span>{suffix}</span>
          </span>
          <span className="absolute inset-0 text-red-500 blur-md opacity-60" aria-hidden="true">
            {value}<span>{suffix}</span>
          </span>
          <span className="absolute inset-0 text-red-400 blur-sm opacity-40" aria-hidden="true">
            {value}<span>{suffix}</span>
          </span>
          {/* Main text */}
          <span className="relative">
            {value}<span className="text-red-500">{suffix}</span>
          </span>
        </div>
      </div>

      <div
        className="text-xs md:text-sm text-zinc-300 uppercase tracking-[0.2em] mt-3 relative z-10"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.7)' }}
      >
        {label}
      </div>
    </div>
  )
}

interface PhilosophySectionProps {
  onEnter?: () => void
}

export default function PhilosophySection({ onEnter }: PhilosophySectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const decorativeRef = useRef<HTMLDivElement>(null)
  const transitionGradientRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [embersActive, setEmbersActive] = useState(false)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Initial states - everything hidden
      if (labelRef.current) {
        gsap.set(labelRef.current, { opacity: 0, x: -50 })
      }

      if (headingRef.current) {
        const lines = headingRef.current.querySelectorAll('.heading-line')
        gsap.set(lines, { opacity: 0, y: 80, rotateX: -40 })
      }

      if (textRef.current) {
        const paragraphs = textRef.current.querySelectorAll('p')
        gsap.set(paragraphs, { opacity: 0, y: 40 })
      }

      if (statsRef.current) {
        const statItems = statsRef.current.querySelectorAll('.stat-item')
        gsap.set(statItems, { opacity: 0, y: 60, scale: 0.8 })
      }

      if (imageContainerRef.current) {
        gsap.set(imageContainerRef.current, { opacity: 0, scale: 1.1, x: 100 })
      }

      if (decorativeRef.current) {
        gsap.set(decorativeRef.current, { opacity: 0, scale: 0.8 })
      }

      // Create entrance animation triggered by horizontal scroll progress
      const updateEntranceAnimation = () => {
        const trigger = ScrollTrigger.getById('horizontalScrollTween')
        if (!trigger || hasAnimated) return

        const progress = trigger.progress

        // With 2 sections: Hero (0-0.5), Philosophy (0.5-1)
        // Start animating when approaching Philosophy section
        if (progress > 0.3 && !hasAnimated) {
          setHasAnimated(true)
          setEmbersActive(true)
          playEntranceAnimation()
        }
      }

      const playEntranceAnimation = () => {
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' }
        })

        // Label slides in
        if (labelRef.current) {
          tl.to(labelRef.current, {
            opacity: 1,
            x: 0,
            duration: 0.8,
          })
        }

        // Heading lines reveal with 3D effect
        if (headingRef.current) {
          const lines = headingRef.current.querySelectorAll('.heading-line')
          tl.to(lines, {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: 'power4.out',
          }, '-=0.4')
        }

        // Image slides in with scale
        if (imageContainerRef.current) {
          tl.to(imageContainerRef.current, {
            opacity: 1,
            scale: 1,
            x: 0,
            duration: 1.4,
            ease: 'power2.out',
          }, '-=1')
        }

        // Text fades in
        if (textRef.current) {
          const paragraphs = textRef.current.querySelectorAll('p')
          tl.to(paragraphs, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
          }, '-=0.8')
        }

        // Stats pop in with scale
        if (statsRef.current) {
          const statItems = statsRef.current.querySelectorAll('.stat-item')
          tl.to(statItems, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.2)',
          }, '-=0.6')
        }

        // Decorative number fades in
        if (decorativeRef.current) {
          tl.to(decorativeRef.current, {
            opacity: 1,
            scale: 1,
            duration: 1.5,
            ease: 'power2.out',
          }, '-=1')
        }

        onEnter?.()
      }

      // Use GSAP ticker for smooth updates with Lenis
      gsap.ticker.add(updateEntranceAnimation)

      // Parallax effect on image while scrolling + transition animation
      const updateParallax = () => {
        const trigger = ScrollTrigger.getById('horizontalScrollTween')
        if (!trigger) return

        const progress = trigger.progress

        // Transition gradient - fades as you scroll into Philosophy section
        if (transitionGradientRef.current) {
          // Active during progress 0.2 to 0.7
          const transitionStart = 0.2
          const transitionEnd = 0.7
          const transitionProgress = Math.max(0, Math.min(1, (progress - transitionStart) / (transitionEnd - transitionStart)))
          const eased = gsap.parseEase('power2.out')(transitionProgress)

          // Fade and slide the gradient for parallax effect
          gsap.set(transitionGradientRef.current, {
            x: -80 * eased,
            opacity: 1 - (eased * 0.85),
            scaleX: 1 + (eased * 0.2),
          })
        }

        // Parallax on image
        if (progress > 0.4 && imageRef.current) {
          const parallaxProgress = (progress - 0.4) / 0.6
          gsap.set(imageRef.current, {
            y: -25 * parallaxProgress,
            scale: 1 + (0.04 * parallaxProgress),
          })
        }

        // Decorative element movement
        if (decorativeRef.current && progress > 0.4) {
          const decorProgress = (progress - 0.4) / 0.6
          gsap.set(decorativeRef.current, {
            x: 40 * decorProgress,
          })
        }
      }

      gsap.ticker.add(updateParallax)

      return () => {
        gsap.ticker.remove(updateEntranceAnimation)
        gsap.ticker.remove(updateParallax)
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [hasAnimated, onEnter])

  return (
    <section
      ref={sectionRef}
      id="section-philosophy"
      aria-label="Philosophy"
      data-scroll-to="horizontal"
      className="h-screen w-screen flex-shrink-0 relative overflow-hidden bg-zinc-900"
    >
      {/* Dither Background */}
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={[0.6, 0.1, 0.1]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* Left edge transition gradient - blends from Hero section */}
      <div
        ref={transitionGradientRef}
        className="absolute top-0 left-0 w-[40%] h-full bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent z-[2] pointer-events-none origin-left"
        style={{ willChange: 'transform, opacity' }}
        aria-hidden="true"
      />

      {/* Overlay gradients for depth and readability */}
      <div className="absolute inset-0 z-[1]">
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-zinc-900/30" />

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Content container */}
      <div ref={contentRef} className="relative z-10 h-full flex items-center">
        <div className="w-full max-w-[1800px] mx-auto px-8 md:px-16 lg:px-24 xl:px-32 flex items-center gap-8 lg:gap-16 xl:gap-24">

          {/* Left side - Text content */}
          <div className="flex-1 max-w-3xl">
            {/* Section label */}
            <div ref={labelRef} className="mb-6 md:mb-8">
              <span
                className="inline-block text-red-500 text-xs md:text-sm font-bold tracking-[0.3em] uppercase border-l-2 border-red-500 pl-4"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)' }}
              >
                II. Philosophy
              </span>
            </div>

            {/* Main heading with perspective */}
            <h2
              ref={headingRef}
              className="mb-6 md:mb-8 leading-[0.85]"
              style={{ perspective: '1000px' }}
            >
              <span className="heading-line block text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black tracking-[-0.02em] relative">
                {/* Shadow layer behind text */}
                <span className="absolute inset-0 text-black blur-md opacity-70 select-none pointer-events-none" aria-hidden="true">CHAMPIONS</span>
                <ShinyText
                  text="CHAMPIONS"
                  color="#ffffff"
                  shineColor="#f87171"
                  speed={3}
                  delay={0.5}
                />
              </span>
              <span className="heading-line block text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black tracking-[-0.02em] relative">
                {/* Shadow layer behind text */}
                <span className="absolute inset-0 text-black blur-md opacity-70 select-none pointer-events-none" aria-hidden="true">ARE MADE,</span>
                <ShinyText
                  text="ARE MADE,"
                  color="#ef4444"
                  shineColor="#fef2f2"
                  speed={3}
                  delay={1}
                />
              </span>
              <span className="heading-line block text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black tracking-[-0.02em] relative">
                {/* Shadow layer behind text */}
                <span className="absolute inset-0 text-black blur-md opacity-70 select-none pointer-events-none" aria-hidden="true">NOT BORN.</span>
                <ShinyText
                  text="NOT BORN."
                  color="#ffffff"
                  shineColor="#f87171"
                  speed={3}
                  delay={1.5}
                />
              </span>
            </h2>

            {/* Philosophy text */}
            <div ref={textRef} className="max-w-xl mb-8 md:mb-12">
              <p
                className="text-base md:text-lg lg:text-xl text-zinc-300 leading-relaxed mb-4"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.7)' }}
              >
                Excellence isn't inherited—it's earned through relentless dedication,
                strategic thinking, and the courage to push beyond your limits.
              </p>
              <p
                className="text-base md:text-lg lg:text-xl text-zinc-400 leading-relaxed"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.7)' }}
              >
                Every elite athlete started where you are now. The difference is
                what happens next.
              </p>
            </div>

            {/* Stats with floating ember animations */}
            <div ref={statsRef} className="flex flex-wrap gap-8 md:gap-12 lg:gap-16">
              <GlowingStat
                value="15"
                suffix="+"
                label="Years Experience"
                active={embersActive}
                delay={0}
              />
              <GlowingStat
                value="7"
                suffix="+"
                label="Athletes Trained"
                active={embersActive}
                delay={0.3}
              />
              <GlowingStat
                value="98"
                suffix="%"
                label="Success Rate"
                active={embersActive}
                delay={0.6}
              />
            </div>
          </div>

          {/* Right side - Portrait with dramatic framing */}
          <div
            ref={imageContainerRef}
            className="hidden lg:block flex-shrink-0 relative"
          >
            <div className="relative w-[350px] xl:w-[420px] 2xl:w-[480px] h-[500px] xl:h-[600px] 2xl:h-[700px]">
              {/* Dramatic red accent lighting */}
              <div className="absolute -inset-4 bg-gradient-to-br from-red-500/30 via-red-600/10 to-transparent blur-2xl" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-red-500/20 to-transparent blur-xl" />

              {/* Frame border */}
              <div className="absolute inset-0 border border-white/10" />
              <div className="absolute top-2 left-2 right-2 bottom-2 border border-red-500/30" />

              {/* Image */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  ref={imageRef}
                  src="/images/tyus-portrait.jpeg"
                  alt="Tyus S. - Elite Football Coach"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Cinematic overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/40 to-transparent" />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500" />

              {/* Name badge */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-zinc-900/90 backdrop-blur-sm border border-white/10 px-4 py-3">
                  <div
                    className="text-white font-bold text-sm tracking-wider uppercase"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    Tyus S.
                  </div>
                  <div
                    className="text-red-500 text-xs tracking-[0.2em] uppercase mt-1"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    Elite Performance Coach
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large decorative number - more subtle */}
      <div
        ref={decorativeRef}
        className="absolute -right-20 top-1/2 -translate-y-1/2 text-[35vw] font-black text-white/[0.02] leading-none pointer-events-none select-none"
        style={{ fontFamily: 'system-ui' }}
      >
        II
      </div>

      {/* Bottom edge gradient for transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
    </section>
  )
}
