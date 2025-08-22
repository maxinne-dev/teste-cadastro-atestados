import { mount } from '@vue/test-utils'
import DataTable from './DataTable.vue'

describe('DataTable', () => {
  it('renders empty state', () => {
    const wrapper = mount(DataTable, { props: { rows: [], emptyMessage: 'Nada aqui' } })
    expect(wrapper.text()).toContain('Nada aqui')
  })

  it('renders rows via slot', () => {
    const rows = [{ name: 'A' }, { name: 'B' }]
    const wrapper = mount(DataTable, {
      props: { rows },
      slots: {
        columns: '<tr><th>Nome</th></tr>',
        row: '<tr><td>{{ row.name }}</td></tr>',
      },
    })
    const tds = wrapper.findAll('tbody td')
    expect(tds).toHaveLength(2)
    expect(tds[0].text()).toBe('A')
  })

  it('paginates with next/prev controls', async () => {
    const rows = [{ name: 'A' }, { name: 'B' }]
    let page = 1
    const wrapper = mount(DataTable, {
      props: { rows, rowsPerPage: 1, page },
      slots: {
        row: '<tr><td>{{ row.name }}</td></tr>',
      },
    })
    // First page shows A
    expect(wrapper.html()).toContain('A')
    expect(wrapper.html()).not.toContain('B')
    // Click next should emit update:page
    await wrapper.find('button.btn:last-of-type').trigger('click')
    const emitted = wrapper.emitted('update:page')
    expect(emitted?.[0]?.[0]).toBe(2)
    // Simulate parent updating prop
    await wrapper.setProps({ page: 2 })
    expect(wrapper.html()).toContain('B')
  })

  it('sorts rows by clicking sortable header', async () => {
    const rows = [{ name: 'B' }, { name: 'A' }]
    const wrapper = mount(DataTable, {
      props: { rows, rowsPerPage: 10, page: 1, sortBy: null, sortDir: null },
      slots: {
        columns: '<tr><th data-sort="name">Nome</th><th>Static</th></tr>',
        row: '<tr><td>{{ row.name }}</td></tr>',
      },
    })
    const th = wrapper.find('th[data-sort="name"]')
    // Initially aria-sort should be none
    expect(th.attributes('aria-sort') || 'none').toBe('none')
    // Non-sortable header should explicitly be aria-sort="none"
    const staticTh = wrapper.find('thead th:nth-child(2)')
    expect(staticTh.attributes('aria-sort')).toBe('none')
    // Sort icon should exist on sortable th
    expect(th.find('.sort-icon').exists()).toBe(true)
    // Click header to sort asc
    await th.trigger('click')
    await wrapper.setProps({ sortBy: 'name', sortDir: 'asc' })
    expect(wrapper.find('th[data-sort="name"]').attributes('aria-sort')).toBe('ascending')
    expect(wrapper.find('th[data-sort="name"]').find('.sort-icon').classes()).toContain('pi-sort-amount-up')
    expect(wrapper.findAll('tbody td')[0].text()).toBe('A')
    // Click again to sort desc
    await wrapper.find('th[data-sort="name"]').trigger('click')
    await wrapper.setProps({ sortBy: 'name', sortDir: 'desc' })
    expect(wrapper.find('th[data-sort="name"]').attributes('aria-sort')).toBe('descending')
    expect(wrapper.find('th[data-sort="name"]').find('.sort-icon').classes()).toContain('pi-sort-amount-down')
    expect(wrapper.findAll('tbody td')[0].text()).toBe('B')
  })
})
