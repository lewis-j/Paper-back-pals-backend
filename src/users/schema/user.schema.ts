import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsersDocument = Users & Document;

@Schema()
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

  @Prop({ immutable: true, default: () => Date.now() })
  createdAt: Date;

  @Prop({ default: () => Date.now() })
  updatedAt: Date;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
