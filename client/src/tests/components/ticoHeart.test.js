import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TicoHeart from '../../components/TicoHeart.vue'

describe('TicoHeart.vue', () => {
  it('renders an accessible heart with the Costa Rica flag stripes', () => {
    const wrapper = mount(TicoHeart, { props: { id: 'tico-heart-test' } })

    const svg = wrapper.find('#tico-heart-test')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toContain('Pura vida')

    const html = wrapper.html()
    expect(html).toContain('#002B7F') // blue
    expect(html).toContain('#FFFFFF') // white
    expect(html).toContain('#CE1126') // red
  })

  it('honors the animated flag and custom label/size', () => {
    const wrapper = mount(TicoHeart, {
      props: { id: 'tico-2', animated: false, size: 24, label: 'Pura vida' },
    })
    const svg = wrapper.find('#tico-2')
    expect(svg.attributes('width')).toBe('24')
    expect(svg.classes()).not.toContain('tico-heart--animated')
    expect(svg.attributes('aria-label')).toBe('Pura vida')
  })
})
