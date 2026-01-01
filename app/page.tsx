'use client'

import { useState, useCallback } from 'react'
import HorizontalScroll from '@/components/HorizontalScroll'
import VerticalSection from '@/components/VerticalSection'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'

const scrollToData = [
  { id: 'I.', text: 'Intro', href: '#section-intro' },
  { id: 'II.', text: 'Philosophy', href: '#section-philosophy' },
  { id: 'III.', text: 'Experience', href: '#section-experience' },
  { id: 'IV.', text: 'Achievements', href: '#section-achievements' },
  { id: 'V.', text: 'Programs', href: '#section-programs' },
  { id: 'VI.', text: 'Contact', href: '#section-contact' },
]

export default function Home() {
  const [heroAnimationComplete, setHeroAnimationComplete] = useState(false)

  const handleHeroComplete = useCallback(() => {
    setHeroAnimationComplete(true)
  }, [])

  return (
    <>
      <Navigation
        scrollToData={scrollToData}
        waitForHero={true}
        heroComplete={heroAnimationComplete}
      />
      <main className="bg-zinc-900 text-white">
      {/* Horizontal Scroll Container - scrolls horizontally first */}
      <HorizontalScroll>
        {/* Hero Section with animated words */}
        <section
          id="section-intro"
          data-scroll-to="horizontal"
          className="h-screen w-screen flex-shrink-0 bg-zinc-900"
        >
          <HeroSection
            words={['EDUCATOR', 'COACH', 'MENTOR', 'CONSULTANT']}
            subtitle="Elite football coaching"
            author="by Tyus S."
            onAnimationComplete={handleHeroComplete}
          />
        </section>

        {/* Philosophy Section - last horizontal section */}
        <section
          id="section-philosophy"
          data-scroll-to="horizontal"
          className="h-screen w-screen flex-shrink-0 flex items-center justify-center bg-zinc-800"
        >
          <div className="max-w-4xl px-8 text-center">
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8">Philosophy</h2>
            <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed">
              Design is not just what it looks like and feels like. Design is how it works.
            </p>
          </div>
        </section>
      </HorizontalScroll>

      {/* Vertical Sections - scroll normally after horizontal completes */}
      <VerticalSection id="section-experience" className="bg-zinc-800">
        <h1 className="text-8xl font-bold">EXPERIENCE</h1>
      </VerticalSection>

      <VerticalSection id="section-achievements" className="bg-zinc-700">
        <h1 className="text-8xl font-bold">ACHIEVEMENTS</h1>
      </VerticalSection>

      <VerticalSection id="section-programs" className="bg-zinc-600">
        <h1 className="text-8xl font-bold">PROGRAMS</h1>
      </VerticalSection>

      <VerticalSection id="section-contact" className="bg-zinc-500">
        <h1 className="text-8xl font-bold">CONTACT</h1>
      </VerticalSection>
    </main>
    </>
  )
}
