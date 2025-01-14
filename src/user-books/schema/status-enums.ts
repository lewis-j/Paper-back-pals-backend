export const bookRequestStatus = {
  CHECKED_IN: 'CHECKED_IN',
  ACCEPTED: 'ACCEPTED',
  SENDING: 'SENDING',
  CHECKED_OUT: 'CHECKED_OUT',
  IS_DUE: 'IS_DUE',
  RETURNING: 'RETURNING',
  RETURNED: 'RETURNED',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  DECLINED_BY_OWNER: 'DECLINED_BY_OWNER',
  CANCELED_BY_SENDER: 'CANCELED_BY_SENDER',
} as const;

export const dueStatus = {
  DUE_TOMORROW: 'DUE_TOMORROW',
  DUE_SOON: 'DUE_SOON',
};

export type BookRequestStatus =
  typeof bookRequestStatus[keyof typeof bookRequestStatus];
