import { FriendRequestStatus } from 'src/friends/schema/friend-request-status';
import { BookRequestStatus } from 'src/user-books/schema/status-enums';

export type NotificationStatus = BookRequestStatus | FriendRequestStatus;
