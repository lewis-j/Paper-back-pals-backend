export enum requestTypeEnum {
  BookRequest = 'BookRequest',
  FriendRequest = 'FriendRequest',
}

export class CreateRequestDto {
  readonly requestType: requestTypeEnum;
  readonly requestRef: string;
}
