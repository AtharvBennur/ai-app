import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      danger: 'bg-red-100 text-red-700',
      info: 'bg-blue-100 text-blue-700',
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge

// Helper to get badge variant from submission status
export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'draft':
      return 'default'
    case 'submitted':
      return 'info'
    case 'under_review':
      return 'warning'
    case 'evaluated':
      return 'success'
    case 'returned':
      return 'danger'
    default:
      return 'default'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'submitted':
      return 'Submitted'
    case 'under_review':
      return 'Under Review'
    case 'evaluated':
      return 'Evaluated'
    case 'returned':
      return 'Returned'
    default:
      return status
  }
}
