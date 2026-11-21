import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BettingSlider from '../../components/actionBar/BettingSlider.vue'

describe('BettingSlider.vue', () => {
  const globalConfig = {
    mocks: {
      $t: (key) => key,
    },
  }

  it('renders input range with step 1 so all-in can always be reached', () => {
    const wrapper = mount(BettingSlider, {
      props: {
        isMyTurn: true,
        options: ['raise'],
        betAmount: 26,
        sliderMin: 26,
        maxBet: 582,
        isSliderDisabled: false,
        templateSuffix: 'TemplateLarge',
      },
      global: globalConfig,
    })

    const input = wrapper.find('input[type="range"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('step')).toBe('1')
    expect(input.attributes('min')).toBe('26')
    expect(input.attributes('max')).toBe('582')
  })

  it('emits exact maxBet when dragged or set to maxBet (no 1-chip shortfall)', async () => {
    const wrapper = mount(BettingSlider, {
      props: {
        isMyTurn: true,
        options: ['raise'],
        betAmount: 26,
        sliderMin: 26,
        maxBet: 582, // (582 - 26) = 556, which previously failed with step=5
        isSliderDisabled: false,
        templateSuffix: 'TemplateLarge',
      },
      global: globalConfig,
    })

    const input = wrapper.find('input[type="range"]')
    await input.setValue(582)

    expect(wrapper.emitted('update:betAmount')).toBeTruthy()
    const emittedValues = wrapper.emitted('update:betAmount')
    expect(emittedValues[emittedValues.length - 1][0]).toBe(582)
  })

  it('clamps values above maxBet to maxBet', async () => {
    const wrapper = mount(BettingSlider, {
      props: {
        isMyTurn: true,
        options: ['raise'],
        betAmount: 100,
        sliderMin: 26,
        maxBet: 582,
        isSliderDisabled: false,
        templateSuffix: 'TemplateLarge',
      },
      global: globalConfig,
    })

    const input = wrapper.find('input[type="range"]')
    await input.setValue(1000)

    const emittedValues = wrapper.emitted('update:betAmount')
    expect(emittedValues[emittedValues.length - 1][0]).toBe(582)
  })

  it('clamps values below sliderMin to sliderMin', async () => {
    const wrapper = mount(BettingSlider, {
      props: {
        isMyTurn: true,
        options: ['raise'],
        betAmount: 100,
        sliderMin: 26,
        maxBet: 582,
        isSliderDisabled: false,
        templateSuffix: 'TemplateLarge',
      },
      global: globalConfig,
    })

    const input = wrapper.find('input[type="range"]')
    await input.setValue(10)

    const emittedValues = wrapper.emitted('update:betAmount')
    expect(emittedValues[emittedValues.length - 1][0]).toBe(26)
  })
})
