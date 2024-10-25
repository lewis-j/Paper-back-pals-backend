import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema, Types } from 'mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import { UserBooks } from 'src/user-books/schema/userbooks.schema';
import { FriendRequest } from 'src/friends/schema/friendRequest.schema';
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
        populate: {
          path: 'sender',
          select: '_id username profilePic',
        },
        select: 'sender createdAt -recipient ',
      },
      {
        path: 'ownedBooks',
        populate: [
          {
            path: 'book',
          },
          {
            path: 'request',
            select: '_id status dueDate currentPage',
            populate: { path: 'sender', select: '_id' },
          },
        ],
        select: 'book request -owner', // Include fields you want and exclude owner
      },
      {
        path: 'borrowedBooks',
        populate: {
          path: 'userBook',
          populate: [
            { path: 'book' },
            { path: 'owner', select: 'username profilePic' },
          ],
          select: 'book owner',
        },
        select: '_id userBook status currentPage dueDate', // Make sure to include _id here
      },
      {
        path: 'notifications',
        options: { limit: 20 },
      },
      { path: 'currentRead', select: '_id' },
    ])
    .exec();
  if (user?.borrowedBooks) {
    user.borrowedBooks = user.borrowedBooks.map(
      ({ _id, userBook, status, currentPage, dueDate }) => {
        return {
          _id: userBook._id,
          book: userBook.book,
          owner: userBook.owner,
          request: { status, request_id: _id.toString() },
          currentPage,
          dueDate,
        };
      },
    );
  }

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
            path: 'request',
            populate: { path: 'sender', select: '_id username profilePic' },
            select: '_id status sender',
          },
        ],
      },
      'borrowedBooks',
    ])
    .exec();
});
