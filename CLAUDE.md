# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Horizontal-to-vertical scroll transition demo inspired by wonjyou.studio. Uses Next.js App Router with GSAP ScrollTrigger for scroll-based animations and Lenis for smooth scrolling.

## Development Commands

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint

# Unit tests (Vitest)
npm test              # Run once
npm test -- path/to/file.test.tsx  # Run single test file
npm run test:ui      # Interactive UI
npm run test:coverage # Coverage report

# E2E tests (Playwright)
npm run test:e2e     # Run E2E tests
npm run test:e2e:ui  # Playwright UI mode
```

## Architecture

### Scroll Behavior Pattern

The page scrolls **horizontally** for the first N sections, then transitions to **normal vertical scrolling** for remaining sections.

**Key Implementation:**
- `HorizontalScroll` component wraps sections that should scroll horizontally
- Uses GSAP ScrollTrigger with `pin: true` to keep container fixed during horizontal scroll
- Inner container translates on X-axis as user scrolls vertically
- Scroll distance = `totalWidth - window.innerWidth`
- After horizontal sections end, ScrollTrigger unpin occurs and normal vertical scrolling resumes

**Section Attributes:**
- `data-scroll-to="horizontal"` - Section scrolls horizontally (inside HorizontalScroll wrapper)
- `data-scroll-to="vertical"` - Section scrolls normally (outside wrapper)

### Component Hierarchy

```
app/layout.tsx
├── LenisProvider (smooth scroll context)
    └── app/page.tsx
        ├── Navigation (sticky nav with scroll-to links)
        ├── HorizontalScroll (horizontal sections)
        │   ├── section-intro (data-scroll-to="horizontal")
        │   └── section-philosophy (data-scroll-to="horizontal")
        └── VerticalSection components (normal flow)
            ├── section-experience
            ├── section-achievements
            └── ...
```

### GSAP + Lenis Integration

Lenis smooth scroll drives GSAP ScrollTrigger updates:
1. Lenis `autoRaf: false` - GSAP ticker controls RAF
2. `lenis.on('scroll', ScrollTrigger.update)` - Sync on scroll events
3. `gsap.ticker.add()` - Lenis RAF added to GSAP ticker
4. `gsap.ticker.lagSmoothing(0)` - Disable lag for immediate response

**Critical cleanup order** (in useEffect return):
1. Remove GSAP ticker callback
2. Destroy Lenis instance
3. Kill ScrollTrigger instances
4. Revert GSAP context

## Memory Safety Notes

**HorizontalScroll component:**
- Must store ScrollTrigger reference in ref for cleanup
- Must remove resize event listener on cleanup
- Uses `requestAnimationFrame` instead of `setTimeout` for timing
- Resize handler debounced (250ms) calling `ScrollTrigger.refresh()`

**LenisProvider:**
- Uses `isMounted` flag to prevent cleanup after unmount
- Stores ticker remover function in ref for proper cleanup
- Dynamic imports handled with proper error catching

## Testing

**Vitest mocks** (`test/setup.ts`):
- GSAP, ScrollTrigger, and Lenis are fully mocked
- Mocks must not reference external variables (hoisting issue)

**E2E tests** (`e2e/scroll.spec.ts`):
- Tests scroll behavior, section visibility, memory leaks
- Excludes from vitest via `vitest.config.ts`
