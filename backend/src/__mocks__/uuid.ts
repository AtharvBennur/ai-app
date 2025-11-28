// Mock uuid module for Jest tests
export const v4 = (): string => 'mock-uuid-' + Math.random().toString(36).substring(7)
