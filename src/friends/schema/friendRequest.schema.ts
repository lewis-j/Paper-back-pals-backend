import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import * as mongoose from 'mongoose';
import { Transform } from 'class-transformer';
import { status } from './friend-request-status';

export type FriendRequestsDocument = FriendRequest & mongoose.Document;

@Schema()
export class FriendRequest {
  @Transform(({ value }) => value.toString())
  _id: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  sender: User;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  reciever: User;
  @Prop({ type: String, enum: status, default: status[0] })
  status: string;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);
