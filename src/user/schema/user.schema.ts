import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema, Types } from 'mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import { UserBooks } from 'src/user-books/schema/userbooks.schema';
import { FriendRequest } from 'src/friends/schema/friendRequest.schema';
import { BookRequest } from 'src/user-books/schema/bookRequest.schema';
import { Notifications } from 'src/notifications/schema/Notifications.schema';

export type UserDocument = User & Document;

@SchemaDecorator({
  timestamps: true,
  toJSON: {
    getters: true,
    virtuals: true,
  },
})
export class User {
  @Transform(
    ({ obj }) => {
      return obj._id.toString();
    },
    { toClassOnly: true },
  )
  _id: string;

  @Prop({ unique: true, index: true })
  @Exclude()
  firebase_id: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  profilePic: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  email_verified: boolean;

  @Prop({ type: Schema.Types.ObjectId, ref: 'UserBooks', default: null })
  @Type(() => UserBooks)
  currentRead: UserBooks;

  @Type(() => UserBooks)
  borrowedBooks: UserBooks[];

  @Type(() => UserBooks)
  ownedBooks: UserBooks[];

  @Type(() => BookRequest)
  bookRequest: UserBooks[];

  @Prop({
    type: [{ type: Schema.Types.ObjectId, ref: 'User', default: null }],
  })
  @Type(() => User)
  friends: User[];

  @Type(() => FriendRequest)
  friendRequestInbox: FriendRequest[];

  @Type(() => FriendRequest)
  friendRequestOutbox: FriendRequest[];
  @Type(() => Notifications)
  notifications: Notifications[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 'text' });

UserSchema.virtual('friendRequestInbox', {
  ref: 'FriendRequest',
  localField: '_id',
  foreignField: 'recipient',
});

UserSchema.virtual('friendRequestOutbox', {
  ref: 'FriendRequest',
  localField: '_id',
  foreignField: 'sender',
});

UserSchema.virtual('borrowedBooks', {
  ref: 'BookRequest',
  localField: '_id',
  foreignField: 'sender',
});

UserSchema.virtual('ownedBooks', {
  ref: 'UserBooks',
  localField: '_id',
  foreignField: 'owner',
});
UserSchema.virtual('bookRequest', {
  ref: 'BookRequest',
  localField: '_id',
  foreignField: 'sender',
});
UserSchema.virtual('notifications', {
  ref: 'Notifications',
  localField: '_id',
  foreignField: 'user',
});

const populateUser = async (findFunc) => {
  const user = await findFunc
    .populate([
      {
        path: 'friends',
        select: '_id, username profilePic',
      },
      {
        path: 'friendRequestOutbox',
        populate: { path: 'recipient', select: '_id username profilePic' },
        select: 'recipient -sender',
      },
      {
        path: 'friendRequestInbox',
        populate: { path: 'sender', select: '_id username profilePic' },
        select: 'sender -recipient',
      },
      {
        path: 'bookRequest',
        populate: [{ path: 'userBook', select: '_id' }],
      },
      {
        path: 'ownedBooks',
        populate: [
          'book',
          {
            path: 'currentRequest',
            populate: { path: 'sender', select: 'username profilePic' },
            select: 'status dueDate sender',
          },
        ],
      },
      {
        path: 'borrowedBooks',
        populate: {
          path: 'userBook',
          populate: [
            { path: 'book' },
            { path: 'currentRequest', select: 'dueDate status' },
            { path: 'owner', select: 'username profilePic' },
          ],
          select: 'book currentRequest owner',
        },
      },
      'notifications',
      { path: 'currentRead', populate: 'currentRequest owner book' },
    ])
    .exec();
  user.borrowedBooks = user.borrowedBooks.map(({ userBook }) => userBook);

  return user;
};

UserSchema.static('getAuthUser', async function (user_id: string) {
  return await populateUser(this.findById(user_id));
});

UserSchema.static('getFireUser', async function (firebase_id: string) {
  return await populateUser(this.findOne({ firebase_id: firebase_id }));
});

UserSchema.static('getUser', async function (user_id: string) {
  return await this.findById({ _id: user_id })
    .populate([
      {
        path: 'friends',
        select: '_id username profilePic',
      },
      {
        path: 'ownedBooks',
        populate: [
          'book',
          {
            path: 'currentRequest',
            populate: [{ path: 'sender', select: 'username profilePic' }],
            select: 'status sender dueDate',
          },
          { path: 'request', select: '_id' },
        ],
      },
      'borrowedBooks',
    ])
    .exec();
});
