import assert from 'node:assert/strict'
import test from 'node:test'

import { getBackofficePagination, getBackofficePaginationLabel } from '../src/models/pagination'

test('backoffice pagination keeps empty lists on a single display page', () => {
  const pagination = getBackofficePagination({
    page: 1,
    totalItems: 0,
    pageSize: 20,
  })

  assert.deepEqual(pagination, {
    page: 1,
    totalItems: 0,
    pageSize: 20,
    totalPages: 1,
    canGoPrevious: false,
    canGoNext: false,
  })
  assert.equal(getBackofficePaginationLabel(pagination), '共 0 条，第 1 页 / 共 1 页')
})
