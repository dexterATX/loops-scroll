import { vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Store mock instances for test access
export const mockInstances = {
  lenis: null as any,
  scrollTriggers: [] as any[],
  gsapContexts: [] as any[],
}

// Reset mock instances between tests
beforeEach(() => {
  mockInstances.lenis = null
  mockInstances.scrollTriggers = []
  mockInstances.gsapContexts = []
})

afterEach(() => {
  vi.clearAllMocks()
})

// GSAP Mock
vi.mock('gsap', () => {
  const createMockTimeline = () => ({
    to: vi.fn(function(this: any) { return this }),
    from: vi.fn(function(this: any) { return this }),
    fromTo: vi.fn(function(this: any) { return this }),
    set: vi.fn(function(this: any) { return this }),
    play: vi.fn(function(this: any) { return this }),
    pause: vi.fn(function(this: any) { return this }),
    reverse: vi.fn(function(this: any) { return this }),
    restart: vi.fn(function(this: any) { return this }),
    kill: vi.fn(),
    progress: vi.fn(function(this: any) { return this }),
    time: vi.fn(function(this: any) { return this }),
    duration: vi.fn(function(this: any) { return this }),
    add: vi.fn(function(this: any) { return this }),
    addPause: vi.fn(function(this: any) { return this }),
    call: vi.fn(function(this: any) { return this }),
    clear: vi.fn(function(this: any) { return this }),
    eventCallback: vi.fn(function(this: any) { return this }),
  })

  const createMockScrollTrigger = () => ({
    kill: vi.fn(),
    refresh: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
    animation: null,
    start: 0,
    end: 1000,
    scrub: false,
    trigger: null,
    progress: 0,
    isActive: false,
  })

  const createMockTween = () => {
    const scrollTrigger = createMockScrollTrigger()
    return {
      kill: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      reverse: vi.fn(),
      restart: vi.fn(),
      progress: vi.fn(),
      timeScale: vi.fn(),
      then: vi.fn(),
      scrollTrigger,
    }
  }

  const createMockContext = (callback?: () => void, scope?: Element) => {
    const ctx = {
      add: vi.fn((fn: () => void) => fn()),
      revert: vi.fn(),
      clean: vi.fn(),
      kill: vi.fn(),
      isPlaying: () => false,
    }
    // Execute the callback if provided (this is what real gsap.context does)
    if (callback) {
      callback()
    }
    return ctx
  }

  const tickerCallbacks: Array<(time: number) => void> = []

  const gsapMock = {
    to: vi.fn(() => createMockTween()),
    from: vi.fn(() => createMockTween()),
    fromTo: vi.fn(() => createMockTween()),
    set: vi.fn(() => createMockTween()),
    timeline: vi.fn(() => createMockTimeline()),
    context: vi.fn((callback?: () => void, scope?: Element) => createMockContext(callback, scope)),
    registerPlugin: vi.fn(),
    utils: {
      toArray: vi.fn((selector: any) => {
        if (typeof selector === 'string') {
          return Array.from(document.querySelectorAll(selector))
        }
        return [selector]
      }),
      // Fixed: correct parameter order is (min, max, value)
      clamp: vi.fn((min: number, max: number, value: number) =>
        Math.max(min, Math.min(value, max))
      ),
      random: vi.fn((min: number, max: number) =>
        Math.random() * (max - min) + min
      ),
      selector: vi.fn((selector: string) => document.querySelectorAll(selector)),
      wrap: vi.fn((value: number, min: number, max: number) => {
        const range = max - min
        return ((value - min) % range) + min
      }),
    },
    matchMedia: vi.fn(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      matches: vi.fn(() => false),
    })),
    getProperty: vi.fn((target: any, property: string) => {
      return target[property]
    }),
    setProperty: vi.fn((target: any, property: string, value: any) => {
      target[property] = value
    }),
    ticker: {
      add: vi.fn((callback: (time: number) => void) => {
        tickerCallbacks.push(callback)
      }),
      remove: vi.fn((callback: (time: number) => void) => {
        const index = tickerCallbacks.indexOf(callback)
        if (index > -1) {
          tickerCallbacks.splice(index, 1)
        }
      }),
      lagSmoothing: vi.fn(),
      // Helper for tests to simulate ticker
      _tick: (time: number) => {
        tickerCallbacks.forEach(cb => cb(time))
      },
      _getCallbacks: () => tickerCallbacks,
    },
  }

  return {
    default: gsapMock,
    ...gsapMock,
  }
})

