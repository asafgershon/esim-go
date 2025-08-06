import { vi } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom'

// Mock window.matchMedia for GSAP
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn((props) => {
    return React.createElement('img', {
      src: props.src,
      alt: props.alt,
      ...props
    })
  }),
}))

// Setup any global test utilities or configurations here
beforeAll(() => {
  // Add any global setup
})

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks()
})

afterAll(() => {
  // Add any global teardown
})