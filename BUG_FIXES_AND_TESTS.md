# Bug Fixes and Testing Framework

## Bugs Fixed

### 1. Memory Leaks in HorizontalScroll (`components/HorizontalScroll.tsx`)
**Issue:** GSAP context and ScrollTrigger instances were not properly cleaned up
**Fix:**
- Added `scrollTriggerRef` to track ScrollTrigger instance
- Implemented proper cleanup in useEffect return function
- Remove resize event listener on cleanup
- Kill ScrollTrigger before reverting context

```typescript
// Cleanup function
return () => {
  cancelAnimationFrame(rafId)
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (scrollTriggerRef.current) scrollTriggerRef.current.kill()
  if (ctx) ctx.revert()
}
```

### 2. Memory Leaks in LenisProvider (`providers/LenisProvider.tsx`)
**Issue:** GSAP ticker callbacks persisted after unmount
**Fix:**
- Added `tickerRemoverRef` to store the ticker removal function
- Properly remove GSAP ticker callback in cleanup
- Destroy Lenis instance on unmount
- Track mounted state to prevent cleanup after unmount

```typescript
// Store remover for cleanup
tickerRemoverRef.current = () => {
  gsap.ticker.remove(tickerUpdate)
}

// Cleanup
return () => {
  isMounted = false
  if (tickerRemoverRef.current) tickerRemoverRef.current()
  if (lenis) lenis.destroy()
}
```

### 3. Race Conditions in LenisProvider
**Issue:** Promise.all could resolve after component unmounted
**Fix:**
- Added `isMounted` flag checked after promise resolves
- Early return if component unmounted during initialization
- Destroy Lenis immediately if unmounted during async init

### 4. Missing Error Handling
**Fix:**
- Added try-catch around ScrollTrigger creation
- Added `.catch()` for dynamic import failures
- Added error state UI with fallback message
- Console warnings for edge cases (no sections, viewport too wide)

### 5. Missing Resize Handling
**Fix:**
- Added debounced resize handler (250ms)
- Calls `ScrollTrigger.refresh()` on resize
- Properly removes event listener on cleanup
- Uses `invalidateOnRefresh: true` for recalculating values

### 6. Using setTimeout Instead of Proper Timing
**Fix:**
- Replaced 200ms setTimeout with `requestAnimationFrame`
- More reliable timing for DOM measurements

## Testing Framework

### Vitest Setup
- **Config:** `vitest.config.ts`
- **Setup:** `test/setup.ts` - GSAP, ScrollTrigger, and Lenis mocks
- **Run:** `npm test` or `npm run test:ui`

### Playwright E2E Setup
- **Config:** `playwright.config.ts`
- **Tests:** `e2e/scroll.spec.ts`
- **Run:** `npm run test:e2e`

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `components/HorizontalScroll.test.tsx` | 6 tests | Render, props, cleanup |
| `providers/LenisProvider.test.tsx` | 3 tests | Context, error state |
| `e2e/scroll.spec.ts` | 10 tests | Scroll behavior, sections, memory leaks |

## Running Tests

```bash
# Unit tests with Vitest
npm test              # Run once
npm test:ui          # Interactive UI
npm test:coverage    # With coverage report

# E2E tests with Playwright
npm run test:e2e     # Run E2E tests
npm run test:e2e:ui  # Playwright UI mode
```

## Development Markers

In development mode (`NODE_ENV=development`), ScrollTrigger markers are enabled to visualize start/end positions:
```typescript
...(process.env.NODE_ENV === 'development' && {
  markers: { startColor: 'green', endColor: 'red', fontSize: '12px' }
})
```
