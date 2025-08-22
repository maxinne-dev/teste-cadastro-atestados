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
})

