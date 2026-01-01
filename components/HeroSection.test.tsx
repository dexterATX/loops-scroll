import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import HeroSection from './HeroSection'
import * as LenisProvider from '@/providers/LenisProvider'

// Mock the useLenis hook
const mockScrollTo = vi.fn()
const mockLenis = {
  on: vi.fn(),
  off: vi.fn(),
  raf: vi.fn(),
  destroy: vi.fn(),
  scrollTo: vi.fn(),
}

describe('HeroSection', () => {
  beforeEach(() => {
    vi.spyOn(LenisProvider, 'useLenis').mockReturnValue({
      lenis: mockLenis as any,
      isReady: true,
      scrollTo: mockScrollTo,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should render all 4 default words', () => {
    render(<HeroSection />)

    expect(screen.getByText('EDUCATOR')).toBeInTheDocument()
    expect(screen.getByText('COACH')).toBeInTheDocument()
    expect(screen.getByText('MENTOR')).toBeInTheDocument()
    expect(screen.getByText('CONSULTANT')).toBeInTheDocument()
  })

  it('should render custom words when provided', () => {
    render(<HeroSection words={['DESIGNER', 'DEVELOPER', 'CREATOR']} />)

    expect(screen.getByText('DESIGNER')).toBeInTheDocument()
    expect(screen.getByText('DEVELOPER')).toBeInTheDocument()
    expect(screen.getByText('CREATOR')).toBeInTheDocument()
    expect(screen.queryByText('EDUCATOR')).not.toBeInTheDocument()
  })

  it('should render subtitle and author', () => {
    render(
      <HeroSection
        subtitle="Test subtitle"
        author="by Test Author"
      />
    )

    expect(screen.getByText('Test subtitle')).toBeInTheDocument()
    expect(screen.getByText('by Test Author')).toBeInTheDocument()
  })

  it('should render scroll indicator', () => {
    render(<HeroSection />)

    expect(screen.getByText('Scroll to discover')).toBeInTheDocument()
  })

  it('should render words with hero-word class', () => {
    const { container } = render(<HeroSection />)

    const heroWords = container.querySelectorAll('.hero-word')
    expect(heroWords).toHaveLength(4)
  })

  it('should have proper text styling classes', () => {
    render(<HeroSection />)

    const educator = screen.getByText('EDUCATOR')
    expect(educator).toHaveClass('hero-text')
    expect(educator).toHaveClass('font-black')
    expect(educator).toHaveClass('uppercase')
  })

  it('should render background gradient overlay', () => {
    const { container } = render(<HeroSection />)

    const gradient = container.querySelector('.bg-gradient-to-r')
    expect(gradient).toBeInTheDocument()
  })

  describe('when Lenis is not ready', () => {
    beforeEach(() => {
      vi.spyOn(LenisProvider, 'useLenis').mockReturnValue({
        lenis: null,
        isReady: false,
        scrollTo: mockScrollTo,
      })
    })

    it('should still render content', () => {
      render(<HeroSection />)

      expect(screen.getByText('EDUCATOR')).toBeInTheDocument()
      expect(screen.getByText('COACH')).toBeInTheDocument()
    })
  })
})
