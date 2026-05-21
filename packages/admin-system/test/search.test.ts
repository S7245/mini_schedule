import assert from 'node:assert/strict'
import test from 'node:test'

import { filterBackofficeItemsByQuery } from '../src/models/search'

interface SearchFixture {
  id: string
  phone?: string
  name?: string
  notes?: string
}

const items: SearchFixture[] = [
  {
    id: 'learner-a',
    phone: '13800138000',
    name: 'Ada',
  },
  {
    id: 'learner-b',
    name: 'Bo',
    notes: 'Needs flexibility follow-up',
  },
  {
    id: 'learner-c',
    phone: '13900139000',
  },
]

test('backoffice search keeps all items for blank queries', () => {
  assert.deepEqual(
    filterBackofficeItemsByQuery(items, '   ', (item) => [
      item.phone,
      item.name,
      item.notes,
    ]),
    items,
  )
})

test('backoffice search matches text across optional fields', () => {
  const filtered = filterBackofficeItemsByQuery(items, 'FLEX', (item) => [
    item.phone,
    item.name,
    item.notes,
  ])

  assert.deepEqual(
    filtered.map((item) => item.id),
    ['learner-b'],
  )
})
