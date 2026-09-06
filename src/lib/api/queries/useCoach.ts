import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { coachApi } from "../coach"
import type { ApprovalKind } from "@/core/use-cases/approve-proposal.use-case"

export const coachKeys = {
  session: ["coach-session"] as const,
}

export function useCoachSession() {
  return useQuery({
    queryKey: coachKeys.session,
    queryFn: () => coachApi.getSession(),
  })
}

export function useCoachTurn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: coachApi.turn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.session })
    },
  })
}

export function useApproveProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (kind: ApprovalKind) => coachApi.approve(kind),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.session })
      void queryClient.invalidateQueries({ queryKey: ["board"] })
    },
  })
}

export function useRejectProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (kind: ApprovalKind) => coachApi.reject(kind),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.session })
    },
  })
}

export function useProposePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => coachApi.plan(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.session })
    },
  })
}

export function useRunRetro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notes?: string) => coachApi.retro(notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coachKeys.session })
    },
  })
}
