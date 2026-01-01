import { ReactNode, HTMLAttributes } from 'react'

interface VerticalSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'id' | 'aria-label'> {
  id: string
  className?: string
  children: ReactNode
  /** Accessible label for the section. If not provided, consider adding a heading inside. */
  'aria-label'?: string
}

/**
 * VerticalSection - A section component for vertical scroll areas
 *
 * This is a Server Component (no 'use client') since it has no hooks or event handlers.
 * Use this for sections that scroll normally (after horizontal scroll completes).
 */
export default function VerticalSection({
  id,
  className = '',
  children,
  'aria-label': ariaLabel,
  ...rest
}: VerticalSectionProps) {
  // Filter out data-scroll-to from rest props to prevent override
  const { 'data-scroll-to': _, ...safeRest } = rest as Record<string, unknown>

  // Combine base classes with custom classes
  // Note: Without tailwind-merge, conflicting Tailwind classes are not deduplicated.
  // Later classes in className may not override base classes due to CSS specificity.
  // For full override support, consider installing tailwind-merge.
  const baseClasses = 'h-screen w-screen flex items-center justify-center'
  const combinedClasses = `${baseClasses} ${className}`.trim()

  return (
    <section
      {...safeRest}
      id={id}
      data-scroll-to="vertical"
      className={combinedClasses}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  )
}
