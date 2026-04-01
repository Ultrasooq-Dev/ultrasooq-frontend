import http from '../http'

export const fetchVendorMiniStats = () =>
  http({ method: 'GET', url: `/vendor/analytics/mini-stats` })

export const fetchVendorOverview = (params: { days?: number } = {}) =>
  http({ method: 'GET', url: `/vendor/analytics/overview`, params })

export const fetchVendorProducts = (params: { days?: number; page?: number; limit?: number } = {}) =>
  http({ method: 'GET', url: `/vendor/analytics/products`, params })

export const fetchVendorFunnel = (params: { days?: number } = {}) =>
  http({ method: 'GET', url: `/vendor/analytics/funnel`, params })

export const fetchVendorProductDetail = (productPriceId: number, params: { days?: number } = {}) =>
  http({ method: 'GET', url: `/vendor/analytics/products/${productPriceId}`, params })

export const fetchVendorReviews = (params: { page?: number; limit?: number } = {}) =>
  http({ method: 'GET', url: `/vendor/analytics/reviews`, params })
