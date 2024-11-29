import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/user/schema/user.schema';

export interface NotificationsDocument
  extends Notifications,
    mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
})
export class Notifications {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  recipient: User;
  @Prop({ required: true, default: false })
  isRead: boolean;

  @Prop({ required: true })
  message: string;

  @Prop({ required: false })
  confirmation?: string;

  @Prop({
    required: true,
    enum: {
      values: ['BookRequest', 'FriendRequest'],
      message:
        "Please supply a valid client type.  Allowed: 'BookRequest' or 'FriendRequest'.",
    },
  })
  requestType: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'requestType',
  })
  requestRef: mongoose.Types.ObjectId;
}

export const NotificationsSchema = SchemaFactory.createForClass(Notifications);
