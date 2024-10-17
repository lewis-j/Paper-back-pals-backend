interface CreateNotifications {
  sender: UserPayload;
  recipient: UserPayload;
  requestPayload: RequestPayload;
}

interface UserPayload {
  _id: string;
  message: string;
  confirmation?: string;
}

// interface BookUserPayload extends UserPayload {
//   actionRequired: boolean;
// }

export enum requestTypeEnum {
  BookRequest = 'BookRequest',
  FriendRequest = 'FriendRequest',
}

interface RequestPayload {
  requestType: requestTypeEnum;
  requestRef: string;
}

export default CreateNotifications;
