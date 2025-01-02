export const friendRequestStatus = {
  PENDING: 'PENDING',
  REQUEST: 'REQUEST',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  REMOVED: 'REMOVED',
} as const;

export type FriendRequestStatus =
  typeof friendRequestStatus[keyof typeof friendRequestStatus];
