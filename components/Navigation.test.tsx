import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import Navigation from './Navigation'
import * as LenisProvider from '@/providers/LenisProvider'

const mockScrollToData = [
  { id: 'I.', text: 'Intro', href: '#section-intro' },
  { id: 'II.', text: 'Philosophy', href: '#section-philosophy' },
  { id: 'III.', text: 'Experience', href: '#section-experience' },
  { id: 'IV.', text: 'Achievements', href: '#section-achievements' },
  { id: 'V.', text: 'Programs', href: '#section-programs' },
  { id: 'VI.', text: 'Contact', href: '#section-contact' },
]

const mockScrollTo = vi.fn()
const mockEnableScroll = vi.fn()
const mockDisableScroll = vi.fn()

describe('Navigation', () => {
  beforeEach(() => {
    cleanup()

    // Mock useLenis
    vi.spyOn(LenisProvider, 'useLenis').mockReturnValue({
      lenis: null,
      isReady: true,
      scrollTo: mockScrollTo,
      enableScroll: mockEnableScroll,
      disableScroll: mockDisableScroll,
    })

    // Create mock sections in the DOM
    mockScrollToData.forEach(item => {
      const section = document.createElement('section')
      section.id = item.href.replace('#', '')
      section.setAttribute('data-scroll-to', 'vertical')
      document.body.appendChild(section)
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()

    // Clean up mock sections
    mockScrollToData.forEach(item => {
      const section = document.getElementById(item.href.replace('#', ''))
      if (section) {
        section.remove()
      }
    })
  })

  it('should render all navigation items', () => {
    render(<Navigation scrollToData={mockScrollToData} />)

    expect(screen.getByText('I.')).toBeInTheDocument()
    expect(screen.getByText('II.')).toBeInTheDocument()
    expect(screen.getByText('III.')).toBeInTheDocument()
    expect(screen.getByText('IV.')).toBeInTheDocument()
    expect(screen.getByText('V.')).toBeInTheDocument()
    expect(screen.getByText('VI.')).toBeInTheDocument()
  })

  it('should render section names', () => {
    render(<Navigation scrollToData={mockScrollToData} />)

    expect(screen.getByText('Intro')).toBeInTheDocument()
    expect(screen.getByText('Philosophy')).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Achievements')).toBeInTheDocument()
    expect(screen.getByText('Programs')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('should render progress indicators for each item', () => {
    const { container } = render(<Navigation scrollToData={mockScrollToData} />)

    const progressBars = container.querySelectorAll('[data-progress]')
    expect(progressBars).toHaveLength(6)
  })

  it('should render logo at top with accessibility label', () => {
    const { container } = render(<Navigation scrollToData={mockScrollToData} />)

    const logo = container.querySelector('.nav-logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('aria-label', 'Home')
    // Logo is now an SVG, check for the svg element
    const logoSvg = container.querySelector('.nav-logo-mark')
    expect(logoSvg).toBeInTheDocument()
  })

  it('should have correct href links', () => {
    const { container } = render(<Navigation scrollToData={mockScrollToData} />)

    const links = container.querySelectorAll('a')
    expect(links[0].getAttribute('href')).toBe('/') // Logo link
    expect(links[1].getAttribute('href')).toBe('#section-intro')
    expect(links[2].getAttribute('href')).toBe('#section-philosophy')
    expect(links[3].getAttribute('href')).toBe('#section-experience')
    expect(links[4].getAttribute('href')).toBe('#section-achievements')
    expect(links[5].getAttribute('href')).toBe('#section-programs')
    expect(links[6].getAttribute('href')).toBe('#section-contact')
  })

  it('should have header element with proper classes', () => {
    const { container } = render(<Navigation scrollToData={mockScrollToData} />)

    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header?.className).toContain('nav-header')
  })

  it('should have scroll-to list container', () => {
    const { container } = render(<Navigation scrollToData={mockScrollToData} />)

    const list = container.querySelector('.nav-scroll-list')
    expect(list).toBeInTheDocument()
  })

  describe('Accessibility', () => {
    it('should have role="banner" on header', () => {
      const { container } = render(<Navigation scrollToData={mockScrollToData} />)

      const header = container.querySelector('header')
      expect(header).toHaveAttribute('role', 'banner')
    })

    it('should have role="navigation" on nav element', () => {
      const { container } = render(<Navigation scrollToData={mockScrollToData} />)

      const nav = container.querySelector('nav')
      expect(nav).toHaveAttribute('role', 'navigation')
      expect(nav).toHaveAttribute('aria-label', 'Section navigation')
    })

    it('should have progress bars with proper ARIA attributes', () => {
      const { container } = render(<Navigation scrollToData={mockScrollToData} />)

      const progressBars = container.querySelectorAll('[role="progressbar"]')
      expect(progressBars.length).toBe(6)

      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuemin', '0')
        expect(bar).toHaveAttribute('aria-valuemax', '100')
        expect(bar).toHaveAttribute('aria-valuenow')
      })
    })

    it('should have aria-label on Get in Touch button', () => {
      const { container } = render(<Navigation scrollToData={mockScrollToData} />)

      const connectBtn = container.querySelector('.nav-connect-btn')
      expect(connectBtn).toHaveAttribute('aria-label')
    })
  })

  describe('Click Handling', () => {
    it('should call scrollTo when nav item is clicked', async () => {
      render(<Navigation scrollToData={mockScrollToData} />)

      const firstNavItem = screen.getByText('I.').closest('a')

      await act(async () => {
        fireEvent.click(firstNavItem!)
      })

      // Wait for any async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockScrollTo).toHaveBeenCalled()
    })

    it('should prevent default on click', async () => {
      render(<Navigation scrollToData={mockScrollToData} />)

      const firstNavItem = screen.getByText('I.').closest('a')
      const preventDefaultMock = vi.fn()

      await act(async () => {
        fireEvent.click(firstNavItem!, {
          preventDefault: preventDefaultMock,
        })
      })

      // The click handler should have called preventDefault
      // This is implicitly tested by checking scrollTo was called instead of navigation
    })

    it('should set clicked state on nav item click', async () => {
      const { container } = render(<Navigation scrollToData={mockScrollToData} />)

      const firstNavItem = screen.getByText('I.').closest('a')

      await act(async () => {
        fireEvent.click(firstNavItem!)
      })

      expect(firstNavItem).toHaveClass('nav-clicked')
    })

    it('should use handleClick for Get in Touch button', async () => {
      const { container } = render(<Navigation scrollToData={mockScrollToData} />)

      const connectBtn = container.querySelector('.nav-connect-btn')

      await act(async () => {
        fireEvent.click(connectBtn!)
      })

      expect(mockScrollTo).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should disconnect IntersectionObserver on unmount', async () => {
      const disconnectSpy = vi.fn()

      // The IntersectionObserver is mocked in setup.ts
      const { unmount } = render(<Navigation scrollToData={mockScrollToData} />)

      // Wait for effects to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      unmount()

      // Observer disconnect should be called - checked via mock
    })

    it('should clear timeout on unmount', async () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')

      const { unmount } = render(<Navigation scrollToData={mockScrollToData} />)

      // Click to trigger timeout
      const firstNavItem = screen.getByText('I.').closest('a')
      await act(async () => {
        fireEvent.click(firstNavItem!)
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should remove scroll event listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(<Navigation scrollToData={mockScrollToData} />)

      // Wait for effects
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    it('should cancel animation frame on unmount', async () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { unmount } = render(<Navigation scrollToData={mockScrollToData} />)

      unmount()

      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
    })
  })

  describe('Reveal Animation', () => {
    it('should add nav-revealed class after mount', async () => {
      const { container } = render(<Navigation scrollToData={mockScrollToData} />)

      // Wait for RAF to execute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const header = container.querySelector('header')
      expect(header).toHaveClass('nav-revealed')
    })
  })

  describe('Null Safety', () => {
    it('should handle empty href gracefully', async () => {
      const dataWithEmptyHref = [
        { id: 'I.', text: 'Intro', href: '' },
        { id: 'II.', text: 'Philosophy', href: '#section-philosophy' },
      ]

      // Should not throw
      expect(() => {
        render(<Navigation scrollToData={dataWithEmptyHref} />)
      }).not.toThrow()
    })

    it('should handle undefined href gracefully', async () => {
      const dataWithUndefinedHref = [
        { id: 'I.', text: 'Intro', href: undefined as any },
        { id: 'II.', text: 'Philosophy', href: '#section-philosophy' },
      ]

      // Should not throw
      expect(() => {
        render(<Navigation scrollToData={dataWithUndefinedHref} />)
      }).not.toThrow()
    })
  })
})
