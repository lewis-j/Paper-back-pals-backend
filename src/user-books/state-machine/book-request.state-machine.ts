import { BookRequestDocument } from '../schema/bookRequest.schema';
import { BookRequestStatus, bookRequestStatus } from '../schema/status-enums';

type UserRole = 'owner' | 'sender';

interface StateTransition {
  next: BookRequestStatus[];
  allowedUsers: UserRole[];
  validation?: (
    request: BookRequestDocument,
    imageFile?: Express.Multer.File,
  ) => boolean;
}

const isPictureRequired = (
  request: BookRequestDocument,
  imageFile?: Express.Multer.File,
) => !request.pictureRequired || !!imageFile;

const stateTransitions: Record<BookRequestStatus, StateTransition> = {
  [bookRequestStatus.CHECKED_IN]: {
    next: [bookRequestStatus.ACCEPTED],
    allowedUsers: ['owner'],
  },
  [bookRequestStatus.ACCEPTED]: {
    next: [bookRequestStatus.SENDING],
    allowedUsers: ['owner'],
    validation: isPictureRequired,
  },
  [bookRequestStatus.SENDING]: {
    next: [bookRequestStatus.CHECKED_OUT],
    allowedUsers: ['sender'],
    validation: isPictureRequired,
  },
  [bookRequestStatus.CHECKED_OUT]: {
    next: [bookRequestStatus.RETURN_REQUESTED, bookRequestStatus.IS_DUE],
    allowedUsers: ['owner', 'sender'],
  },
  [bookRequestStatus.RETURN_REQUESTED]: {
    next: [bookRequestStatus.IS_DUE],
    allowedUsers: ['owner'],
  },
  [bookRequestStatus.IS_DUE]: {
    next: [bookRequestStatus.RETURNING],
    allowedUsers: ['sender'],
    validation: isPictureRequired,
  },

  [bookRequestStatus.RETURNING]: {
    next: [bookRequestStatus.RETURNED],
    allowedUsers: ['owner'],
    validation: isPictureRequired,
  },
  [bookRequestStatus.RETURNED]: {
    next: [],
    allowedUsers: [],
  },

  [bookRequestStatus.DECLINED_BY_OWNER]: {
    next: [],
    allowedUsers: [],
  },
  [bookRequestStatus.CANCELED_BY_SENDER]: {
    next: [],
    allowedUsers: [],
  },
};

export const bookRequestStateMachine = {
  pictureRequiredStatuses: [
    ...new Set(
      Object.entries(stateTransitions)
        .filter(
          ([_, transition]) => transition.validation === isPictureRequired,
        )
        .flatMap(([_, transition]) => transition.next),
    ),
  ],

  canTransition(
    from: BookRequestStatus,
    to: BookRequestStatus,
    userRole: UserRole,
    request: BookRequestDocument,
    imageFile?: Express.Multer.File,
  ): boolean {
    if (!stateTransitions[from] || !stateTransitions[to]) {
      return false;
    }

    const transition = stateTransitions[from];
    return (
      transition.next.includes(to) &&
      transition.allowedUsers.includes(userRole) &&
      (!transition.validation || transition.validation(request, imageFile))
    );
  },

  isValidStatus(status: string): status is BookRequestStatus {
    return status in stateTransitions;
  },
};

export const pictureRequiredStatuses =
  bookRequestStateMachine.pictureRequiredStatuses;
