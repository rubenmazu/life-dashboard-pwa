import { describe, it, expect } from 'vitest'

describe('Testing infrastructure smoke test', () => {
  it('should run a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to jsdom environment', () => {
    const div = document.createElement('div')
    div.textContent = 'Hello'
    document.body.appendChild(div)
    expect(document.body.textContent).toContain('Hello')
    document.body.removeChild(div)
  })

  it('should have fake-indexeddb available', () => {
    expect(indexedDB).toBeDefined()
    expect(typeof indexedDB.open).toBe('function')
  })

  it('should support jest-dom matchers', () => {
    const div = document.createElement('div')
    div.setAttribute('data-testid', 'smoke')
    document.body.appendChild(div)
    expect(div).toBeInTheDocument()
    document.body.removeChild(div)
  })
})
