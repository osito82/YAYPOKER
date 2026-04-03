import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ActionBar from '../../components/ActionBar.vue'
import en from '../../locales/en.json'

// Helper to get nested translation values
const getTranslation = (path, params = {}) => {
  const keys = path.split('.')
  let value = en
  for (const key of keys) {
    value = value?.[key]
  }
  if (typeof value === 'string') {
    return value.replace(/{(\w+)}/g, (_, k) => params[k] || `{${k}}`)
  }
  return path
}

// Mocking dependencies that use Pinia or external logic
vi.mock('../../store/pokerStore', () => ({
  usePokerStore: vi.fn(() => ({
    getOdds: { win: 0.5, tie: 0.1 },
    getCurrentHand: { pokerHand: 'Pair', prizeRank: 1 },
    getActivePlayerId: 'player-1',
    getPlayers: [{ id: 'player-1', name: 'Memo' }],
    getAutofoldStartTime: null,
    getAutofoldDuration: 600,
  })),
}))

vi.mock('../../store/responsiveStore', () => ({
  useResponsiveStore: vi.fn(() => ({
    screenSize: 'large',
  })),
}))

// Mocking components that might be complex or unnecessary for this unit test
vi.mock('../../components/Card.vue', () => ({
  default: { template: '<div>Card</div>' },
}))
vi.mock('../../components/CardBack.vue', () => ({
  default: { template: '<div>CardBack</div>' },
}))
vi.mock('../../components/OddsDisplay.vue', () => ({
  default: { template: '<div>OddsDisplay</div>' },
}))

describe('ActionBar.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const defaultProps = {
    isMyTurn: true,
    canBlind: false,
    options: ['fold', 'check', 'call', 'raise'],
    balance: 1000,
    currentBet: 0,
    betAmount: 20,
    minBet: 20,
    maxBet: 1000,
    playerCards: ['Ah', 'Kh'],
  }

  const globalConfig = {
    mocks: {
      $t: getTranslation,
    },
  }

  it('renders all buttons when it is my turn', async () => {
    const wrapper = mount(ActionBar, {
      props: defaultProps,
      global: globalConfig,
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Fold')
    expect(wrapper.text()).toContain('Check')
    expect(wrapper.text()).toContain('Call')
    expect(wrapper.text()).toContain('Raise')
  })

  it('disables Fold, Check, Call when it is NOT my turn', async () => {
    const wrapper = mount(ActionBar, {
      props: { ...defaultProps, isMyTurn: false },
      global: globalConfig,
    })
    await flushPromises()

    const foldBtn = wrapper.findAll('button').find((b) => b.text().includes('Fold'))
    const checkBtn = wrapper.findAll('button').find((b) => b.text().includes('Check'))
    const callBtn = wrapper.findAll('button').find((b) => b.text().includes('Call'))

    expect(foldBtn.element.disabled).toBe(true)
    expect(checkBtn.element.disabled).toBe(true)
    expect(callBtn.element.disabled).toBe(true)
  })

  it('disables Raise button by default if amount equals minBet (User Request Validation)', async () => {
    const wrapper = mount(ActionBar, {
      props: { ...defaultProps, betAmount: 20, minBet: 20 },
      global: globalConfig,
    })
    await flushPromises()

    const raiseBtn = wrapper.findAll('button').find((b) => b.text().includes('Raise'))
    expect(raiseBtn.element.disabled).toBe(true)
  })

  it('enables Raise button when betAmount is greater than minBet', async () => {
    const wrapper = mount(ActionBar, {
      props: { ...defaultProps, betAmount: 20, minBet: 20 },
      global: globalConfig,
    })
    await flushPromises()

    // Simulate prop update (simulating slider movement)
    await wrapper.setProps({ betAmount: 40 })

    const raiseBtn = wrapper.findAll('button').find((b) => b.text().includes('Raise'))
    expect(raiseBtn.element.disabled).toBe(false)
  })

  it('re-disables Raise button when betAmount goes back to minBet', async () => {
    const wrapper = mount(ActionBar, {
      props: { ...defaultProps, betAmount: 40, minBet: 20 },
      global: globalConfig,
    })
    await flushPromises()

    let raiseBtn = wrapper.findAll('button').find((b) => b.text().includes('Raise'))
    expect(raiseBtn.element.disabled).toBe(false)

    await wrapper.setProps({ betAmount: 20 })

    raiseBtn = wrapper.findAll('button').find((b) => b.text().includes('Raise'))
    expect(raiseBtn.element.disabled).toBe(true)
  })

  it('allows Raise when it is an All-in situation (minBet === maxBet)', async () => {
    const wrapper = mount(ActionBar, {
      props: { ...defaultProps, betAmount: 100, minBet: 100, maxBet: 100 },
      global: globalConfig,
    })
    await flushPromises()

    const raiseBtn = wrapper.findAll('button').find((b) => b.text().includes('Raise'))
    // Should be disabled because player has no other choice to raise
    expect(raiseBtn.element.disabled).toBe(true)
  })

  it('emits action event when a button is clicked', async () => {
    const wrapper = mount(ActionBar, {
      props: defaultProps,
      global: globalConfig,
    })
    await flushPromises()

    const foldBtn = wrapper.findAll('button').find((b) => b.text().includes('Fold'))
    await foldBtn.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('action')
    expect(wrapper.emitted().action[0]).toEqual(['fold'])
  })

  it('shows Post Blind button with type and amount when canBlind is true', async () => {
    const wrapper = mount(ActionBar, {
      props: {
        ...defaultProps,
        canBlind: true,
        blindInfo: { type: 'Small', amount: 10 },
      },
      global: globalConfig,
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Post Small Blind $10')
    expect(wrapper.text()).not.toContain('Fold')
    expect(wrapper.text()).not.toContain('Raise')
  })
})
