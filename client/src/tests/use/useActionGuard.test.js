import { describe, it, expect, vi, afterEach } from 'vitest'
import { useActionGuard } from '../../use/useActionGuard'

describe('useActionGuard', () => {
  afterEach(() => vi.useRealTimers())

  it('lets only the first turn action through until released', () => {
    const guard = useActionGuard()
    expect(guard.tryAcquire('bet')).toBe(true)
    expect(guard.tryAcquire('bet')).toBe(false) // double click
    expect(guard.tryAcquire('fold')).toBe(false)
    guard.release()
    expect(guard.tryAcquire('call')).toBe(true)
  })

  it('never blocks non-turn actions such as sit out', () => {
    const guard = useActionGuard()
    guard.tryAcquire('raise')
    expect(guard.tryAcquire('sitOut')).toBe(true)
    expect(guard.tryAcquire('sitIn')).toBe(true)
  })

  it('releases itself after the timeout if the server never answers', () => {
    vi.useFakeTimers()
    const guard = useActionGuard(3000)
    guard.tryAcquire('check')
    vi.advanceTimersByTime(2999)
    expect(guard.tryAcquire('check')).toBe(false)
    vi.advanceTimersByTime(1)
    expect(guard.tryAcquire('check')).toBe(true)
  })
})
