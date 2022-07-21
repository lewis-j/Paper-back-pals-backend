import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema, Types } from 'mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import { UserBooks } from 'src/user-books/schema/userbooks.schema';
import { FriendRequest } from 'src/friends/schema/friendRequest.schema';

export type UserDocument = User & Document;

@SchemaDecorator({
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

  @Prop({ immutable: true, default: () => Date.now() })
  @Exclude()
  createdAt: Date;

  @Prop({ default: () => Date.now() })
  @Exclude()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 'text' });

UserSchema.pre<UserDocument>('save', function () {
  this.updatedAt = new Date();
});
UserSchema.virtual('friendRequestInbox', {
  ref: 'FriendRequest',
  localField: '_id',
  foreignField: 'reciever',
});

UserSchema.virtual('friendRequestOutbox', {
  ref: 'FriendRequest',
  localField: '_id',
  foreignField: 'sender',
});

UserSchema.virtual('borrowedBooks', {
  ref: 'UserBooks',
  localField: '_id',
  foreignField: 'recipient',
});
// UserSchema.virtual('borrowedBooks', {
//   ref: 'BookRequest',
//   localField: '_id',
//   foreignField: 'requester',
//     match: { checkedIn: false}
// });

UserSchema.virtual('ownedBooks', {
  ref: 'UserBooks',
  localField: '_id',
  foreignField: 'owner',
});

const populateUser = async (findFunc) => {
  return await findFunc
    .populate([
      {
        path: 'friends',
        select: '_id, username profilePic',
      },
      {
        path: 'friendRequestOutbox',
        populate: { path: 'reciever', select: '_id username profilePic' },
        select: 'reciever -sender',
      },
      {
        path: 'friendRequestInbox',
        populate: { path: 'sender', select: '_id username profilePic' },
        select: 'sender -reciever',
      },
      {
        path: 'ownedBooks',
        populate: ['book', 'owner'],
      },
      'borrowedBooks',
    ])
    .exec();
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
        select: '_id, username profilePic',
      },
      {
        path: 'ownedBooks',
        populate: ['book', 'owner'],
      },
      'borrowedBooks',
    ])
    .exec();
});
