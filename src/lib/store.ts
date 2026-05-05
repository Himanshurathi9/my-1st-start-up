import { create } from 'zustand'

interface OrderBadgeStore {
  newCount: number
  setNewCount: (count: number) => void
  increment: () => void
  decrement: () => void
}

interface RewardBadgeStore {
  activeCount: number
  setActiveCount: (count: number) => void
}

export const useOrderBadgeStore = create<OrderBadgeStore>((set) => ({
  newCount: 0,
  setNewCount: (count) => set({ newCount: count }),
  increment: () => set((s) => ({ newCount: s.newCount + 1 })),
  decrement: () => set((s) => ({ newCount: Math.max(0, s.newCount - 1) })),
}))

export const useRewardBadgeStore = create<RewardBadgeStore>((set) => ({
  activeCount: 0,
  setActiveCount: (count) => set({ activeCount: count }),
}))
