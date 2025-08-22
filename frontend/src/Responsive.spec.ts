import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from './components/DataTable.vue'

const rows = [{ a: 1 }, { a: 2 }]

describe('Responsive DataTable', () => {
  it('renders cards below breakpoint', async () => {
    const wrap = mount(DataTable, {
      props: { rows, cardBreakpoint: 800 },
      slots: {
        columns: '<tr><th>A</th></tr>',
        row: '<tr><td>{{ row.a }}</td></tr>',
        card: '<div class="custom-card">Row {{ row.a }}</div>',
      },
      attachTo: document.body,
    })
    ;(window as any).innerWidth = 600
    window.dispatchEvent(new Event('resize'))
    await wrap.vm.$nextTick()
    expect(wrap.find('.cards').exists()).toBe(true)
    expect(wrap.findAll('.custom-card').length).toBe(rows.length)
  })

  it('renders table above breakpoint', async () => {
    const wrap = mount(DataTable, {
      props: { rows, cardBreakpoint: 400 },
      slots: {
        columns: '<tr><th>A</th></tr>',
        row: '<tr><td>{{ row.a }}</td></tr>',
        card: '<div class="custom-card">Row {{ row.a }}</div>',
      },
      attachTo: document.body,
    })
    ;(window as any).innerWidth = 800
    window.dispatchEvent(new Event('resize'))
    await wrap.vm.$nextTick()
    expect(wrap.find('table').exists()).toBe(true)
    expect(wrap.find('.cards').exists()).toBe(false)
  })
})
