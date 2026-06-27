import { useQuery } from '@tanstack/react-query'
import { http } from './client'
import type { BrandReportOverview } from '@mini-schedule/types'

export interface ReportOverviewParams {
  range?: string
  from?: string
  to?: string
  location_id?: number
}

export const reportQueryKeys = {
  overview: (p: ReportOverviewParams) => ['brand-report-overview', p] as const,
}

export function getReportOverview(params: ReportOverviewParams, silent = false) {
  const qs = new URLSearchParams()
  if (params.range) qs.set('range', params.range)
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  if (params.location_id) qs.set('location_id', String(params.location_id))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return http.get<BrandReportOverview>(
    `/api/v1/brand/reports/overview${suffix}`,
    { silent },
  )
}

export function useBrandReportOverview(
  params: ReportOverviewParams,
  enabled = true,
) {
  return useQuery<BrandReportOverview>({
    queryKey: reportQueryKeys.overview(params),
    queryFn: () => getReportOverview(params, true),
    enabled,
  })
}
