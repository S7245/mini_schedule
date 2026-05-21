import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getBackofficeBreadcrumbs,
  getBackofficePageLabel,
  isBackofficeNavItemActive,
  type BackofficeNavItem,
} from '../src/models/nav'

const navItems: BackofficeNavItem[] = [
  {
    href: '/learn',
    label: 'Learning',
    items: [
      {
        href: '/learn/courses',
        label: 'Courses',
      },
    ],
  },
  {
    href: '/settings',
    label: 'Settings',
  },
]

test('backoffice nav resolves the most specific route label', () => {
  assert.equal(
    getBackofficePageLabel('/learn/courses/42', navItems, 'Fallback'),
    'Courses',
  )
  assert.equal(getBackofficePageLabel('/unknown', navItems, 'Fallback'), 'Fallback')
})

test('backoffice breadcrumbs use the same route label as the page title', () => {
  assert.deepEqual(
    getBackofficeBreadcrumbs('/learn/courses/42', navItems, 'Fallback'),
    ['后台', 'Courses'],
  )
})

test('backoffice nav active state includes nested child routes', () => {
  assert.equal(isBackofficeNavItemActive('/learn/courses/42', navItems[0]), true)
  assert.equal(isBackofficeNavItemActive('/settings/roles', navItems[0]), false)
})
