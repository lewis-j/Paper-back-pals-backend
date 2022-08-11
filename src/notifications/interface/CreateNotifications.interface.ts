interface CreateNotifications {
  sender: BookUserPayload;
  recipient: BookUserPayload;
  requestPayload: RequestPayload;
}

interface UserPayload {
  _id: string;
  message: string;
}

interface BookUserPayload extends UserPayload {
  actionRequired: boolean;
}

export enum requestTypeEnum {
  BookRequest = 'BookRequest',
  FriendRequest = 'FriendRequest',
}

interface RequestPayload {
  requestType: requestTypeEnum;
  requestRef: string;
}

export default CreateNotifications;
