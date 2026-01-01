import { ReactNode, HTMLAttributes } from 'react'

interface VerticalSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'id'> {
  id: string
  className?: string
  children: ReactNode
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
  ...rest
}: VerticalSectionProps) {
  // Combine base classes with custom classes
  // Base classes can be overridden by passing Tailwind classes that conflict
  const baseClasses = 'h-screen w-full flex items-center justify-center flex-shrink-0'
  const combinedClasses = `${baseClasses} ${className}`.trim()

  return (
    <section
      id={id}
      data-scroll-to="vertical"
      className={combinedClasses}
      {...rest}
    >
      {children}
    </section>
  )
}
