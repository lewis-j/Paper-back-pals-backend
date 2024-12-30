import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import * as mongoose from 'mongoose';
import { Transform, Type } from 'class-transformer';
import {
  friendRequestStatus,
  FriendRequestStatus,
} from './friend-request-status';

export type FriendRequestsDocument = FriendRequest & mongoose.Document;

@Schema({ timestamps: true })
export class FriendRequest {
  @Transform(
    ({ obj }) => {
      return obj._id.toString();
    },
    { toClassOnly: true },
  )
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  @Type(() => User)
  sender: User;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  @Type(() => User)
  recipient: User;
  @Prop({
    type: String,
    enum: Object.values(friendRequestStatus),
    default: friendRequestStatus.PENDING,
  })
  status: FriendRequestStatus;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);
