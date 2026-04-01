import http from '../http'

export const initSupportChat = (metadata?: any) =>
  http({ method: 'POST', url: '/support/widget/init', data: { metadata } })

export const sendSupportMessage = (data: {
  conversationId: number
  content: string
  contentType?: string
  metadata?: any
}) => http({ method: 'POST', url: '/support/widget/message', data })

export const sendMenuClick = (data: {
  conversationId: number
  menuId: string
  locale?: string
}) => http({ method: 'POST', url: '/support/widget/menu', data })

export const submitFeedback = (data: { messageId: number; positive: boolean }) =>
  http({ method: 'PATCH', url: '/support/widget/feedback', data })

export const getSupportHistory = (conversationId?: number) =>
  http({
    method: 'GET',
    url: '/support/widget/history',
    params: conversationId ? { conversationId } : {},
  })
