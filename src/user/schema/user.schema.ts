import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
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
  @Transform(({ value }) => value.toString())
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
  friendRequestSent: FriendRequest[];

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

UserSchema.virtual('borrowedBooks', {
  ref: 'UserBooks',
  localField: '_id',
  foreignField: 'recipient',
});

UserSchema.virtual('ownedBooks', {
  ref: 'UserBooks',
  localField: '_id',
  foreignField: 'owner',
});

UserSchema.static('getAuthUser', async function (_id: string) {
  return await this.findById(_id)
    .populate([
      'friends',
      'friendRequestInbox',
      { path: 'ownedBooks', populate: ['book', 'owner'] },
      'borrowedBooks',
    ])
    .exec();
});

UserSchema.static('getFireUser', async function (firebase_id: string) {
  return await this.findOne({ firebase_id: firebase_id })
    .populate([
      'friends',
      'friendRequestInbox',
      { path: 'ownedBooks', populate: ['book', 'owner'] },
      'borrowedBooks',
    ])
    .exec();
});
