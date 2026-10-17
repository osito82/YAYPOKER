import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import WinnerTournamentOverlay from '../../components/WinnerTournamentOverlay.vue'
import en from '../../locales/en.json'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('../../store/pokerStore', () => ({
  usePokerStore: () => ({ torneoId: 'T1', getPlayers: [], clearWinnerInfo: vi.fn() }),
}))
vi.mock('../../store/responsiveStore', () => ({
  useResponsiveStore: () => ({ templateSuffix: 'Test', screenSize: 'large' }),
}))

const mountOverlay = (winnerInfo) =>
  mount(WinnerTournamentOverlay, {
    props: { winnerInfo },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
      stubs: { 'router-link': { template: '<a><slot /></a>' }, Card: true, Transition: false },
    },
  })

// GAM-003 AC-07: a bot winner has no certificate
describe('WinnerTournamentOverlay.vue', () => {
  const winner = { name: 'Alice', playerId: 'p1', amount: 2000 }

  it('shows the certificate and verify link for a human winner', () => {
    const wrapper = mountOverlay({
      winner,
      certificate: { code: '0420', torneoId: 'T1', date: '2026-10-16T00:00:00Z' },
    })
    expect(wrapper.find('#winner-tournament-cert-box-Test').exists()).toBe(true)
    expect(wrapper.find('#winner-tournament-verify-link-Test').exists()).toBe(true)
    wrapper.unmount()
  })

  it('hides the certificate and verify link when the certificate is null', () => {
    const wrapper = mountOverlay({
      winner: { ...winner, name: 'TicoMan_Bot' },
      certificate: null,
    })
    expect(wrapper.find('#winner-tournament-overlay-viewport-root-Test').exists()).toBe(true)
    expect(wrapper.find('#winner-tournament-cert-box-Test').exists()).toBe(false)
    expect(wrapper.find('#winner-tournament-verify-link-Test').exists()).toBe(false)
    wrapper.unmount()
  })
})
