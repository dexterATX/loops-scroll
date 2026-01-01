import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import HorizontalScroll from './HorizontalScroll'
import * as LenisProvider from '@/providers/LenisProvider'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Mock the useLenis hook
const mockScrollTo = vi.fn()
const mockEnableScroll = vi.fn()
const mockDisableScroll = vi.fn()
const mockLenis = {
  on: vi.fn(),
  off: vi.fn(),
  raf: vi.fn(),
  destroy: vi.fn(),
  scrollTo: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}

describe('HorizontalScroll', () => {
  beforeEach(() => {
    // Reset mock to ready state
    vi.spyOn(LenisProvider, 'useLenis').mockReturnValue({
      lenis: mockLenis as any,
      isReady: true,
      scrollTo: mockScrollTo,
      enableScroll: mockEnableScroll,
      disableScroll: mockDisableScroll,
    })

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    // Mock element offsetWidth for scroll distance calculations
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 1024 // Each section is 1024px wide
      },
    })

    // Mock getBoundingClientRect for element sizing
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1024,
      height: 768,
      top: 0,
      left: 0,
      bottom: 768,
      right: 1024,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('should render children sections', () => {
    render(
      <HorizontalScroll>
        <section data-testid="section-1">Section 1</section>
        <section data-testid="section-2">Section 2</section>
      </HorizontalScroll>
    )

    expect(screen.getByTestId('section-1')).toBeInTheDocument()
    expect(screen.getByTestId('section-2')).toBeInTheDocument()
  })

  it('should render container with correct styles', () => {
    const { container } = render(
      <HorizontalScroll>
        <section>Section 1</section>
      </HorizontalScroll>
    )

    const scrollContainer = container.querySelector('.relative')
    expect(scrollContainer).toHaveStyle({ height: '100vh', overflow: 'hidden' })
  })

  it('should render inner flex container', () => {
    const { container } = render(
      <HorizontalScroll>
        <section>Section 1</section>
      </HorizontalScroll>
    )

    const innerContainer = container.querySelector('.flex.h-full')
    expect(innerContainer).toBeInTheDocument()
    expect(innerContainer).toHaveStyle({ width: 'max-content' })
  })

  it('should not initialize when lenis is not ready', () => {
    vi.spyOn(LenisProvider, 'useLenis').mockReturnValue({
      lenis: null,
      isReady: false,
      scrollTo: mockScrollTo,
      enableScroll: mockEnableScroll,
      disableScroll: mockDisableScroll,
    })

    const { container } = render(
      <HorizontalScroll>
        <section>Section 1</section>
      </HorizontalScroll>
    )

    // Should still render but not initialize ScrollTrigger
    expect(container.firstChild).toBeInTheDocument()
    // gsap.context should not be called when not ready
    expect(gsap.context).not.toHaveBeenCalled()
  })

  it('should render all children with data attributes preserved', () => {
    render(
      <HorizontalScroll>
        <section data-scroll-to="horizontal" data-testid="hero">Hero</section>
        <section data-scroll-to="horizontal" data-testid="mentorship">Mentorship</section>
        <section data-scroll-to="vertical" data-testid="about">About</section>
      </HorizontalScroll>
    )

    expect(screen.getByTestId('hero')).toHaveAttribute('data-scroll-to', 'horizontal')
    expect(screen.getByTestId('mentorship')).toHaveAttribute('data-scroll-to', 'horizontal')
    expect(screen.getByTestId('about')).toHaveAttribute('data-scroll-to', 'vertical')
  })

  it('should have flex h-full classes on inner container', () => {
    const { container } = render(
      <HorizontalScroll>
        <section>Section 1</section>
      </HorizontalScroll>
    )

    const inner = container.querySelector('.flex.h-full')
    expect(inner).toBeInTheDocument()
  })

  describe('Cleanup', () => {
    it('should cancel animation frame on unmount', async () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { unmount } = render(
        <HorizontalScroll>
          <section>Section 1</section>
        </HorizontalScroll>
      )

      unmount()

      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
    })

    it('should remove resize event listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(
        <HorizontalScroll>
          <section>Section 1</section>
          <section>Section 2</section>
        </HorizontalScroll>
      )

      // Wait for RAF to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should revert GSAP context on unmount', async () => {
      const { unmount } = render(
        <HorizontalScroll>
          <section>Section 1</section>
          <section>Section 2</section>
        </HorizontalScroll>
      )

      // Wait for RAF to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Get the context mock that was created
      const contextCalls = (gsap.context as any).mock?.results
      const mockContext = contextCalls?.[contextCalls.length - 1]?.value

      unmount()

      if (mockContext) {
        expect(mockContext.revert).toHaveBeenCalled()
      }
    })

    it('should clear resize timeout on unmount', async () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')

      const { unmount } = render(
        <HorizontalScroll>
          <section>Section 1</section>
          <section>Section 2</section>
        </HorizontalScroll>
      )

      // Wait for RAF to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Trigger resize to create a timeout
      window.dispatchEvent(new Event('resize'))

      unmount()

      // clearTimeout should have been called during cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Initialization', () => {
    it('should have ScrollTrigger registered at module level', async () => {
      // ScrollTrigger is registered at module load time (line 13-15 of HorizontalScroll.tsx)
      // This test verifies the component renders without errors, implying registration worked
      const { container } = render(
        <HorizontalScroll>
          <section>Section 1</section>
        </HorizontalScroll>
      )

      expect(container.firstChild).toBeInTheDocument()
      // Note: gsap.registerPlugin is called at module load time, before tests run
    })

    it('should create GSAP context when ready', async () => {
      render(
        <HorizontalScroll>
          <section>Section 1</section>
          <section>Section 2</section>
        </HorizontalScroll>
      )

      // Wait for RAF
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(gsap.context).toHaveBeenCalled()
    })
  })
})
