import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge, { getStatusBadgeVariant, getStatusLabel } from './Badge'

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant styling', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('bg-gray-100')
  })

  it('applies success variant styling', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge.className).toContain('bg-green-100')
  })

  it('applies warning variant styling', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge.className).toContain('bg-yellow-100')
  })

  it('applies danger variant styling', () => {
    render(<Badge variant="danger">Danger</Badge>)
    const badge = screen.getByText('Danger')
    expect(badge.className).toContain('bg-red-100')
  })

  it('applies info variant styling', () => {
    render(<Badge variant="info">Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge.className).toContain('bg-blue-100')
  })
})

describe('getStatusBadgeVariant', () => {
  it('returns correct variant for each status', () => {
    expect(getStatusBadgeVariant('draft')).toBe('default')
    expect(getStatusBadgeVariant('submitted')).toBe('info')
    expect(getStatusBadgeVariant('under_review')).toBe('warning')
    expect(getStatusBadgeVariant('evaluated')).toBe('success')
    expect(getStatusBadgeVariant('returned')).toBe('danger')
    expect(getStatusBadgeVariant('unknown')).toBe('default')
  })
})

describe('getStatusLabel', () => {
  it('returns correct label for each status', () => {
    expect(getStatusLabel('draft')).toBe('Draft')
    expect(getStatusLabel('submitted')).toBe('Submitted')
    expect(getStatusLabel('under_review')).toBe('Under Review')
    expect(getStatusLabel('evaluated')).toBe('Evaluated')
    expect(getStatusLabel('returned')).toBe('Returned')
    expect(getStatusLabel('unknown')).toBe('unknown')
  })
})
