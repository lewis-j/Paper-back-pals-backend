import { Prop, Schema as SchemaDecorator, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';
import { UserBooks } from 'src/user-books/schema/userbooks.schema';

export type UsersDocument = Users & Document;

@SchemaDecorator()
export class Users {
  @Prop({ required: true })
  firebaseId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  profilePicture: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  email_verified: boolean;

  @Prop({type: Schema.Types.ObjectId, ref: 'UserBooks' })
  currentRead:  UserBooks;

  @Prop({ immutable: true, default: () => Date.now() })
  createdAt: Date;

  @Prop({ default: () => Date.now() })
  updatedAt: Date;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
