import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card, { CardHeader, CardTitle, CardDescription } from './Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies default padding', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('p-6')
  })

  it('applies small padding when specified', () => {
    render(<Card padding="sm">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('p-4')
  })

  it('applies no padding when specified', () => {
    render(<Card padding="none">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).not.toContain('p-4')
    expect(card?.className).not.toContain('p-6')
  })

  it('has shadow and rounded corners', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('shadow')
    expect(card?.className).toContain('rounded-lg')
  })
})

describe('CardHeader', () => {
  it('renders children correctly', () => {
    render(<CardHeader>Header content</CardHeader>)
    expect(screen.getByText('Header content')).toBeInTheDocument()
  })
})

describe('CardTitle', () => {
  it('renders as h3 with correct styling', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.tagName).toBe('H3')
    expect(title.className).toContain('font-semibold')
  })
})

describe('CardDescription', () => {
  it('renders with muted styling', () => {
    render(<CardDescription>Description</CardDescription>)
    const desc = screen.getByText('Description')
    expect(desc.className).toContain('text-gray-500')
    expect(desc.className).toContain('text-sm')
  })
})
