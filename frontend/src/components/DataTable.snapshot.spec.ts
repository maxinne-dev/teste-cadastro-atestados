import { mount } from '@vue/test-utils'
import DataTable from './DataTable.vue'

describe('DataTable snapshot', () => {
  it('matches table markup with header and rows', () => {
    const wrapper = mount(DataTable, {
      props: { rows: [{ name: 'Anna' }, { name: 'Ben' }] },
      slots: {
        header: '<div>Header</div>',
        columns: '<tr><th>Name</th></tr>',
        row: '<tr><td>{{ row.name }}</td></tr>',
        footer: '<div>Footer</div>',
      },
    })
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="data-table">
        <div class="header">Header</div>
        <div class="table-scroll"><table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Anna</td></tr><tr><td>Ben</td></tr></tbody></table></div>
        <div class="footer"><div>Footer</div> <!----></div>
      </div>
    `)
  })
})