// ScrollTrigger Mock
vi.mock('gsap/ScrollTrigger', () => {
  const scrollTriggerInstances: any[] = []

  const createScrollTriggerInstance = () => {
    const instance = {
      kill: vi.fn(() => {
        const index = scrollTriggerInstances.indexOf(instance)
        if (index > -1) {
          scrollTriggerInstances.splice(index, 1)
        }
      }),
      refresh: vi.fn(),
      disable: vi.fn(),
      enable: vi.fn(),
      animation: null,
      start: 0,
      end: 1000,
      scrub: false,
      trigger: null,
      progress: 0,
      isActive: false,
    }
    scrollTriggerInstances.push(instance)
    return instance
  }

  const scrollTriggerMock = {
    create: vi.fn(() => createScrollTriggerInstance()),
    refresh: vi.fn(),
    getAll: vi.fn(() => scrollTriggerInstances),
    getById: vi.fn((id: string) => scrollTriggerInstances.find((st: any) => st.id === id) || null),
    clearScrollMemory: vi.fn(),
    update: vi.fn(),
    scroll: vi.fn((value: number) => value),
    isScrolling: vi.fn(() => false),
    killAll: vi.fn(() => {
      scrollTriggerInstances.length = 0
    }),
    // Helper for tests
    _getInstances: () => scrollTriggerInstances,
    _clearInstances: () => {
      scrollTriggerInstances.length = 0
    },
  }

  return {
    ScrollTrigger: scrollTriggerMock,
    default: scrollTriggerMock,
  }
})

// Lenis Mock with spyable methods
vi.mock('@studio-freight/lenis', () => {
  class MockLenis {
    options: any
    on = vi.fn()
    off = vi.fn()
    raf = vi.fn()
    destroy = vi.fn()
    scrollTo = vi.fn()
    scroll = 0
    velocity = 0
    isScrolling = false
    isStopped = false

    constructor(options?: any) {
      this.options = options || {}
    }
  }

  return {
    default: MockLenis,
  }
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private callback: IntersectionObserverCallback
  private elements: Set<Element> = new Set()

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    if (options) {
      this.rootMargin = options.rootMargin || ''
      this.thresholds = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold || 0]
    }
  }

  observe = vi.fn((element: Element) => {
    this.elements.add(element)
  })

  unobserve = vi.fn((element: Element) => {
    this.elements.delete(element)
  })

  disconnect = vi.fn(() => {
    this.elements.clear()
  })

  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[])

  // Helper for tests to trigger intersection
  _triggerIntersection(entries: Partial<IntersectionObserverEntry>[]) {
    const fullEntries = entries.map(entry => ({
      boundingClientRect: entry.boundingClientRect || {} as DOMRectReadOnly,
      intersectionRatio: entry.intersectionRatio || 0,
      intersectionRect: entry.intersectionRect || {} as DOMRectReadOnly,
      isIntersecting: entry.isIntersecting || false,
      rootBounds: entry.rootBounds || null,
      target: entry.target || document.body,
      time: entry.time || Date.now(),
    })) as IntersectionObserverEntry[]
    this.callback(fullEntries, this)
  }
}

global.IntersectionObserver = MockIntersectionObserver as any

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.ResizeObserver = MockResizeObserver as any

// Mock requestAnimationFrame and cancelAnimationFrame
let rafId = 0
const rafCallbacks = new Map<number, FrameRequestCallback>()

global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  rafId++
  rafCallbacks.set(rafId, callback)
  // Execute immediately in tests for synchronous behavior
  Promise.resolve().then(() => {
    if (rafCallbacks.has(rafId)) {
      callback(performance.now())
      rafCallbacks.delete(rafId)
    }
  })
  return rafId
}) as any

global.cancelAnimationFrame = vi.fn((id: number) => {
  rafCallbacks.delete(id)
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1920,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: 1080,
})
