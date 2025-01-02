import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import * as mongoose from 'mongoose';
import { Transform, Type } from 'class-transformer';
import {
  friendRequestStatus,
  FriendRequestStatus,
} from './friend-request-status';

export interface FriendRequestsDocument extends mongoose.Document {
  _id: mongoose.Schema.Types.ObjectId;
  sender: User;
  recipient: User;
  status: FriendRequestStatus;
  statusHistory: StatusHistory[];
  updateStatus(options: StatusUpdateOptions): void;
}

export interface StatusUpdateOptions {
  status: string;
}

interface StatusHistory {
  status: string;
  timestamp: Date;
}

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
  @Prop([
    {
      status: { type: String, enum: Object.values(friendRequestStatus) },
      timestamp: { type: Date, default: Date.now },
    },
  ])
  statusHistory: StatusHistory[];
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

FriendRequestSchema.methods.updateStatus = function (
  options: StatusUpdateOptions,
) {
  this.status = options.status;

  const statusEntry: StatusHistory = {
    status: options.status,
    timestamp: new Date(),
  };

  if (!this.statusHistory) {
    this.statusHistory = [];
  }

  this.statusHistory.push(statusEntry);
};
