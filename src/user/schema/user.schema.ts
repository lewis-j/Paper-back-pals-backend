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
import { BookRequest } from 'src/user-books/schema/bookRequest.schema';
import mongoose from 'mongoose';
import {
  bookRequestPopulateOptions,
  transformBookRequest,
} from 'src/util/populate.utils';
import { friendRequestStatus } from 'src/friends/schema/friend-request-status';
import { bookRequestStatus } from 'src/user-books/schema/status-enums';

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

const populateUser = async (findFunc) => {
  const user = await findFunc
    .populate([
      {
        path: 'friends',
        select: '_id, username profilePic',
      },
      {
        path: 'friendRequestOutbox',
        match: {
          status: {
            $nin: [friendRequestStatus.ACCEPTED, friendRequestStatus.DECLINED],
          },
        },
        populate: { path: 'recipient', select: '_id username profilePic' },
        select: 'recipient -sender',
      },
      {
        path: 'friendRequestInbox',
        match: {
          status: {
            $nin: [friendRequestStatus.ACCEPTED, friendRequestStatus.DECLINED],
          },
        },
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
            path: 'requests',
            match: {
              status: {
                $nin: [
                  bookRequestStatus.RETURNED,
                  bookRequestStatus.RETURN_REQUESTED,
                  bookRequestStatus.DECLINED_BY_OWNER,
                  bookRequestStatus.CANCELED_BY_SENDER,
                ],
              },
            },
            select: '_id status dueDate currentPage createdAt',
            populate: { path: 'sender', select: '_id' },
          },
        ],
        select: 'book requests -owner',
      },
      {
        path: 'borrowedBooks',
        populate: bookRequestPopulateOptions,
        select: '_id userBook status currentPage dueDate',
      },
      { path: 'currentRead', select: '_id' },
    ])
    .exec();
  if (user?.borrowedBooks) {
    user.borrowedBooks = user.borrowedBooks.map(transformBookRequest);
  }

  return user;
};

UserSchema.static('getAuthUser', async function (user_id: string) {
  return await populateUser(this.findById(user_id));
});
//they should all have a firebase_id
UserSchema.static('getFireUser', async function (firebase_id: string) {
  console.log('getFireUser', firebase_id);
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
            path: 'requests',
            populate: { path: 'sender', select: '_id username profilePic' },
            select: '_id status sender dueDate currentPage',
          },
        ],
      },
      'borrowedBooks',
    ])
    .exec();
});
