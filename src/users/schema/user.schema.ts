import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
// import { UserBooks } from 'src/user-books/schema/userbooks.schema';
import { Exclude, Transform, Type } from 'class-transformer';
import { UserBooks } from 'src/user-books/schema/userbooks.schema';

export type UsersDocument = Users & Document;

@SchemaDecorator()
export class Users {
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

  @Prop({ type: [Schema.Types.ObjectId], ref: 'Users', default: null })
  @Type(() => Users)
  friends: Users;

  @Prop({ immutable: true, default: () => Date.now() })
  @Exclude()
  createdAt: Date;

  @Prop({ default: () => Date.now() })
  @Exclude()
  updatedAt: Date;
}

export const UsersSchema = SchemaFactory.createForClass(Users);

UsersSchema.pre<UsersDocument>('save', function () {
  this.updatedAt = new Date();
});
