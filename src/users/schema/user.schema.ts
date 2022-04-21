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
  email: string;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
