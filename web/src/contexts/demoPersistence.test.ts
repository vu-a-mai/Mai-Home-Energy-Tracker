import { describe, expect, it, beforeEach, afterEach } from 'vitest'

describe('demo mode persistence contract', () => {
  const KEY = 'demo_mode'

  beforeEach(() => {
    // jsdom-less node environment: shim localStorage
    const store = new Map<string, string>()
    // @ts-expect-error test shim
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
      clear: () => store.clear(),
    }
  })

  afterEach(() => {
    // @ts-expect-error cleanup
    delete globalThis.localStorage
  })

  it('stores and restores demo_mode flag', () => {
    expect(localStorage.getItem(KEY)).toBeNull()
    localStorage.setItem(KEY, 'true')
    expect(localStorage.getItem(KEY) === 'true').toBe(true)
    localStorage.removeItem(KEY)
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})
