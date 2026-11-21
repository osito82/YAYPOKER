import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, toRaw } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import useWebSocket from '../../use/useSockets'
import { usePokerStore } from '../../store/pokerStore'

class FakeWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances = []

  constructor(url) {
    this.url = url
    this.readyState = FakeWebSocket.CONNECTING
    this.listeners = {}
    this.sent = []
    FakeWebSocket.instances.push(this)
  }
  addEventListener(type, fn) {
    ;(this.listeners[type] ||= []).push(fn)
  }
  emit(type, event = {}) {
    ;(this.listeners[type] || []).forEach((fn) => fn(event))
  }
  open() {
    this.readyState = FakeWebSocket.OPEN
    this.emit('open')
  }
  send(data) {
    this.sent.push(data)
  }
  close() {
    this.readyState = FakeWebSocket.CLOSED
    this.closed = true
  }
}

const pageEvent = (type, persisted) => {
  const event = new Event(type)
  event.persisted = persisted
  window.dispatchEvent(event)
}

const mountComposable = () => {
  let api
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useWebSocket('ws://localhost:1234', {
          gameCode: 'ABC',
          role: 'player',
        })
        return () => h('div')
      },
    }),
  )
  return { wrapper, api }
}

describe('useWebSocket page lifecycle', () => {
  let originalWebSocket

  beforeEach(() => {
    setActivePinia(createPinia())
    originalWebSocket = globalThis.WebSocket
    globalThis.WebSocket = FakeWebSocket
    FakeWebSocket.instances = []
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket
    vi.restoreAllMocks()
  })

  it('reconnects when the page comes back from the back/forward cache', () => {
    const { api, wrapper } = mountComposable()
    api.connectSocket()
    const first = FakeWebSocket.instances[0]
    first.open()
    const store = usePokerStore()
    expect(store.connected).toBe(true)

    pageEvent('pagehide', true)
    expect(first.closed).toBe(true)
    expect(toRaw(api.socket.value)).toBe(null)
    expect(store.connected).toBe(false)

    pageEvent('pageshow', true)
    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(toRaw(api.socket.value)).toBe(FakeWebSocket.instances[1])
    wrapper.unmount()
  })

  it('ignores a late close event from the socket closed on pagehide', () => {
    const { api, wrapper } = mountComposable()
    api.connectSocket()
    const first = FakeWebSocket.instances[0]
    first.open()

    pageEvent('pagehide', true)
    pageEvent('pageshow', true)
    const second = FakeWebSocket.instances[1]
    second.open()
    const setConnected = vi.spyOn(usePokerStore(), 'setConnected')

    // The browser delivers the old socket's close after the new one opened
    first.emit('close', { code: 1001 })
    expect(setConnected).not.toHaveBeenCalled()
    expect(toRaw(api.socket.value)).toBe(second)
    expect(FakeWebSocket.instances).toHaveLength(2)
    wrapper.unmount()
  })

  it('still reconnects when the current socket drops unexpectedly', () => {
    vi.useFakeTimers()
    const { api, wrapper } = mountComposable()
    api.connectSocket()
    const first = FakeWebSocket.instances[0]
    first.open()
    const store = usePokerStore()

    first.readyState = FakeWebSocket.CLOSED
    first.emit('close', { code: 1006 })
    expect(store.connected).toBe(false)

    vi.advanceTimersByTime(20000)
    expect(FakeWebSocket.instances).toHaveLength(2)
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('tears down for good when the page is really unloaded', () => {
    const { api, wrapper } = mountComposable()
    api.connectSocket()
    FakeWebSocket.instances[0].open()

    pageEvent('pagehide', false)
    expect(FakeWebSocket.instances[0].closed).toBe(true)

    pageEvent('pageshow', true)
    api.connectSocket()
    expect(FakeWebSocket.instances).toHaveLength(1)
    wrapper.unmount()
  })

  it('does not reconnect on a plain pageshow (first load)', () => {
    const { api, wrapper } = mountComposable()
    api.connectSocket()
    FakeWebSocket.instances[0].open()

    pageEvent('pageshow', false)
    expect(FakeWebSocket.instances).toHaveLength(1)
    wrapper.unmount()
  })
})
