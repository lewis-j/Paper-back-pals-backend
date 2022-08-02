enum requestTypeEnum {
  BookRequest = 'BookRequest',
  FriendRequest = 'FriendRequest',
}

class NotificationsMessages {
  readonly sender: string;
  readonly recipient: string;
}

export class CreateNotificationDto {
  readonly messages: NotificationsMessages;
  readonly requestType: requestTypeEnum;
  readonly requestRef: string;
}
