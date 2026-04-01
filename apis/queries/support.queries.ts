import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  initSupportChat,
  sendSupportMessage,
  sendMenuClick,
  submitFeedback,
  getSupportHistory,
} from '../requests/support.requests'

export const useSupportInit = (metadata?: any) =>
  useQuery({
    queryKey: ['support', 'init'],
    queryFn: () => initSupportChat(metadata).then((r) => r.data),
    staleTime: 5 * 60_000, // 5 min — don't re-init on every render
    retry: 1,
  })

export const useSendSupportMessage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: sendSupportMessage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  })
}

export const useSendMenuClick = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: sendMenuClick,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  })
}

export const useSubmitFeedback = () =>
  useMutation({ mutationFn: submitFeedback })

export const useSupportHistory = (conversationId?: number) =>
  useQuery({
    queryKey: ['support', 'history', conversationId],
    queryFn: () => getSupportHistory(conversationId).then((r) => r.data),
    enabled: !!conversationId,
  })
