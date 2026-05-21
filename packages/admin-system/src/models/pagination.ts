export interface BackofficePaginationInput {
  page: number
  totalItems?: number
  pageSize?: number
}

export interface BackofficePagination {
  page: number
  totalItems: number
  pageSize: number
  totalPages: number
  canGoPrevious: boolean
  canGoNext: boolean
}

export function getBackofficePagination({ page, totalItems = 0, pageSize = 20 }: BackofficePaginationInput): BackofficePagination {
  const safePageSize = pageSize > 0 ? pageSize : 20
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))

  return {
    page,
    totalItems,
    pageSize: safePageSize,
    totalPages,
    canGoPrevious: page > 1,
    canGoNext: page < totalPages,
  }
}

export function getBackofficePaginationLabel({ page, totalItems, totalPages }: BackofficePagination): string {
  return `共 ${totalItems} 条，第 ${page} 页 / 共 ${totalPages} 页`
}
