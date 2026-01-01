'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useLenis } from '@/providers/LenisProvider'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface ScrollToItem {
  id: string
  text: string
  href: string
}

interface NavigationProps {
  scrollToData: ScrollToItem[]
  waitForHero?: boolean
  heroComplete?: boolean
}

// Register plugin on client side only
if (typeof window !== 'undefined') {
  import('gsap').then(({ default: gsap }) => {
    gsap.registerPlugin(ScrollTrigger)
  })
}

export default function Navigation({ scrollToData, waitForHero = false, heroComplete = false }: NavigationProps) {
  const [activeSection, setActiveSection] = useState<string>('section-intro')
  const [clickedSection, setClickedSection] = useState<string>('section-intro')
  const [expandedSection, setExpandedSection] = useState<string>('')
  const [isRevealed, setIsRevealed] = useState(false)
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({})
  const headerRef = useRef<HTMLElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { scrollTo, isReady: lenisReady } = useLenis()

  useEffect(() => {
    isMountedRef.current = true

    // If waiting for hero animation, don't reveal until heroComplete is true
    if (waitForHero && !heroComplete) {
      return () => {
        isMountedRef.current = false
      }
    }

    // Reveal header after mount (or after hero completes)
    const rafId = requestAnimationFrame(() => {
      if (isMountedRef.current) {
        setIsRevealed(true)
      }
    })

    return () => {
      isMountedRef.current = false
      cancelAnimationFrame(rafId)
    }
  }, [waitForHero, heroComplete])

  // Track active section based on scroll - using ScrollTrigger for horizontal sections
  useEffect(() => {
    if (!lenisReady) return

    isMountedRef.current = true

    // Get all sections with null safety
    const sections = scrollToData
      .map(item => {
        const id = item.href?.replace('#', '') || ''
        return id ? document.getElementById(id) : null
      })
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    // For horizontal sections, we use ScrollTrigger's progress
    // For vertical sections, we use IntersectionObserver
    const horizontalSections = sections.filter(
      s => s.getAttribute('data-scroll-to') === 'horizontal'
    )
    const verticalSections = sections.filter(
      s => s.getAttribute('data-scroll-to') !== 'horizontal'
    )

    const updateHorizontalActive = () => {
      if (!isMountedRef.current) return

      const trigger = ScrollTrigger.getById('horizontalScrollTween')
      if (trigger && horizontalSections.length > 0) {
        const progress = trigger.progress
        // Calculate which horizontal section is active based on progress
        const sectionIndex = Math.floor(progress * horizontalSections.length)
        const clampedIndex = Math.min(sectionIndex, horizontalSections.length - 1)
        const activeHorizontalSection = horizontalSections[clampedIndex]

        if (activeHorizontalSection && progress < 1) {
          setActiveSection(activeHorizontalSection.id)

          // Calculate progress within current section
          const sectionProgress = (progress * horizontalSections.length) % 1

          // Reset ALL section progress (including vertical) and set current one
          const newProgress: Record<string, number> = {}
          sections.forEach(s => {
            newProgress[s.id] = s.id === activeHorizontalSection.id ? sectionProgress * 100 : 0
          })
          setSectionProgress(newProgress)
        }
      }
    }

    // Add scroll listener for horizontal sections
    const scrollHandler = () => {
      requestAnimationFrame(updateHorizontalActive)
    }

    if (horizontalSections.length > 0) {
      window.addEventListener('scroll', scrollHandler, { passive: true })
    }

    // Use IntersectionObserver for vertical sections
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!isMountedRef.current) return

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            // Only update if it's a vertical section or horizontal scroll is complete
            const isVertical = entry.target.getAttribute('data-scroll-to') !== 'horizontal'
            const trigger = ScrollTrigger.getById('horizontalScrollTween')
            const horizontalComplete = !trigger || trigger.progress >= 0.99

            if (isVertical && horizontalComplete) {
              setActiveSection(id)
              // Reset all progress and set current to 100
              const newProgress: Record<string, number> = {}
              sections.forEach(s => {
                newProgress[s.id] = s.id === id ? 100 : 0
              })
              setSectionProgress(newProgress)
            }
          }
        })
      },
      { threshold: 0.5, rootMargin: '-10% 0px -10% 0px' }
    )

    verticalSections.forEach(section => {
      observerRef.current?.observe(section)
    })

    return () => {
      isMountedRef.current = false
      window.removeEventListener('scroll', scrollHandler)
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [scrollToData, lenisReady])

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => {
    e.preventDefault()

    if (!href) return

    const sectionId = href.replace('#', '')
    const element = document.getElementById(sectionId)

    if (!element) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Highlight clicked section
    setClickedSection(sectionId)

    // Temporarily expand clicked section, it will collapse after delay
    setExpandedSection(sectionId)

    // Check if this is a horizontal section
    const isHorizontal = element.getAttribute('data-scroll-to') === 'horizontal'

    if (isHorizontal) {
      // For horizontal sections, calculate the scroll position based on section index
      const horizontalContainer = element.closest('[data-scroll-to="horizontal"]')?.parentElement?.parentElement
      const allHorizontalSections = horizontalContainer?.querySelectorAll('[data-scroll-to="horizontal"]')

      if (allHorizontalSections) {
        const sectionIndex = Array.from(allHorizontalSections).indexOf(element)
        const trigger = ScrollTrigger.getById('horizontalScrollTween')

        if (trigger && sectionIndex >= 0) {
          // Calculate target scroll position
          // For N sections, progress should be: 0, 1/(N-1), 2/(N-1), ..., 1
          const totalSections = allHorizontalSections.length
          const targetProgress = totalSections > 1
            ? sectionIndex / (totalSections - 1)
            : 0
          const scrollStart = trigger.start
          const scrollEnd = trigger.end
          const targetScroll = scrollStart + (scrollEnd - scrollStart) * targetProgress

          scrollTo(targetScroll, { duration: 1.2 })
        }
      }
    } else {
      // For vertical sections, use Lenis scrollTo with element
      scrollTo(element, { offset: 0, duration: 1.2 })
    }

    // Collapse text after delay, but keep highlighted
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setExpandedSection('')
      }
      timeoutRef.current = null
    }, 1200)
  }, [scrollTo])

  // Sync clickedSection with activeSection when scrolling
  // This ensures the highlight follows the current visible section
  useEffect(() => {
    setClickedSection(activeSection)
    // Clear any pending timeout when section changes via scroll
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // Collapse all sections when scrolling
    setExpandedSection('')
  }, [activeSection])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return (
    <header
      ref={headerRef}
      className={`nav-header ${isRevealed ? 'nav-revealed' : ''}`}
      role="banner"
    >
      <Link href="/" className="nav-logo" aria-label="Home">
        <svg
          className="nav-logo-mark"
          viewBox="0 0 40 36"
          fill="none"
          aria-hidden="true"
        >
          {/* Sharp angular T - wider proportions */}
          <path
            d="M0 0H40L37 8H24V36H16V8H3L0 0Z"
            fill="currentColor"
          />
        </svg>
      </Link>
      <nav className="nav-scroll-list" role="navigation" aria-label="Section navigation">
        {scrollToData.map((item) => {
          const sectionId = item.href?.replace('#', '') || ''
          const isActive = activeSection === sectionId
          const isClicked = clickedSection === sectionId
          const isExpanded = expandedSection === sectionId
          const progress = sectionProgress[sectionId] ?? (isActive ? 100 : 0)

          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={`nav-scroll-item ${isActive ? 'nav-active' : ''} ${isClicked ? 'nav-clicked' : ''} ${isExpanded ? 'nav-expanded' : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <div className="nav-scroll-content">
                <span className="nav-scroll-id">{item.id}</span>
                <span className="nav-scroll-text">
                  <span>{item.text}</span>
                </span>
              </div>
              <div
                className="nav-scroll-progress"
                data-progress={sectionId}
                style={{ '--progress': `${progress}%` } as React.CSSProperties}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress through ${item.text} section`}
              />
            </a>
          )
        })}
      </nav>
      <a
        href="#section-contact"
        className="nav-connect-btn"
        onClick={(e) => handleClick(e, '#section-contact')}
        aria-label="Get in touch - scroll to contact section"
      >
        <span className="nav-connect-text">Get in Touch</span>
      </a>
    </header>
  )
}
