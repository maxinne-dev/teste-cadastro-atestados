import { mount } from '@vue/test-utils'
import DataTable from './DataTable.vue'

describe('DataTable snapshot', () => {
  it('renders header, rows and footer correctly', () => {
    const wrapper = mount(DataTable, {
      props: { rows: [{ name: 'Anna' }, { name: 'Ben' }] },
      slots: {
        header: '<div>Header</div>',
        columns: '<tr><th>Name</th></tr>',
        row: '<tr><td>{{ row.name }}</td></tr>',
        footer: '<div>Footer</div>',
      },
    })
    expect(wrapper.find('.header').text()).toContain('Header')
    const th = wrapper.find('thead th')
    expect(th.exists()).toBe(true)
    const tds = wrapper.findAll('tbody td')
    expect(tds.map((t) => t.text())).toEqual(['Anna', 'Ben'])
    expect(wrapper.find('.footer').text()).toContain('Footer')
  })
})
