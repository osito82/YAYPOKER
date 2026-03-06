import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ActionBar from '../../components/ActionBar.vue'

// Mocking dependencies that use Pinia or external logic
vi.mock('../../store/pokerStore', () => ({
  usePokerStore: vi.fn(() => ({
    getOdds: { win: 0.5, tie: 0.1 },
    getCurrentHand: { pokerHand: 'Pair', prizeRank: 1 },
    getActivePlayerId: 'player-1',
    getPlayers: [{ id: 'player-1', name: 'Memo' }],
    getAutofoldStartTime: null,
    getAutofoldDuration: 600
  }))
}))

vi.mock('../../store/responsiveStore', () => ({
  useResponsiveStore: vi.fn(() => ({
    screenSize: 'large'
  }))
}))

// Mocking components that might be complex or unnecessary for this unit test
vi.mock('../../components/Card.vue', () => ({ default: { template: '<div>Card</div>' } }))
vi.mock('../../components/CardBack.vue', () => ({ default: { template: '<div>CardBack</div>' } }))
vi.mock('../../components/OddsDisplay.vue', () => ({ default: { template: '<div>OddsDisplay</div>' } }))

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
    playerCards: ['Ah', 'Kh']
  }

  it('renders all buttons when it is my turn', () => {
    const wrapper = mount(ActionBar, { props: defaultProps })
    
    expect(wrapper.text()).toContain('Fold')
    expect(wrapper.text()).toContain('Check')
    expect(wrapper.text()).toContain('Call')
    expect(wrapper.text()).toContain('Raise')
  })

  it('disables Fold, Check, Call when it is NOT my turn', () => {
    const wrapper = mount(ActionBar, { 
      props: { ...defaultProps, isMyTurn: false } 
    })
    
    const foldBtn = wrapper.findAll('button').find(b => b.text() === 'Fold')
    const checkBtn = wrapper.findAll('button').find(b => b.text() === 'Check')
    const callBtn = wrapper.findAll('button').find(b => b.text() === 'Call')

    expect(foldBtn.element.disabled).toBe(true)
    expect(checkBtn.element.disabled).toBe(true)
    expect(callBtn.element.disabled).toBe(true)
  })

  it('disables Raise button by default if amount equals minBet (User Request Validation)', () => {
    const wrapper = mount(ActionBar, { 
      props: { ...defaultProps, betAmount: 20, minBet: 20 } 
    })
    
    const raiseBtn = wrapper.findAll('button').find(b => b.text() === 'Raise')
    expect(raiseBtn.element.disabled).toBe(true)
  })

  it('enables Raise button when betAmount is greater than minBet', async () => {
    const wrapper = mount(ActionBar, { 
      props: { ...defaultProps, betAmount: 20, minBet: 20 } 
    })
    
    // Simulate prop update (simulating slider movement)
    await wrapper.setProps({ betAmount: 40 })
    
    const raiseBtn = wrapper.findAll('button').find(b => b.text() === 'Raise')
    expect(raiseBtn.element.disabled).toBe(false)
  })

  it('re-disables Raise button when betAmount goes back to minBet', async () => {
    const wrapper = mount(ActionBar, { 
      props: { ...defaultProps, betAmount: 40, minBet: 20 } 
    })
    
    let raiseBtn = wrapper.findAll('button').find(b => b.text() === 'Raise')
    expect(raiseBtn.element.disabled).toBe(false)

    await wrapper.setProps({ betAmount: 20 })
    
    raiseBtn = wrapper.findAll('button').find(b => b.text() === 'Raise')
    expect(raiseBtn.element.disabled).toBe(true)
  })

  it('allows Raise when it is an All-in situation (minBet === maxBet)', () => {
    const wrapper = mount(ActionBar, { 
      props: { ...defaultProps, betAmount: 100, minBet: 100, maxBet: 100 } 
    })
    
    const raiseBtn = wrapper.findAll('button').find(b => b.text() === 'Raise')
    // Should be enabled because player has no other choice to raise
    expect(raiseBtn.element.disabled).toBe(false)
  })

  it('emits action event when a button is clicked', async () => {
    const wrapper = mount(ActionBar, { props: defaultProps })
    
    const foldBtn = wrapper.findAll('button').find(b => b.text() === 'Fold')
    await foldBtn.trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('action')
    expect(wrapper.emitted().action[0]).toEqual(['fold'])
  })

  it('shows Post Blind button exclusively when canBlind is true', () => {
    const wrapper = mount(ActionBar, { 
      props: { ...defaultProps, canBlind: true } 
    })
    
    expect(wrapper.text()).toContain('Post Blind')
    expect(wrapper.text()).not.toContain('Fold')
    expect(wrapper.text()).not.toContain('Raise')
  })
})
